/**
 * modules/auth/auth.service.ts
 *
 * All business logic for authentication and user management.
 * Calls repositories for DB access, NotificationService for OTP delivery.
 * Never touches HTTP — all errors thrown via AuthErrors factories.
 */

import { TimeSpan, createDate } from "oslo";
import { SignJWT } from "jose";
import { validate as validateEmail } from "email-validator";
import { redis } from "../../config/redis";

import {
  AuthAttemptRepository,
  AuditLogRepository,
  OtpRepository,
  RateLimitRepository,
  ReferralCodeRepository,
  ReferralRepository,
  RoleRepository,
  SessionRepository,
  UserDeviceRepository,
  UserRepository,
  UserRoleRepository,
} from "./auth.repository";
// ✅ Split the imports
import type {
  LoginWithPin,
  LoginWithOtpToken,
  OtpRequest,
  OtpVerify,
  RegisterRequest,
  SendOtpRequest,
  SetPin,
  ResetPin,
  UpdateProfile,
  Pagination,
  UserPublic,
  LoginFailureReason,
  VerifyOtpRequest,
  VerifyDigilockerAccount,
} from "./auth.schema";

import { IdentityVerificationFactory } from "../../providers/verification/identity/identity.factory";

import { mapToUserPublic } from "./auth.schema"; // ← value imports

import { NotificationService } from "./notification.service";
import { AuthErrors } from "./auth.errors";
import { db } from "../../db";
import { env } from "../../config/env";
import { roleCache } from "../../lib/role-cache";
import { generateId, sha256Hex, hashPin, verifyPin } from "../../utils/hash";
import { generateOtp } from "../../utils/otp";
import { logger } from "../../core/logger";

// Repos are now injected via dependency injection in the constructor.

export interface AuthRepositories {
  userRepo: UserRepository;
  otpRepo: OtpRepository;
  sessionRepo: SessionRepository;
  roleRepo: RoleRepository;
  userRoleRepo: UserRoleRepository;
  authRepo: AuthAttemptRepository;
  referralRepo: ReferralRepository;
  referralCodeRepo: ReferralCodeRepository;
  auditRepo: AuditLogRepository;
  deviceRepo: UserDeviceRepository;
  abuseRepo: RateLimitRepository;
  kycProfileRepo: KycProfileRepository;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// ── JWT secrets ───────────────────────────────────────────────────────────────

const OTP_TOKEN_SECRET = new TextEncoder().encode(env.OTP_TOKEN_SECRET);
const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);

/**
 * Issues a short-lived "OTP Bridge Token" (JWT).
 * This token serves as a cryptographically signed proof that the user has
 * successfully verified an OTP. It must be presented to the `/register`
 * or `/login/otp` endpoints to complete the flow.
 *
 * @param phone - The verified E.164 phone number.
 * @param purpose - The purpose for which the OTP was verified (e.g., 'phone_verification').
 * @returns A promise resolving to a signed HS256 JWT.
 */
async function issueOtpToken(phone: string, purpose: string): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({ phone, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${env.OTP_TOKEN_TTL_MIN}m`)
    .sign(OTP_TOKEN_SECRET);
}

import { ROLES, type RoleSlug } from "../../shared";
import { KycStatus } from "../profile/profile.schema";
import { KycProfileRepository } from "../profile/profile.repository";

const hasAnyRole = (userRoles: string[], rolesToCheck: string[]) =>
  userRoles.some((role) => rolesToCheck.includes(role));

/**
 * Robustly checks if an actor has a specific role by its slug.
 * Safely resolves the slug to its current UUID via the RoleCache.
 */
const hasRoleBySlug = (actorRoleIds: string[], slug: RoleSlug): boolean => {
  try {
    const roleId = roleCache.getId(slug);
    return actorRoleIds.includes(roleId);
  } catch (err) {
    // If slug is unknown or cache not ready, fail-safe to false
    return false;
  }
};

/**
 * Signs a standard JWT access token for a user.
 * The payload includes the User ID (sub), the unique Access Token JTI,
 * the Session ID (sid), and the user's assigned roles.
 *
 * @param payload - The data to include in the token.
 * @returns A promise resolving to the signed HS256 JWT.
 */
async function signAccessToken(payload: {
  sub: string;
  jti: string;
  sid: string;
  roleIds: string[];
  kycStatus: Record<string, KycStatus>;
}): Promise<string> {
  return new SignJWT({
    roleIds: payload.roleIds,
    sid: payload.sid,
    kycStatus: payload.kycStatus,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_TTL_MIN ?? 15}m`)
    .sign(ACCESS_SECRET);
}

/**
 * Blacklists a single session's Access Token JTI in Redis.
 */
async function blacklistSession(
  session: { accessTokenJti?: string | null },
  reason: string,
) {
  if (session.accessTokenJti) {
    await redis.setex(
      `revoke_jti:${session.accessTokenJti}`,
      (env.JWT_ACCESS_TTL_MIN ?? 15) * 60,
      reason,
    );
  }
}

/**
 * Blacklists ALL active Access Token JTIs for a user in Redis.
 */
async function blacklistUserSessions(
  userId: string,
  repos: AuthRepositories,
  reason: string,
) {
  const activeSessions = await repos.sessionRepo.listActiveByUser(userId);
  for (const session of activeSessions) {
    await blacklistSession(session, reason);
  }
}

// ── 1. AuthService ────────────────────────────────────────────────────────────

export class AuthServiceImpl {
  constructor(private readonly repos: AuthRepositories) { }
  /**
   * Orchestrates the "Send OTP" flow:
   * 1. Normalizes the phone number.
   * 2. Checks rate limits (IP-based and Phone-based) via the Abuse Repository.
   * 3. Checks if the account is banned or suspended to prevent sending codes to restricted accounts.
   * 4. Generates a fresh 6-digit OTP and hashes it for secure storage.
   * 5. Invalidates any existing active OTPs for this phone/purpose.
   * 6. Stores the new OTP record in the database within a transaction.
   * 7. Hands off the OTP to the NotificationService for SMS delivery.
   *
   * @param body - The request containing the user's phone number.
   * @param meta - Metadata containing the client's IP address.
   * @returns A promise resolving to the OTP expiration timestamp.
   * @throws AuthErrors.Common.rateLimited if the IP or phone is blocked.
   * @throws AuthErrors.Otp.deliveryFailed if the SMS service fails.
   */
  async sendOtp(
    body: SendOtpRequest,
    meta: { ip: string },
  ): Promise<{ expiresAt: string }> {
    const phone = body.phone;

    // ── Persistent abuse check (Postgres layer) ─────────────────────────────
    // Enforces admin-set blockedUntil bans (survives Redis restarts).
    // Skipped when RATE_LIMIT_BYPASS=true — kept in sync with the Redis middleware.
    if (!env.RATE_LIMIT_BYPASS) {
      const ipBlocked = await this.repos.abuseRepo.checkAndIncrement(
        meta.ip,
        "otp:send:ip",
        {
          max: env.RATE_LIMIT_OTP_SEND_MAX,
          windowSec: env.RATE_LIMIT_OTP_WINDOW_SEC,
        },
      );
      if (ipBlocked)
        throw AuthErrors.Common.rateLimited(
          "IP blocked: too many OTP requests",
        );

      const phoneBlocked = await this.repos.abuseRepo.checkAndIncrement(
        phone,
        "otp:send:phone",
        {
          max: 5,
          windowSec: env.RATE_LIMIT_OTP_WINDOW_SEC,
        },
      );
      if (phoneBlocked)
        throw AuthErrors.Common.rateLimited(
          "Phone blocked: too many OTP requests",
        );
    }

    // Security: Don't even send an OTP if the account is already locked by an admin.
    const user = await this.repos.userRepo.findByPhone(phone);
    if (user) {
      // FIX: Use generic error for banned/suspended to prevent enumeration
      if (user.status === "banned" || user.status === "suspended") {
        logger.warn(
          { phone, status: user.status },
          "Send OTP attempted for restricted user",
        );
        // We still return success to keep the attacker guessing
        return {
          expiresAt: createDate(
            new TimeSpan(env.OTP_TTL_MIN, "m"),
          ).toISOString(),
        };
      }
    }

    const otp = generateOtp();
    const otpHash = await hashPin(otp);
    const expiresAt = createDate(new TimeSpan(env.OTP_TTL_MIN, "m"));

    await db.transaction(async (tx) => {
      const txOtpRepo = new OtpRepository(tx as unknown as typeof db);
      // Clean up old OTPs before creating a new one.
      await txOtpRepo.invalidateActiveByPhone(phone, "phone_verification");
      await txOtpRepo.create({
        userId: user?.id ?? null,
        phone,
        email: null,
        purpose: "phone_verification",
        otpHash,
        expiresAt,
        ipAddress: meta.ip,
      });
    });

    try {
      // Trigger the actual SMS delivery.
      await NotificationService.sendSms(phone, otp);
    } catch (error) {
      logger.error({ err: error, phone }, "SMS delivery failed");
      throw AuthErrors.Otp.deliveryFailed();
    }

    return { expiresAt: expiresAt.toISOString() };
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Orchestrates the "Verify OTP" flow:
   * 1. Retrieves the active OTP record for the phone number.
   * 2. Increments the attempt counter ATOMICALLY and checks against the max limit.
   * 3. Verifies the provided 6-digit code against the stored hash.
   * 4. Marks the OTP as verified and consumed in a single atomic database operation.
   * 5. Determines if the user is already registered (determines downstream UI flow).
   * 6. Issues a short-lived "OTP Bridge Token" (JWT) as proof of verification.
   * 7. Logs the successful verification event to the audit log.
   *
   * @param body - The request containing the phone and OTP code.
   * @param meta - Metadata containing the client's IP address for auditing.
   * @returns A promise resolving to registration status and the bridge token.
   * @throws AuthErrors.Otp.notFound if no active OTP exists.
   * @throws AuthErrors.Otp.maxAttempts if the brute-force limit is reached.
   * @throws AuthErrors.Otp.invalid if the code is incorrect.
   */
  async verifyOtp(
    body: VerifyOtpRequest,
    meta: { ip: string },
  ): Promise<{ isRegistered: boolean; otpToken: string }> {
    const phone = body.phone;

    // Look for a non-expired, non-consumed OTP.
    const record = await this.repos.otpRepo.findActiveByPhone(
      phone,
      "phone_verification",
    );
    if (!record) throw AuthErrors.Otp.notFound();

    // 1. Increment attempts ATOMICALLY FIRST (TOCTOU protection).
    // We count the attempt BEFORE we verify it to prevent in-flight flooding.
    const updated = await this.repos.otpRepo.incrementAndGetAttempts(record.id);
    if (!updated) throw AuthErrors.Otp.notFound();

    // 2. Immediate threshold check BEFORE the expensive hash.
    // Allow up to exactly maxAttempts total increments.
    if (updated.attempts > record.maxAttempts) {
      throw AuthErrors.Otp.maxAttempts();
    }

    logger.debug(
      {
        recordId: record.id,
        phone,
        attempts: updated.attempts,
        max: record.maxAttempts,
      },
      "OTP verify attempt registered",
    );

    // 3. Verify the decrypted OTP (Expensive CPU work).
    const valid = await verifyPin(record.otpHash, body.otp);

    if (!valid) {
      logger.warn(
        { phone, attempts: updated.attempts, maxAttempts: record.maxAttempts },
        "OTP verification failed",
      );
      // If this specific failure was the last one allowed, throw specialized error.
      if (updated.attempts >= record.maxAttempts)
        throw AuthErrors.Otp.maxAttempts();
      throw AuthErrors.Otp.invalid();
    }

    // Consume the OTP so it cannot be used again.
    await this.repos.otpRepo.markVerifiedAndConsume(record.id);

    const existingUser = await this.repos.userRepo.findByPhone(phone);
    const isRegistered = !!existingUser;

    // Issue the bridge token with a specific purpose to prevent cross-purpose reuse.
    const otpToken = await issueOtpToken(phone, "phone_verification");

    await this.repos.auditRepo.create({
      actorId: existingUser?.id ?? null,
      actorIp: meta.ip,
      action: "otp.phone_verification_verified",
      resource: "otp_verification",
      resourceId: record.id,
    });

    return { isRegistered, otpToken };
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Orchestrates User Registration:
   * 1. Validates the "OTP Bridge Token" to ensure the phone was recently verified.
   * 2. Revokes the bridge token in Redis to prevent reuse (single-use enforcement).
   * 3. Checks if the phone is already registered (race condition protection).
   * 4. Executes a database transaction to atomically:
   *    - Create the user record.
   *    - Assign the default "customer" role.
   *    - Link the user to a referrer if a valid code was provided.
   *    - Generate the user's own unique referral code for future sharing.
   *    - Record the registration event in the audit log.
   * 5. Initializes the first login session and returns the access/refresh tokens.
   *
   * @param body - registration details (name, phone, optional referralCode).
   * @param meta - Metadata including IP, User Agent, and Device Info.
   * @returns A promise resolving to the session tokens and user data.
   * @throws AuthErrors.User.alreadyExists if the phone is taken.
   */
  async register(
    body: RegisterRequest & { phone: string },
    meta: {
      ip: string;
      userAgent: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    const phone = body.phone;

    const existing = await this.repos.userRepo.findByPhone(phone);
    if (existing)
      throw AuthErrors.User.alreadyExists("Phone number is already registered");

    // All-or-nothing: ensure we don't end up with a user who has no role or no referral code.
    const user = await db.transaction(async (tx) => {
      const txUserRepo = new UserRepository(tx as unknown as typeof db);
      const txReferralCodeRepo = new ReferralCodeRepository(
        tx as unknown as typeof db,
      );
      const txReferralRepo = new ReferralRepository(tx as unknown as typeof db);
      const txAuditRepo = new AuditLogRepository(tx as unknown as typeof db);
      const txRoleRepo = new RoleRepository(tx as unknown as typeof db);
      const txUserRoleRepo = new UserRoleRepository(tx as unknown as typeof db);

      // 1. Create the core user record.
      let newUser;
      try {
        newUser = await txUserRepo.create({
          name: body.name,
          phone,
          phoneVerifiedAt: new Date(),
          status: "active",
        });
      } catch (err: any) {
        if (err.code === "23505") {
          throw AuthErrors.User.alreadyExists(
            "Phone number is already registered",
          );
        }
        throw err;
      }

      // 2. Assign the default 'customer' role.
      const role = await txRoleRepo.findBySlug("customer");
      if (role) {
        await txUserRoleRepo.assign({ userId: newUser.id, roleId: role.id });
      }

      // 3. Handle Referrals.
      if (body.referralCode) {
        const code = await txReferralCodeRepo.findActiveByCode(
          body.referralCode,
        );
        // Link the new user to their referrer.
        if (code && code.userId !== newUser.id) {
          await txReferralRepo.create({
            referrerId: code.userId,
            refereeId: newUser.id,
            referralCodeId: code.id,
            codeUsedAt: new Date(),
          });
          await txReferralCodeRepo.incrementUsage(code.id);
        }
      }

      // 4. Generate the user's own referral code for sharing.
      await txReferralCodeRepo.create({
        userId: newUser.id,
        code: `REF${generateId(8).toUpperCase()}`,
      });

      // 5. Track the registration event.
      await txAuditRepo.create({
        actorId: newUser.id,
        actorIp: meta.ip,
        action: "user.registered",
        resource: "user",
        resourceId: newUser.id,
        after: { phone: newUser.phone, name: newUser.name },
      });

      return newUser;
    });

    // 6. Create the session and return tokens.
    return this._createSession(user, "otp", meta);
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Orchestrates Login with PIN:
   * 1. Normalizes phone and checks persistent abuse (rate limits) in the database.
   * 2. Retrieves the user and checks existence, deletion status, and account bans/suspensions.
   * 3. Anti-Brute Force: Checks if the account is currently locked (failed PIN attempts).
   * 4. Ensures a PIN is actually set on the account.
   * 5. Verifies the provided 6-digit PIN against the secure hash.
   * 6. On failure: Increments the fail counter and locks the account if the threshold is reached.
   * 7. On success: Resets the fail counter, checks for 2FA requirement, and creates a new session.
   * 8. Records the auth attempt (success or failure) in the audit log.
   *
   * @param body - The request containing phone and PIN.
   * @param meta - Metadata including IP, User Agent, and Device Info.
   * @returns A promise resolving to the session tokens and user data.
   * @throws AuthErrors.Auth.invalidCredentials for wrong PIN or non-existent user.
   * @throws AuthErrors.Common.accountLocked if the lockout period is active.
   * @throws AuthErrors.Auth.twoFactorRequired if TOTP is enabled.
   */
  async loginWithPin(
    body: LoginWithPin,
    meta: {
      ip: string;
      userAgent: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    const phone = body.phone;

    // ── Persistent abuse check (Postgres layer) ─────────────────────────────
    // Enforces admin-set blockedUntil bans for repeated login failures.
    // Skipped when RATE_LIMIT_BYPASS=true — kept in sync with the Redis middleware.
    if (!env.RATE_LIMIT_BYPASS) {
      const ipLoginBlocked = await this.repos.abuseRepo.checkAndIncrement(
        meta.ip,
        "login:pin:ip",
        {
          max: env.RATE_LIMIT_LOGIN_PIN_MAX,
          windowSec: env.RATE_LIMIT_WINDOW_MIN * 60,
        },
      );
      if (ipLoginBlocked)
        throw AuthErrors.Common.rateLimited(
          "IP blocked: too many login attempts",
        );

      const phoneLoginBlocked = await this.repos.abuseRepo.checkAndIncrement(
        phone,
        "login:pin:phone",
        { max: 5, windowSec: env.RATE_LIMIT_WINDOW_MIN * 60 },
      );
      if (phoneLoginBlocked)
        throw AuthErrors.Common.rateLimited(
          "Phone blocked: too many login attempts",
        );
    }

    const user = await this.repos.userRepo.findByPhone(phone);

    // Helper to log auth attempts (success or failure).
    const recordAttempt = async (
      success: boolean,
      failureReason?: LoginFailureReason,
      sessionId?: string,
    ) => {
      await this.repos.authRepo.create({
        userId: user?.id ?? null,
        phoneAttempted: phone,
        method: "pin",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        success,
        failureReason: failureReason ?? null,
        sessionId: sessionId ?? null,
      });
    };

    // 1. Basic account checks.
    if (!user || user.deletedAt) {
      await recordAttempt(false, "account_not_found");
      throw AuthErrors.Auth.invalidCredentials();
    }

    if (user.status === "banned") {
      await recordAttempt(false, "account_locked");
      throw AuthErrors.Auth.accountBanned();
    }

    if (user.status === "suspended") {
      await recordAttempt(false, "account_locked");
      throw AuthErrors.Auth.accountSuspended();
    }

    // 2. Anti-brute force: check if currently locked.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await recordAttempt(false, "too_many_attempts");
      throw AuthErrors.Common.accountLocked(
        `Account locked until ${user.lockedUntil.toISOString()}`,
      );
    }

    if (!user.pinHash) {
      await recordAttempt(false, "invalid_credentials");
      throw AuthErrors.Pin.notSet(
        "No PIN set. Please login via OTP and set a PIN",
      );
    }

    // 3. Increment failures ATOMICALLY FIRST (TOCTOU protection).
    // We count the attempt BEFORE we verify it to prevent in-flight flooding.
    // This stops attackers from using the 100ms hashing window to get extra guesses.
    const failures = await this.repos.userRepo.incrementFailedLogins(user.id);

    // 4. Immediate threshold check.
    if (failures > MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      await this.repos.userRepo.lockUntil(user.id, lockUntil);
      await recordAttempt(false, "too_many_attempts");
      throw AuthErrors.Pin.locked();
    }

    // 5. Verify PIN (Slow Cryptographic Hash).
    const pinValid = await verifyPin(user.pinHash, body.pin);

    if (!pinValid) {
      // If this was the final allowed attempt, lock the account now.
      if (failures >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await this.repos.userRepo.lockUntil(user.id, lockUntil);
        await recordAttempt(false, "too_many_attempts");
        throw AuthErrors.Pin.locked();
      }

      await recordAttempt(false, "invalid_credentials");
      throw AuthErrors.Pin.invalid();
    }

    // 6. Two-Factor check (identity verification).
    if (user.twoFactorEnabled) throw AuthErrors.Auth.twoFactorRequired();

    // 7. Success: Clean up counter and create session.
    await this.repos.userRepo.resetFailedLogins(user.id);
    const result = await this._createSession(user, "pin", meta);
    await recordAttempt(true, undefined, result.sessionId);

    return result;
  }

  /**
   * Marks a user's tokens as stale in Redis.
   * Forces the next request from ANY of the user's active access tokens
   * to fail with a 401 TOKEN_STALE, triggering a silent refresh.
   */
  async markTokensStale(userId: string, reason: string): Promise<void> {
    const TTL = (env.JWT_ACCESS_TTL_MIN ?? 15) * 60;
    await redis.setex(`stale_user:${userId}`, TTL, reason);
    logger.info({ userId, reason }, "User tokens marked as stale");
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Orchestrates Login with OTP Token:
   * 1. Validates the "OTP Bridge Token" to ensures the user just verified their phone.
   * 2. Revokes the bridge token (single-use).
   * 3. Checks if the account exists and is not banned or suspended.
   * 4. Creates a new session and returns the tokens.
   * 5. Tracks the authentication event in the audit log.
   *
   * @param body - The request containing the `phone`.
   * @param meta - Metadata including IP, User Agent, and Device Info.
   * @returns A promise resolving to the session tokens and user data.
   * @throws AuthErrors.User.notFound if the account doesn't exist (requires registration).
   */
  async loginWithOtpToken(
    body: { phone: string },
    meta: {
      ip: string;
      userAgent: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    // Verified phone comes from the controller after guard check.
    const phone = body.phone;
    const user = await this.repos.userRepo.findByPhone(phone);

    if (!user || user.deletedAt) {
      // Log failure: login attempted via OTP but account not found.
      await this.repos.authRepo.create({
        userId: null,
        phoneAttempted: phone,
        method: "otp",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        success: false,
        failureReason: "account_not_found",
        sessionId: null,
      });
      throw AuthErrors.User.notFound("User not found. Please register first");
    }

    if (user.status === "banned") throw AuthErrors.Auth.accountBanned();
    if (user.status === "suspended") throw AuthErrors.Auth.accountSuspended();

    // Create session tokens.
    const result = await this._createSession(user, "otp", meta);

    // Track successful login.
    await this.repos.authRepo.create({
      userId: user.id,
      phoneAttempted: phone,
      method: "otp",
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      success: true,
      failureReason: null,
      sessionId: result.sessionId,
    });

    return result;
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Logs out a specific session:
   * 1. Retrieves the session and verifies ownership (actorId matches user).
   * 2. Skips gracefully if the session is already inactive (logged_out or revoked).
   * 3. Marks the record as `logged_out` in the database.
   * 4. Blacklists the Access Token JTI in Redis for immediate global invalidation.
   * 5. Logs the logout event to the audit trail.
   *
   * @param sessionId - The UUID of the session to terminate.
   * @param meta - Metadata containing the actor ID and client IP.
   */
  async signOut(
    sessionId: string,
    meta: { actorId: string; ip: string },
  ): Promise<void> {
    const session = await this.repos.sessionRepo.findById(sessionId);
    if (!session || session.userId !== meta.actorId)
      throw AuthErrors.Session.notFound();

    // 2. Blacklist the JTI in Redis for immediate global invalidation.
    // This protects against session takeover even if the access token hasn't expired.
    await blacklistSession(session, "logged_out");

    await this.repos.sessionRepo.logout(sessionId);

    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "user.sign_out",
      resource: "session",
      resourceId: sessionId,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Logs out ALL active sessions for the current user.
   * This is a critical security feature for users who have lost a device or suspect account compromise.
   * Revokes all active tokens and blacklists their JTIs.
   *
   * @param meta - Metadata containing the actor ID and client IP.
   */
  async signOutAll(meta: { actorId: string; ip: string }): Promise<void> {
    // 1. Blacklist all currently active Access Token JTIs in Redis.
    await blacklistUserSessions(meta.actorId, this.repos, "sign_out_all");

    await this.repos.sessionRepo.revokeAllByUser(
      meta.actorId,
      "user_sign_out_all",
    );

    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "user.sign_out_all",
      resource: "user",
      resourceId: meta.actorId,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Rotates a session's tokens (Refresh Token Rotation):
   * 1. Hashes the provided Refresh Token and looks it up in the database.
   * 2. REUSE DETECTION: If the token has already been rotated (checked via Redis grace-period cache),
   *    revokes the entire session immediately as a security breach measure.
   * 3. Verifies the session is active and not expired.
   * 4. Generates a new Refresh Token and updates its hash in the database.
   * 5. Generates a new Access Token JTI (invalidating the old Access Token globally).
   * 6. Blacklists the old JTI in Redis for its remaining TTL.
   * 7. Returns a brand new Access Token and Refresh Token.
   *
   * @param rawRefreshToken - The raw refresh token string from the client.
   * @param meta - Metadata containing the client IP.
   * @returns A promise resolving to the new token pair and expiration Date.
   * @throws AuthErrors.Auth.sessionExpired if the token is invalid, used, or expired.
   */
  async refreshSession(
    rawRefreshToken: string,
    meta: { ip: string },
  ): Promise<{
    accessToken: string;
    accessTokenJti: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    const tokenHash = await sha256Hex(rawRefreshToken);

    // 1. REUSE DETECTION: Check if this token was already rotated.
    // We store rotated tokens in Redis for a grace period (e.g., 5 mins).
    const reuseCheck = await redis.get(`rotated_rt:${tokenHash}`);
    if (reuseCheck) {
      logger.warn(
        { tokenHash, sessionId: reuseCheck, ip: meta.ip },
        "Refresh token reuse detected — revoking session",
      );
      // Critical security action: Revoke the entire session as it may be compromised.
      await this.repos.sessionRepo.revoke(
        reuseCheck,
        "refresh_token_reuse_detected",
      );
      throw AuthErrors.Auth.sessionExpired(
        "Security breach: Token reuse detected",
      );
    }

    const session =
      await this.repos.sessionRepo.findByRefreshTokenHash(tokenHash);

    // Only allow refresh for active, non-expired sessions.
    if (!session) {
      logger.warn({ tokenHash }, "Refresh session not found by hash");
      throw AuthErrors.Auth.sessionExpired();
    }

    if (session.status !== "active") {
      logger.warn(
        { sessionId: session.id, status: session.status },
        "Refresh session is not active",
      );
      throw AuthErrors.Auth.sessionExpired();
    }

    if (session.expiresAt < new Date()) {
      logger.warn(
        { sessionId: session.id, expiresAt: session.expiresAt },
        "Refresh session expired",
      );
      throw AuthErrors.Auth.sessionExpired();
    }

    // 2. ROTATE REFRESH TOKEN
    const newRefreshToken = generateId(40);
    const newRefreshTokenHash = await sha256Hex(newRefreshToken);

    // 3. ROTATE ACCESS TOKEN JTI
    const newJti = crypto.randomUUID();

    // Persist rotation
    await this.repos.sessionRepo.update(session.id, {
      refreshTokenHash: newRefreshTokenHash,
      accessTokenJti: newJti,
    });
    await this.repos.sessionRepo.touchLastActive(session.id);

    // 4. MARK OLD TOKEN AS ROTATED (Grace period for network lag)
    // We store for 5 minutes. If it's used again after this, it's a definite reuse.
    await redis.setex(`rotated_rt:${tokenHash}`, 300, session.id);

    // REDIS FIX: Blacklist the old JTI
    await blacklistSession(session, "rotated");

    // Build roles list for the JWT payload.
    const userRoles = await this.repos.userRoleRepo.findByUserId(
      session.userId,
    );
    const roleIds = userRoles.map((r) => r.roleId);

    const userRoleKyc = await this.repos.kycProfileRepo.listByUser(
      session.userId,
    );

    const kycStatus = Object.fromEntries(
      userRoleKyc.map((r) => [r.roleId, r.status]),
    );

    const accessToken = await signAccessToken({
      sub: session.userId,
      jti: newJti,
      sid: session.id,
      roleIds,
      kycStatus,
    });

    // 4. Success: Clear stale flag if present and return new tokens.
    await redis.del(`stale_user:${session.userId}`);

    return {
      accessToken,
      accessTokenJti: newJti,
      refreshToken: newRefreshToken,
      expiresAt: session.expiresAt,
    };
  }

  // ── Private: shared session creation ──────────────────────────────────────

  /**
   * Internal Helper: Securely creates and persists a new login session.
   * 1. Generates a high-entropy Refresh Token and its SHA-256 hash.
   * 2. Persists the session record with client metadata (IP, User Agent, Device Info).
   * 3. Device Tracking: Upserts the device fingerprint to track recognized hardware.
   * 4. Metadata Update: Updates the user's `last_login_at` and `last_login_ip`.
   * 5. Audit: Logs the successful sign-in event.
   * 6. JWT Issuance: Signs the initial Access Token linked to this session's unique JTI.
   *
   * @param user - The user object (requires `id`).
   * @param method - The auth method used ('otp' or 'pin').
   * @param meta - Metadata from the HTTP request.
   * @returns A promise resolving to the full session details and tokens.
   */
  private async _createSession(
    user: { id: string },
    method: "otp" | "pin",
    meta: {
      ip: string;
      userAgent: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    const expiresAt = createDate(new TimeSpan(env.JWT_REFRESH_TTL_DAYS, "d"));
    const accessTokenJti = crypto.randomUUID();
    const refreshToken = generateId(40);
    const refreshTokenHash = await sha256Hex(refreshToken);

    // 1. Persist the session.
    const session = await this.repos.sessionRepo.create({
      userId: user.id,
      refreshTokenHash,
      accessTokenJti,
      expiresAt,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      ipCountry: null,
      deviceInfo: meta.deviceInfo ?? {},
    });

    // 2. Track device for security lists/alerts.
    if (meta.deviceInfo?.fingerprint) {
      await this.repos.deviceRepo.upsert({
        userId: user.id,
        deviceFingerprint: meta.deviceInfo.fingerprint as string,
        lastIp: meta.ip,
        lastActiveAt: new Date(),
      });
    }

    // 3. Update user metadata.
    await this.repos.userRepo.updateLastLogin(user.id, meta.ip);

    // 4. Trace why this session exists.
    await this.repos.auditRepo.create({
      actorId: user.id,
      actorIp: meta.ip,
      action: `user.sign_in_${method}`,
      resource: "session",
      resourceId: session.id,
    });

    const fullUser = await this.repos.userRepo.findById(user.id);
    if (!fullUser) throw AuthErrors.User.sessionLoadFailed();

    const userRoles = await this.repos.userRoleRepo.findByUserId(user.id);
    const roleIds = userRoles.map((r) => r.roleId);

    const userRoleKyc = await this.repos.kycProfileRepo.listByUser(
      session.userId,
    );

    const kycStatus = Object.fromEntries(
      userRoleKyc.map((r) => [r.roleId, r.status]),
    );

    // 5. Issue final access token linked to this session JTI.
    const accessToken = await signAccessToken({
      sub: user.id,
      jti: accessTokenJti,
      sid: session.id,
      roleIds,
      kycStatus,
    });

    return {
      accessToken,
      accessTokenJti,
      sessionId: session.id,
      refreshToken,
      expiresAt,
      user: mapToUserPublic(fullUser),
    };
  }
}

// ── 2. OtpService ─────────────────────────────────────────────────────────────

/**
 * Service for managing One-Time Passwords (OTP) for authenticated users.
 */
export class OtpServiceImpl {
  /**
   * Initializes the OtpServiceImpl.
   * @param repos - Authentication repositories.
   */
  constructor(private readonly repos: AuthRepositories) { }

  /**
   * Generates and sends a purpose-driven OTP to an authenticated user.
   * Purposes include `phone_verification`, `email_verification`, `two_factor_auth`, etc.
   *
   * @param body - The OTP request containing purpose and optional phone/email.
   * @param meta - Metadata containing the IP and actor ID.
   * @returns A promise resolving to the OTP expiration timestamp.
   */
  async request(
    body: OtpRequest,
    meta: { ip: string; actorId: string },
  ): Promise<{ expiresAt: string }> {
    const user = await this.repos.userRepo.findById(meta.actorId);
    if (!user) throw AuthErrors.User.notFound();

    // Resolve OTP target: use explicit phone/email from body, or fall back
    // to the user's registered phone.
    const phone = body.phone ?? user.phone ?? null;
    const email = body.email ?? null;

    const otp = generateOtp();
    const otpHash = await hashPin(otp);
    const expiresAt = createDate(new TimeSpan(env.OTP_TTL_MIN, "m"));

    await db.transaction(async (tx) => {
      const txOtpRepo = new OtpRepository(tx as unknown as typeof db);
      if (phone) {
        await txOtpRepo.invalidateActiveByPhone(phone, body.purpose);
      } else {
        await txOtpRepo.invalidateActive(user.id, body.purpose);
      }
      await txOtpRepo.create({
        userId: user.id,
        phone,
        email,
        purpose: body.purpose,
        otpHash,
        expiresAt,
        ipAddress: meta.ip,
      });
    });

    await NotificationService.send({ phone, email }, otp);

    return { expiresAt: expiresAt.toISOString() };
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Verifies an OTP code for an authenticated user.
   * Handles diverse purposes:
   * - `phone_verification`: Marks phone as verified.
   * - `enable_2fa`/`disable_2fa`: Toggles 2FA status.
   * - `pin_reset`/`delete_account`: Issues an OTP Bridge Token for the final action.
   *
   * @param body - The verification data (otp, purpose, optional target).
   * @param meta - Metadata containing IP and actor ID.
   * @returns A promise resolving to verification status and an optional bridge token.
   * @throws AuthErrors.Otp.notFound if no active OTP is found.
   * @throws AuthErrors.Otp.maxAttempts if brute-force limit is reached.
   */
  async verify(
    body: OtpVerify,
    meta: { ip: string; actorId: string },
  ): Promise<{ verified: true }> {
    const user = await this.repos.userRepo.findById(meta.actorId);
    if (!user) throw AuthErrors.User.notFound();

    let record;
    if (body.phone) {
      record = await this.repos.otpRepo.findActiveByPhone(
        body.phone,
        body.purpose,
      );
    } else if (body.email) {
      record = await this.repos.otpRepo.findActiveByEmail(
        body.email,
        body.purpose,
      );
    } else {
      record = await this.repos.otpRepo.findActiveByUserAndPurpose(
        user.id,
        body.purpose,
      );
    }

    if (!record) throw AuthErrors.Otp.notFound();

    // Increment attempts ATOMICALLY FIRST (TOCTOU protection).
    const updated = await this.repos.otpRepo.incrementAndGetAttempts(record.id);
    if (!updated) throw AuthErrors.Otp.notFound();

    // Threshold check: Allow up to exactly maxAttempts.
    if (updated.attempts > record.maxAttempts)
      throw AuthErrors.Otp.maxAttempts();

    // Verify code shape and then perform expensive hash.
    const valid = await verifyPin(record.otpHash, body.otp);

    if (!valid) {
      if (updated.attempts >= record.maxAttempts)
        throw AuthErrors.Otp.maxAttempts();
      throw AuthErrors.Otp.invalid();
    }

    await this.repos.otpRepo.markVerifiedAndConsume(record.id);

    // Generate purpose-bound bridge token if needed for the next step.
    // For phone_verification, it enables the registration/login flow.
    // For pin_reset and delete_account, it proof-of-ownership for the final action.
    let otpToken: string | undefined;
    const bridgePurposes = [
      "phone_verification",
      "pin_reset",
      "delete_account",
    ];
    if (bridgePurposes.includes(body.purpose)) {
      const subject = body.phone ?? user.phone ?? user.id;
      otpToken = await issueOtpToken(subject, body.purpose);
    }

    if (body.purpose === "phone_verification" && body.phone)
      await this.repos.userRepo.markPhoneVerified(user.id);

    if (body.purpose === "enable_2fa")
      await this.repos.userRepo.update(user.id, { twoFactorEnabled: true });

    if (body.purpose === "disable_2fa")
      await this.repos.userRepo.update(user.id, { twoFactorEnabled: false });

    await this.repos.auditRepo.create({
      actorId: user.id,
      actorIp: meta.ip,
      action: `otp.${body.purpose}_verified`,
      resource: "otp_verification",
      resourceId: record.id,
    });

    return { verified: true, ...(otpToken ? { otpToken } : {}) } as any;
  }
}

// ── 3. PinService ─────────────────────────────────────────────────────────────

/**
 * Service for managing security PINs and PIN reset flows.
 */
export class PinServiceImpl {
  /**
   * Initializes the PinServiceImpl.
   * @param repos - Authentication repositories.
   */
  constructor(private readonly repos: AuthRepositories) { }

  /**
   * Sets or updates the 6-digit security PIN for an authenticated user.
   * Revokes ALL active sessions immediately after a PIN change to ensure security.
   *
   * @param body - The new PIN and its confirmation.
   * @param meta - Metadata containing the actor ID and client IP.
   * @throws AuthErrors.Pin.format if not a 6-digit number.
   * @throws AuthErrors.Pin.mismatch if confirmation doesn't match.
   */
  async setPin(
    body: SetPin,
    meta: { actorId: string; ip: string },
  ): Promise<void> {
    const user = await this.repos.userRepo.findById(meta.actorId);
    if (!user) throw AuthErrors.User.notFound();

    const pinHash = await hashPin(body.pin);
    await this.repos.userRepo.updatePinHash(meta.actorId, pinHash);

    // Revoke all sessions and blacklist tokens after PIN change
    await blacklistUserSessions(meta.actorId, this.repos, "pin_changed");
    await this.repos.sessionRepo.revokeAllByUser(meta.actorId, "pin_changed");

    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "user.pin_set",
      resource: "user",
      resourceId: meta.actorId,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Public Endpoint: Requests a PIN reset OTP.
   * To prevent phone enumeration, this method always returns success even if the phone
   * is not found in the database.
   *
   * @param phone - The E.164 phone number.
   * @param meta - Metadata containing the client IP.
   * @returns A promise resolving to the estimated expiration timestamp.
   */
  async requestReset(
    phone: string,
    meta: { ip: string },
  ): Promise<{ expiresAt: string }> {
    const user = await this.repos.userRepo.findByPhone(phone);

    // Always return success — prevents phone enumeration
    if (!user || user.deletedAt) return { expiresAt: new Date().toISOString() };
    const otp = generateOtp();
    const otpHash = await hashPin(otp);
    const expiresAt = createDate(new TimeSpan(env.OTP_TTL_MIN, "m"));

    await db.transaction(async (tx) => {
      const txOtpRepo = new OtpRepository(tx as unknown as typeof db);
      await txOtpRepo.invalidateActiveByPhone(phone, "pin_reset");
      await txOtpRepo.create({
        userId: user.id,
        phone: user.phone,
        email: null,
        purpose: "pin_reset",
        otpHash,
        expiresAt,
        ipAddress: meta.ip,
      });
    });

    try {
      await NotificationService.sendSms(phone, otp);
    } catch (error) {
      logger.error({ err: error, phone }, "SMS delivery failed on PIN reset");
      throw AuthErrors.Otp.deliveryFailed();
    }

    await this.repos.auditRepo.create({
      actorId: user.id,
      actorIp: meta.ip,
      action: "user.pin_reset_requested",
      resource: "user",
      resourceId: user.id,
    });

    return { expiresAt: expiresAt.toISOString() };
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Public Endpoint: Completes a PIN reset using an OTP bridge token and a new PIN.
   * Validates the bridge token and revokes all active sessions upon success.
   *
   * @param body - The phone and new PIN details.
   * @param meta - Metadata containing the client IP.
   */
  async resetPin(
    body: ResetPin & { phone: string },
    meta: { ip: string },
  ): Promise<void> {
    const phone = body.phone;
    const user = await this.repos.userRepo.findByPhone(phone);
    if (!user || user.deletedAt) throw AuthErrors.User.notFound();

    const pinHash = await hashPin(body.newPin);
    await this.repos.userRepo.updatePinHash(user.id, pinHash);

    // Revoke all sessions and blacklist tokens after PIN change
    await blacklistUserSessions(user.id, this.repos, "pin_reset");
    await this.repos.sessionRepo.revokeAllByUser(user.id, "pin_reset");

    await this.repos.auditRepo.create({
      actorId: user.id,
      actorIp: meta.ip,
      action: "user.pin_reset",
      resource: "user",
      resourceId: user.id,
    });
  }
}

// ── 4. UserService ────────────────────────────────────────────────────────────

/**
 * Service for managing user profiles and account status.
 */
export class UserServiceImpl {
  /**
   * Initializes the UserServiceImpl.
   * @param repos - Authentication repositories.
   */
  constructor(private readonly repos: AuthRepositories) { }

  /**
   * Retrieves a public user profile.
   * Enforces Ownership: Users can only view their own profile unless they have 'admin' roles.
   *
   * @param id - The UUID of the user to fetch.
   * @param actorId - The UUID of the requesting user.
   * @param actorRoles - The roles of the requesting user.
   * @returns A promise resolving to the public user data.
   */
  async getById(
    id: string,
    actorId: string,
    actorRoles: string[],
  ): Promise<UserPublic> {
    if (id !== actorId && !hasRoleBySlug(actorRoles, ROLES.ADMIN))
      throw AuthErrors.Common.forbidden();
    const user = await this.repos.userRepo.findById(id);
    if (!user) throw AuthErrors.User.notFound();
    return mapToUserPublic(user);
  }

  /**
   * Admin Only: Manually updates a user's account status (e.g., active, banned, suspended).
   * Logs before/after states to the audit log.
   *
   * @param id - The UUID of the user to update.
   * @param newStatus - The target status.
   * @param meta - Metadata including actor roles and IP.
   */
  async updateStatus(
    id: string,
    newStatus: "active" | "suspended" | "deactivated" | "banned",
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    if (!hasRoleBySlug(meta.actorRoles, ROLES.ADMIN))
      throw AuthErrors.User.adminRequired();
    const user = await this.repos.userRepo.findById(id);
    if (!user) throw AuthErrors.User.notFound();
    await this.repos.userRepo.update(id, { status: newStatus });

    // Security revocation: if banned or suspended, kick out all sessions immediately.
    if (newStatus === "banned" || newStatus === "suspended") {
      await blacklistUserSessions(id, this.repos, `account_${newStatus}`);
      await this.repos.sessionRepo.revokeAllByUser(id, `account_${newStatus}`);
    }
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "user.status_updated",
      resource: "user",
      resourceId: id,
      before: { status: user.status },
      after: { status: newStatus },
    });
  }

  /**
   * Admin Only: Lists all active users with pagination.
   *
   * @param pagination - Pagination and ordering settings.
   * @param actorRoles - Roles of the requesting user.
   * @returns A promise resolving to the list of user profiles and total count.
   */
  async list(
    pagination: Pagination,
    actorRoles: string[],
  ): Promise<{ items: UserPublic[]; total: number }> {
    if (!hasRoleBySlug(actorRoles, ROLES.ADMIN))
      throw AuthErrors.User.adminRequired();
    const { items, total } = await this.repos.userRepo.list(pagination);
    return {
      items: items.map(mapToUserPublic),
      total,
    };
  }

  /**
   * Updates user profile data (name, email).
   * Note: Changing the email address automatically resets the `emailVerified` status
   * to false, requiring a new verification cycle.
   *
   * @param id - The UUID of the user to update.
   * @param body - The partial update data.
   * @param meta - Metadata containing the actor ID and roles.
   * @returns A promise resolving to the updated user profile.
   */
  async update(
    id: string,
    body: UpdateProfile,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<UserPublic> {
    if (id !== meta.actorId && !hasRoleBySlug(meta.actorRoles, ROLES.ADMIN))
      throw AuthErrors.Common.forbidden();
    const before = await this.repos.userRepo.findById(id);
    if (!before) throw AuthErrors.User.notFound();
    if (body.email) {
      if (!validateEmail(body.email)) throw AuthErrors.User.invalidEmail();
      if (body.email !== before.email) {
        const taken = await this.repos.userRepo.findByEmail(body.email);
        if (taken) throw AuthErrors.User.emailConflict();
      }
    }
    const updated = await this.repos.userRepo.update(id, {
      ...body,
      ...(body.email && body.email !== before.email
        ? { emailVerified: false, emailVerifiedAt: null }
        : {}),
    });
    if (!updated) throw AuthErrors.User.notFound();
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "user.updated",
      resource: "user",
      resourceId: id,
      before: { name: before.name, email: before.email },
      after: { name: updated.name, email: updated.email },
    });
    return mapToUserPublic(updated);
  }

  /**
   * Performs a soft-delete on a user account.
   * This revokes all active sessions and marks the user record as deleted.
   *
   * @param id - The UUID of the user to delete.
   * @param meta - Metadata containing actor ID and roles.
   */
  async softDelete(
    id: string,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    if (id !== meta.actorId && !hasRoleBySlug(meta.actorRoles, ROLES.ADMIN))
      throw AuthErrors.Common.forbidden();
    const deleted = await this.repos.userRepo.softDelete(id, meta.actorId);
    if (!deleted) throw AuthErrors.User.notFound();

    // Revoke all sessions and blacklist tokens before account deletion
    await blacklistUserSessions(id, this.repos, "account_deleted");
    await this.repos.sessionRepo.revokeAllByUser(id, "account_deleted");
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "user.deleted",
      resource: "user",
      resourceId: id,
    });
  }

  async markDigilockerExist(
    id: string,
    data: VerifyDigilockerAccount,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<{ status: "ACCOUNT_EXISTS" | "ACCOUNT_NOT_FOUND" }> {
    if (
      !hasRoleBySlug(meta.actorRoles, ROLES.DELIVERY_PARTNER) &&
      !hasRoleBySlug(meta.actorRoles, ROLES.SHOP_OWNER) &&
      !hasRoleBySlug(meta.actorRoles, ROLES.ADMIN)
    ) {
      throw AuthErrors.Common.forbidden();
    }

    const verifier = IdentityVerificationFactory.getDigilockerVerifier();
    const result = await verifier.verifyAccount(data);

    if (result.status === "ACCOUNT_NOT_FOUND") {
      return { status: "ACCOUNT_NOT_FOUND" };
    }

    await this.repos.userRepo.markDigilockerExist(
      id,
      result.digilockerId as string,
    );

    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "user.digilockerExist",
      resource: "user",
      resourceId: id,
    });

    return { status: "ACCOUNT_EXISTS" };
  }

  async DigilockerExist(id: string) {
    const user = await this.repos.userRepo.findById(id);
    if (!user) throw AuthErrors.User.notFound();

    return {
      digilockerLinked: user.digilockerLinked,
      digilockerId: user.digilockerId,
    };
  }
}

// ── 5. SessionService ─────────────────────────────────────────────────────────

/**
 * Service for managing user sessions (access/refresh tokens).
 */
export class SessionServiceImpl {
  /**
   * Initializes the SessionServiceImpl.
   * @param repos - Authentication repositories.
   */
  constructor(private readonly repos: AuthRepositories) { }

  /**
   * Lists the current user's own active sessions.
   * Sensitive internal hashes are stripped before returning.
   *
   * @param actorId - The UUID of the user.
   * @returns An array of active session metadata.
   */
  async listMine(actorId: string) {
    const sessions = await this.repos.sessionRepo.listActiveByUser(actorId);
    return sessions.map(
      ({ refreshTokenHash: _r, accessTokenJti: _a, ...rest }) => rest,
    );
  }

  /**
   * Revokes a specific session.
   * Enforces Ownership: Users can only revoke their own sessions unless they are admins.
   *
   * @param sessionId - The UUID of the session to revoke.
   * @param meta - Metadata containing actor ID and roles.
   */
  async revoke(
    sessionId: string,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    const session = await this.repos.sessionRepo.findById(sessionId);
    if (!session) throw AuthErrors.Session.notFound();
    if (
      session.userId !== meta.actorId &&
      !hasRoleBySlug(meta.actorRoles, ROLES.ADMIN)
    )
      throw AuthErrors.Session.forbidden();

    // Blacklist JTI before revoking in DB
    await blacklistSession(session, "user_revoked");

    await this.repos.sessionRepo.revoke(sessionId, "user_revoked");
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "session.revoked",
      resource: "session",
      resourceId: sessionId,
    });
  }
}

// ── 6. RoleService ────────────────────────────────────────────────────────────

/**
 * Service for managing Role-Based Access Control (RBAC) configurations.
 */
export class RoleServiceImpl {
  /**
   * Initializes the RoleServiceImpl.
   * @param repos - Authentication repositories.
   */
  constructor(private readonly repos: AuthRepositories) { }

  /**
   * Loads all roles from the database into the runtime RoleCache.
   * This should be called during application bootstrap.
   */
  async loadToCache(): Promise<void> {
    const roles = await this.repos.roleRepo.list();
    roleCache.load(roles);
    logger.info({ count: roles.length }, "Role cache initialized");
  }

  /**
   * Admin Only: Lists all role definitions in the system.
   *
   * @param actorRoles - The roles of the requester.
   */
  async list(actorRoles: string[]) {
    if (!hasRoleBySlug(actorRoles, ROLES.ADMIN))
      throw AuthErrors.Role.adminRequired();
    return this.repos.roleRepo.list();
  }

  /**
   * Admin Only: Creates a new role definition.
   * Checks for slug uniqueness before insertion.
   *
   * @param body - Name, slug, and description of the role.
   * @param meta - Metadata including actor ID and roles.
   */
  async create(
    body: { name: string; slug: string; description?: string },
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ) {
    if (!hasRoleBySlug(meta.actorRoles, ROLES.ADMIN))
      throw AuthErrors.Role.adminRequired();
    const existing = await this.repos.roleRepo.findBySlug(body.slug);
    if (existing) throw AuthErrors.Role.conflict(body.slug);
    const role = await this.repos.roleRepo.create(body);
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "role.created",
      resource: "role",
      resourceId: role.id,
      after: { name: role.name, slug: role.slug },
    });
    return role;
  }

  /**
   * Admin Only: Deletes a role definition.
   * Note: System-defined roles (isSystem: true) cannot be deleted.
   *
   * @param roleId - The UUID of the role.
   * @param meta - Metadata including actor ID and roles.
   */
  async delete(
    roleId: string,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    if (!hasRoleBySlug(meta.actorRoles, ROLES.ADMIN))
      throw AuthErrors.Role.adminRequired();
    const deleted = await this.repos.roleRepo.delete(roleId);
    if (!deleted)
      throw AuthErrors.Role.notFound("Role not found or is a system role");
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "role.deleted",
      resource: "role",
      resourceId: roleId,
    });
  }

  /**
   * Admin Only: Grants a specific role to a user.
   *
   * @param userId - The UUID of the target user.
   * @param roleId - The UUID of the role to assign.
   * @param meta - Metadata including actor ID and roles.
   */
  async assignToUser(
    userId: string,
    roleId: string,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    if (!hasRoleBySlug(meta.actorRoles, ROLES.ADMIN))
      throw AuthErrors.Role.adminRequired();
    const role = await this.repos.roleRepo.findById(roleId);
    if (!role) throw AuthErrors.Role.notFound();
    const user = await this.repos.userRepo.findById(userId);
    if (!user) throw AuthErrors.Role.userNotFound();
    await this.repos.userRoleRepo.assign({
      userId,
      roleId,
      assignedBy: meta.actorId,
    });
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "user.role_assigned",
      resource: "user",
      resourceId: userId,
      after: { roleId },
    });
  }

  /**
   * Admin Only: Revokes a role assignment from a user.
   *
   * @param userId - The UUID of the target user.
   * @param roleId - The UUID of the role to revoke.
   * @param meta - Metadata including actor ID and roles.
   */
  async revokeFromUser(
    userId: string,
    roleId: string,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    if (!hasRoleBySlug(meta.actorRoles, ROLES.ADMIN))
      throw AuthErrors.Role.adminRequired();
    const revoked = await this.repos.userRoleRepo.revoke(userId, roleId);
    if (!revoked) throw AuthErrors.Role.mappingNotFound();
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "user.role_revoked",
      resource: "user",
      resourceId: userId,
      before: { roleId },
    });
  }
}

// ── 7. ReferralService ────────────────────────────────────────────────────────

/**
 * Service for managing user referrals and referral codes.
 */
export class ReferralServiceImpl {
  /**
   * Initializes the ReferralServiceImpl.
   * @param repos - Authentication repositories.
   */
  constructor(private readonly repos: AuthRepositories) { }

  /**
   * Retrieves the referral code for the current user.
   *
   * @param actorId - The UUID of the user.
   * @returns A promise resolving to the user's referral code record.
   * @throws AuthErrors.Referral.notFound if no code exists.
   */
  async getMyCode(actorId: string) {
    const code = await this.repos.referralCodeRepo.findByUserId(actorId);
    if (!code) throw AuthErrors.Referral.notFound("No referral code found");
    return code;
  }

  /**
   * Generates a new unique referral code for the user if one doesn't already exist.
   *
   * @param actorId - The UUID of the user.
   * @returns A promise resolving to the created or existing referral code record.
   */
  async generateCode(actorId: string) {
    const existing = await this.repos.referralCodeRepo.findByUserId(actorId);
    if (existing) return existing;
    return this.repos.referralCodeRepo.create({
      userId: actorId,
      code: `REF${generateId(8).toUpperCase()}`,
    });
  }

  /**
   * Lists all users who were referred by the current user.
   *
   * @param actorId - The UUID of the user.
   * @param pagination - Pagination settings.
   * @returns A promise resolving to the paginated list of referrals.
   */
  async listMine(actorId: string, pagination: Pagination) {
    return this.repos.referralRepo.listByReferrer(actorId, pagination);
  }
}

// ── 8. DeviceService ──────────────────────────────────────────────────────────

/**
 * Service for managing user devices and hardware fingerprints.
 */
export class DeviceServiceImpl {
  /**
   * Initializes the DeviceServiceImpl.
   * @param repos - Authentication repositories.
   */
  constructor(private readonly repos: AuthRepositories) { }

  /**
   * Lists all devices that have ever signed into the user's account.
   *
   * @param actorId - The UUID of the user.
   * @returns An array of device records.
   */
  async listMine(actorId: string) {
    return this.repos.deviceRepo.listByUser(actorId);
  }

  /**
   * Toggles the 'trusted' status of a specific device.
   *
   * @param deviceId - The UUID of the device record.
   * @param trusted - The new trust status.
   * @param meta - Metadata containing actor ID and IP.
   */
  async setTrusted(
    deviceId: string,
    trusted: boolean,
    meta: { actorId: string; ip: string },
  ): Promise<void> {
    const devices = await this.repos.deviceRepo.listByUser(meta.actorId);
    const device = devices.find((d) => d.id === deviceId);
    if (!device) throw AuthErrors.Device.notFound();
    await this.repos.deviceRepo.setTrusted(device.id, trusted);
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: trusted ? "device.trusted" : "device.untrusted",
      resource: "device",
      resourceId: device.id,
    });
  }

  /**
   * Revokes a specific device.
   * Revoked devices are blocked from future logins using existing saved credentials.
   *
   * @param deviceId - The UUID of the device ID.
   * @param meta - Metadata containing actor ID and IP.
   */
  async revoke(
    deviceId: string,
    meta: { actorId: string; ip: string },
  ): Promise<void> {
    const revoked = await this.repos.deviceRepo.revoke(deviceId, meta.actorId);
    if (!revoked) throw AuthErrors.Device.notFound();
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "device.revoked",
      resource: "device",
      resourceId: deviceId,
    });
  }

  /**
   * Permanently removes a device record from the user's history.
   *
   * @param deviceId - The UUID of the device.
   * @param meta - Metadata containing actor ID and IP.
   */
  async remove(
    deviceId: string,
    meta: { actorId: string; ip: string },
  ): Promise<void> {
    const deleted = await this.repos.deviceRepo.delete(deviceId, meta.actorId);
    if (!deleted) throw AuthErrors.Device.notFound();
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "device.removed",
      resource: "device",
      resourceId: deviceId,
    });
  }
}

// ── 9. AuditService ───────────────────────────────────────────────────────────

/**
 * Service for retrieving system and user audit logs.
 */
export class AuditServiceImpl {
  /**
   * Initializes the AuditServiceImpl.
   * @param repos - Authentication repositories.
   */
  constructor(private readonly repos: AuthRepositories) { }

  /**
   * Lists audit logs where the authenticated user was the primary actor.
   *
   * @param actorId - The UUID of the user.
   * @param pagination - Pagination settings.
   * @returns A promise resolving to the list of audit logs.
   */
  async listMine(actorId: string, pagination: Pagination) {
    return this.repos.auditRepo.listByActor(actorId, pagination);
  }

  /**
   * Admin Only: Lists audit activity for a specific resource type and ID.
   *
   * @param resource - The resource type (e.g., 'user', 'session').
   * @param resourceId - The UUID of the resource.
   * @param pagination - Pagination settings.
   * @param actorRoles - Roles check for admin access.
   */
  async listByResource(
    resource: string,
    resourceId: string,
    pagination: Pagination,
    actorRoles: string[],
  ) {
    if (!hasRoleBySlug(actorRoles, ROLES.ADMIN))
      throw AuthErrors.Audit.adminRequired();
    return this.repos.auditRepo.listByResource(
      resource,
      resourceId,
      pagination,
    );
  }
}

export const defaultRepos: AuthRepositories = {
  userRepo: new UserRepository(db),
  otpRepo: new OtpRepository(db),
  sessionRepo: new SessionRepository(db),
  roleRepo: new RoleRepository(db),
  userRoleRepo: new UserRoleRepository(db),
  authRepo: new AuthAttemptRepository(db),
  referralRepo: new ReferralRepository(db),
  referralCodeRepo: new ReferralCodeRepository(db),
  auditRepo: new AuditLogRepository(db),
  deviceRepo: new UserDeviceRepository(db),
  abuseRepo: new RateLimitRepository(db),
  kycProfileRepo: new KycProfileRepository(db),
};

export const AuthService = new AuthServiceImpl(defaultRepos);
export const OtpService = new OtpServiceImpl(defaultRepos);
export const PinService = new PinServiceImpl(defaultRepos);
export const UserService = new UserServiceImpl(defaultRepos);
export const SessionService = new SessionServiceImpl(defaultRepos);
export const RoleService = new RoleServiceImpl(defaultRepos);
export const ReferralService = new ReferralServiceImpl(defaultRepos);
export const DeviceService = new DeviceServiceImpl(defaultRepos);
export const AuditService = new AuditServiceImpl(defaultRepos);
