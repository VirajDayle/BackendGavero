/**
 * modules/auth/auth.service.ts
 *
 * All business logic for authentication and user management.
 * Calls repositories for DB access, NotificationService for OTP delivery.
 * Never touches HTTP — all errors thrown via AuthErrors factories.
 */

import { TimeSpan, createDate } from "oslo";
import { SignJWT, jwtVerify } from "jose";
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
} from "./auth.schema";

import { mapToUserPublic } from "./auth.schema"; // ← value import, not type

import { NotificationService } from "./notification.service";
import { AuthErrors } from "./auth.errors";
import { db } from "../../db";
import { env } from "../../config/env";
import { generateId, sha256Hex, hashPin, verifyPin } from "../../utils/hash";
import { generateOtp } from "../../utils/otp";
import { normalizePhone } from "../../utils/phone";
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
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// ── JWT secrets ───────────────────────────────────────────────────────────────

const OTP_TOKEN_SECRET = new TextEncoder().encode(env.OTP_TOKEN_SECRET);
const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);

/**
 * Issues a short-lived "OTP Bridge Token".
 * This token is a proof-of-verification that the user presents to the
 * /register or /login/otp endpoints after successfully verifying an OTP.
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

/**
 * Validates the OTP bridge token and extracts the verified phone number.
 */
async function verifyOtpToken(
  token: string,
  expectedPurpose: string,
): Promise<{ phone: string; jti: string }> {
  try {
    const { payload } = await jwtVerify(token, OTP_TOKEN_SECRET);

    if (
      payload.purpose !== expectedPurpose ||
      typeof payload.phone !== "string" ||
      typeof payload.jti !== "string"
    ) {
      throw AuthErrors.Otp.tokenInvalid();
    }

    const revoked = await redis.get(`revoke_otp_jti:${payload.jti}`);
    if (revoked) {
      throw AuthErrors.Otp.tokenInvalid("OTP token already used");
    }

    return { phone: payload.phone, jti: payload.jti };
  } catch (err) {
    throw AuthErrors.Otp.tokenInvalid();
  }
}

/**
 * Signs a standard JWT access token for the user.
 * Includes the user ID (sub), session ID (jti), and assigned roles.
 */
async function signAccessToken(payload: {
  sub: string;
  jti: string;
  sid: string;
  roles: string[];
}): Promise<string> {
  return new SignJWT({ roles: payload.roles, sid: payload.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_TTL_MIN ?? 15}m`)
    .sign(ACCESS_SECRET);
}

// ── 1. AuthService ────────────────────────────────────────────────────────────

export class AuthServiceImpl {
  constructor(private readonly repos: AuthRepositories) { }
  /**
   * Orchestrates the "Send OTP" flow:
   * 1. Normalizes the phone number.
   * 2. Checks rate limits for both phone and IP to prevent spam.
   * 3. Checks if the user is banned or suspended.
   * 4. Generates a fresh 6-digit OTP and hashes it for secure storage.
   * 5. Invalidates any existing active OTPs for this phone/purpose.
   * 6. Stores the new OTP record in the database.
   * 7. Hands off the OTP to the NotificationService for SMS delivery.
   */
  async sendOtp(
    body: SendOtpRequest,
    meta: { ip: string },
  ): Promise<{ expiresAt: string }> {
    const phone = normalizePhone(body.phone);

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
        logger.warn({ phone, status: user.status }, "Send OTP attempted for restricted user");
        // We still return success to keep the attacker guessing
        return { expiresAt: createDate(new TimeSpan(env.OTP_TTL_MIN, "m")).toISOString() };
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
   * 2. Increments the attempt counter and checks against the max limit (anti-brute force).
   * 3. Verifies the provided OTP against the stored hash.
   * 4. Marks the OTP as verified and consumed.
   * 5. Checks if the user already exists (determines register vs login).
   * 6. Issues an "OTP Bridge Token" for the final authentication step.
   * 7. Logs the successful verification to the audit trail.
   */
  async verifyOtp(
    body: { phone: string; otp: string },
    meta: { ip: string },
  ): Promise<{ isRegistered: boolean; otpToken: string }> {
    const phone = normalizePhone(body.phone);

    // Look for a non-expired, non-consumed OTP.
    const record = await this.repos.otpRepo.findActiveByPhone(phone, "phone_verification");
    if (!record) throw AuthErrors.Otp.notFound();

    // Prevent brute-forcing by limiting attempts per record.
    if (record.attempts >= record.maxAttempts)
      throw AuthErrors.Otp.maxAttempts();

    // Verify the decrypted OTP BEFORE incrementing.
    const valid = await verifyPin(record.otpHash, body.otp);

    // Increment attempts ATOMICALLY.
    const updated = await this.repos.otpRepo.incrementAndGetAttempts(record.id);
    if (!updated) throw AuthErrors.Otp.notFound();

    logger.debug({ recordId: record.id, phone, valid, attempts: updated.attempts, max: record.maxAttempts }, "OTP verify step");

    if (!valid) {
      logger.warn({ phone, attempts: updated.attempts, maxAttempts: record.maxAttempts }, "OTP verification failed");
      // If this failed attempt was the last one allowed
      if (updated.attempts >= record.maxAttempts) throw AuthErrors.Otp.maxAttempts();
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
   * 1. Validates the "OTP Bridge Token" to ensure phone ownership was verified.
   * 2. Checks if the phone is already registered (last-minute race condition check).
   * 3. Starts a database transaction for atomic account creation.
   * 4. Creates the user record.
   * 5. Assigns the default "customer" role.
   * 6. Processes referral logic if a code was provided.
   * 7. Generates the user's own unique referral code.
   * 8. Create an audit log for the new registration.
   * 9. Initializes the first login session.
   */
  async register(
    body: RegisterRequest,
    meta: {
      ip: string;
      userAgent: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    // Ensure the user actually verified their phone for registration.
    const { phone, jti } = await verifyOtpToken(body.otpToken, "phone_verification");

    // Single-use enforcement: revoke the token immediately
    await redis.setex(`revoke_otp_jti:${jti}`, env.OTP_TOKEN_TTL_MIN * 60, "1");

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
          throw AuthErrors.User.alreadyExists("Phone number is already registered");
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
   * 1. Normalizes phone and retrieves user.
   * 2. Checks account existence and status (deleted, banned, suspended).
   * 3. Checks if the account is currently locked due to too many failed attempts.
   * 4. Verifies the provided 6-digit PIN against the stored hash.
   * 5. If PIN is wrong: increments fail counter and locks account if threshold reached.
   * 6. If PIN is right: resets fail counter, creates a new session, and logs success.
   */
  async loginWithPin(
    body: LoginWithPin,
    meta: {
      ip: string;
      userAgent: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    const phone = normalizePhone(body.phone);

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

    // 3. Verify PIN.
    const pinValid = await verifyPin(user.pinHash, body.pin);

    if (!pinValid) {
      // Increment failures and potentially lock account.
      const failures = await this.repos.userRepo.incrementFailedLogins(user.id);

      if (failures >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await this.repos.userRepo.lockUntil(user.id, lockUntil);
        await recordAttempt(false, "too_many_attempts");
        throw AuthErrors.Pin.locked();
      }

      await recordAttempt(false, "invalid_credentials");
      throw AuthErrors.Pin.invalid();
    }

    // 4. Two-Factor check.
    if (user.twoFactorEnabled) throw AuthErrors.Auth.twoFactorRequired();

    // 5. Success: Clean up and create session.
    await this.repos.userRepo.resetFailedLogins(user.id);
    const result = await this._createSession(user, "pin", meta);
    await recordAttempt(true, undefined, result.sessionId);

    return result;
  }

  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Orchestrates Login with OTP Token:
   * 1. Validates the "OTP Bridge Token".
   * 2. Checks if the account exists and is not banned/suspended.
   * 3. Creates a new session and logs the success.
   */
  async loginWithOtpToken(
    body: LoginWithOtpToken,
    meta: {
      ip: string;
      userAgent: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    // Verified phone comes from the JWT payload of the bridge token.
    const { phone, jti } = await verifyOtpToken(body.otpToken, "phone_verification");

    // Single-use enforcement
    await redis.setex(`revoke_otp_jti:${jti}`, env.OTP_TOKEN_TTL_MIN * 60, "1");
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
   * 1. Retrieves session and verifies ownership (actorId matches user).
   * 2. Skips if already inactive.
   * 3. Marks record as `logged_out` in DB.
   * 4. Logs event to audit trail.
   */
  async signOut(
    sessionId: string,
    meta: { actorId: string; ip: string },
  ): Promise<void> {
    const session = await this.repos.sessionRepo.findById(sessionId);
    if (!session || session.userId !== meta.actorId)
      throw AuthErrors.Session.notFound();

    // Idempotent — skip if already logged out or revoked
    if (session.status === "logged_out" || session.status === "revoked") return;

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
   * Logs out ALL sessions for the current user.
   * This is a critical security feature for users who have lost a device.
   */
  async signOutAll(meta: { actorId: string; ip: string }): Promise<void> {
    await this.repos.sessionRepo.revokeAllByUser(meta.actorId, "user_sign_out_all");

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
   * Rotates a session's tokens:
   * 1. Hashes the provided refresh token and looks it up in the database.
   * 2. Verifies the session is still active and not expired.
   * 3. Rotates the `accessTokenJti` (invalidating old access tokens even if they haven't expired).
   * 4. Issues a brand new access token.
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
      logger.warn({ tokenHash, sessionId: reuseCheck, ip: meta.ip }, "Refresh token reuse detected — revoking session");
      // Critical security action: Revoke the entire session as it may be compromised.
      await this.repos.sessionRepo.revoke(reuseCheck, "refresh_token_reuse_detected");
      throw AuthErrors.Auth.sessionExpired("Security breach: Token reuse detected");
    }

    const session = await this.repos.sessionRepo.findByRefreshTokenHash(tokenHash);

    // Only allow refresh for active, non-expired sessions.
    if (!session) {
      logger.warn({ tokenHash }, "Refresh session not found by hash");
      throw AuthErrors.Auth.sessionExpired();
    }

    if (session.status !== "active") {
      logger.warn({ sessionId: session.id, status: session.status }, "Refresh session is not active");
      throw AuthErrors.Auth.sessionExpired();
    }

    if (session.expiresAt < new Date()) {
      logger.warn({ sessionId: session.id, expiresAt: session.expiresAt }, "Refresh session expired");
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
    if (session.accessTokenJti) {
      await redis.setex(`revoke_jti:${session.accessTokenJti}`, (env.JWT_ACCESS_TTL_MIN ?? 15) * 60, "rotated");
    }

    // Build roles list for the JWT payload.
    const userRoles = await this.repos.userRoleRepo.findByUserId(session.userId);
    const roles = userRoles.map((r: { roleSlug: string }) => r.roleSlug);

    const accessToken = await signAccessToken({
      sub: session.userId,
      jti: newJti,
      sid: session.id,
      roles,
    });

    return {
      accessToken,
      accessTokenJti: newJti,
      refreshToken: newRefreshToken,
      expiresAt: session.expiresAt,
    };
  }

  // ── Private: shared session creation ──────────────────────────────────────

  /**
   * Internal Helper: Securely creates a new login session.
   * 1. Generates refresh token (unguessable string) and its hash.
   * 2. Stores the session in the database with metadata (IP, UA, device info).
   * 3. Updates device tracking if a fingerprint is present.
   * 4. Updates user `last_login_at` timestamp.
   * 5. Audits the sign-in event.
   * 6. Signs a new JWT access token based on the generated session JTI.
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
    const roles = userRoles.map((r: { roleSlug: string }) => r.roleSlug);

    // 5. Issue final access token linked to this session JTI.
    const accessToken = await signAccessToken({
      sub: user.id,
      jti: accessTokenJti,
      sid: session.id,
      roles,
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

export class OtpServiceImpl {
  constructor(private readonly repos: AuthRepositories) { }
  /**
   * Generates and sends a purpose-driven OTP to an authenticated user.
   * Purposes include `phone_verification`, `email_verification`, `2fa`, etc.
   */
  async request(
    body: OtpRequest,
    meta: { ip: string; actorId: string },
  ): Promise<{ expiresAt: string }> {
    const user = await this.repos.userRepo.findById(meta.actorId);
    if (!user) throw AuthErrors.User.notFound();

    // Resolve OTP target: use explicit phone/email from body, or fall back
    // to the user's registered phone (needed for two_factor_auth / account_deletion
    // where the caller doesn't pass a target).
    const phone = body.phone
      ? normalizePhone(body.phone)
      : (user.phone ?? null);
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
   * If the purpose is `phone_verification`, it also marks the user's phone as verified.
   */
  async verify(
    body: OtpVerify,
    meta: { ip: string; actorId: string },
  ): Promise<{ verified: true }> {
    const user = await this.repos.userRepo.findById(meta.actorId);
    if (!user) throw AuthErrors.User.notFound();

    const requiresTarget =
      body.purpose !== "two_factor_auth" && body.purpose !== "account_deletion";

    if (requiresTarget && !body.phone && !body.email)
      throw AuthErrors.Otp.missingTarget();

    let record;
    if (body.phone) {
      const phone = normalizePhone(body.phone);
      record = await this.repos.otpRepo.findActiveByPhone(phone, body.purpose);
    } else if (body.email) {
      record = await this.repos.otpRepo.findActiveByEmail(body.email, body.purpose);
    } else {
      record = await this.repos.otpRepo.findActiveByUserAndPurpose(user.id, body.purpose);
    }

    if (!record) throw AuthErrors.Otp.notFound();

    const updated = await this.repos.otpRepo.incrementAndGetAttempts(record.id);
    if (!updated) throw AuthErrors.Otp.notFound();
    if (updated.attempts >= record.maxAttempts)
      throw AuthErrors.Otp.maxAttempts();

    const valid = await verifyPin(record.otpHash, body.otp);
    if (!valid) throw AuthErrors.Otp.invalid();

    await this.repos.otpRepo.markVerifiedAndConsume(record.id);

    // Generate purpose-bound bridge token if needed for the next step.
    // For phone_verification, it enables the registration/login flow.
    // For pin_reset and delete_account, it proof-of-ownership for the final action.
    let otpToken: string | undefined;
    const bridgePurposes = ["phone_verification", "pin_reset", "delete_account"];
    if (bridgePurposes.includes(body.purpose)) {
      const subject = body.phone ? normalizePhone(body.phone) : (user.phone ?? user.id);
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

export class PinServiceImpl {
  constructor(private readonly repos: AuthRepositories) { }
  /**
   * Sets or updates the 6-digit security PIN for an authenticated user.
   * Forced logout follows to ensure all sessions are re-secured.
   */
  async setPin(
    body: SetPin,
    meta: { actorId: string; ip: string },
  ): Promise<void> {
    const user = await this.repos.userRepo.findById(meta.actorId);
    if (!user) throw AuthErrors.User.notFound();

    if (body.pin.length !== 6 || !/^\d+$/.test(body.pin))
      throw AuthErrors.Pin.format();

    if (body.pin !== body.confirmPin) throw AuthErrors.Pin.mismatch();

    const pinHash = await hashPin(body.pin);
    await this.repos.userRepo.updatePinHash(meta.actorId, pinHash);
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
   * Public: Requests a PIN reset OTP.
   * Protects user privacy by always returning success even if the phone isn't registered.
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
   * Public: Completes a PIN reset using an OTP bridge token and a new PIN.
   */
  async resetPin(body: ResetPin, meta: { ip: string }): Promise<void> {
    const { phone, jti } = await verifyOtpToken(body.otpToken, "pin_reset");

    // Single-use enforcement
    await redis.setex(`revoke_otp_jti:${jti}`, env.OTP_TOKEN_TTL_MIN * 60, "1");
    const user = await this.repos.userRepo.findByPhone(phone);
    if (!user || user.deletedAt) throw AuthErrors.User.notFound();

    if (body.newPin.length !== 6 || !/^\d+$/.test(body.newPin))
      throw AuthErrors.Pin.format();

    if (body.newPin !== body.confirmPin) throw AuthErrors.Pin.mismatch();

    const pinHash = await hashPin(body.newPin);
    await this.repos.userRepo.updatePinHash(user.id, pinHash);
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

export class UserServiceImpl {
  constructor(private readonly repos: AuthRepositories) { }
  /**
   * Retrieves a public user profile.
   * Enforces that users can only view themselves unless they are an admin.
   */
  async getById(
    id: string,
    actorId: string,
    actorRoles: string[],
  ): Promise<UserPublic> {
    if (id !== actorId && !actorRoles.includes("admin"))
      throw AuthErrors.Common.forbidden();
    const user = await this.repos.userRepo.findById(id);
    if (!user) throw AuthErrors.User.notFound();
    return mapToUserPublic(user);
  }

  /**
   * Admin Only: Manually updates a user's account status.
   */
  async updateStatus(
    id: string,
    newStatus: "active" | "suspended" | "deactivated" | "banned",
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    if (!meta.actorRoles.includes("admin"))
      throw AuthErrors.User.adminRequired();
    const user = await this.repos.userRepo.findById(id);
    if (!user) throw AuthErrors.User.notFound();
    await this.repos.userRepo.update(id, { status: newStatus });
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

  async list(
    pagination: Pagination,
    actorRoles: string[],
  ): Promise<{ items: UserPublic[]; total: number }> {
    if (!actorRoles.includes("admin")) throw AuthErrors.User.adminRequired();
    const { items, total } = await this.repos.userRepo.list(pagination);
    return {
      items: items.map(mapToUserPublic),
      total,
    };
  }

  /**
   * Updates user profile data (name, email).
   * Email changes require a new verification (emailVerified set to false).
   */
  async update(
    id: string,
    body: UpdateProfile,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<UserPublic> {
    if (id !== meta.actorId && !meta.actorRoles.includes("admin"))
      throw AuthErrors.Common.forbidden();
    const before = await this.repos.userRepo.findById(id);
    if (!before) throw AuthErrors.User.notFound();
    if (body.email) {
      if (!validateEmail(body.email))
        throw AuthErrors.User.invalidEmail();
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
   * Marks a user account as deleted and revokes all active sessions.
   */
  async softDelete(
    id: string,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    if (id !== meta.actorId && !meta.actorRoles.includes("admin"))
      throw AuthErrors.Common.forbidden();
    const deleted = await this.repos.userRepo.softDelete(id, meta.actorId);
    if (!deleted) throw AuthErrors.User.notFound();
    await this.repos.sessionRepo.revokeAllByUser(id, "account_deleted");
    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "user.deleted",
      resource: "user",
      resourceId: id,
    });
  }
}

// ── 5. SessionService ─────────────────────────────────────────────────────────

export class SessionServiceImpl {
  constructor(private readonly repos: AuthRepositories) { }
  /**
   * Lists active sessions for the authenticated user,
   * while stripping sensitive internal identifiers.
   */
  async listMine(actorId: string) {
    const sessions = await this.repos.sessionRepo.listActiveByUser(actorId);
    return sessions.map(
      ({ refreshTokenHash: _r, accessTokenJti: _a, ...rest }) => rest,
    );
  }

  /**
   * Revokes a specific session. Ownership or admin status is checked first.
   */
  async revoke(
    sessionId: string,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    const session = await this.repos.sessionRepo.findById(sessionId);
    if (!session) throw AuthErrors.Session.notFound();
    if (session.userId !== meta.actorId && !meta.actorRoles.includes("admin"))
      throw AuthErrors.Session.forbidden();
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

export class RoleServiceImpl {
  constructor(private readonly repos: AuthRepositories) { }
  /**
   * Admin Only: Lists all available roles.
   */
  async list(actorRoles: string[]) {
    if (!actorRoles.includes("admin")) throw AuthErrors.Role.adminRequired();
    return this.repos.roleRepo.list();
  }

  /**
   * Admin Only: Creates a new role definition.
   */
  async create(
    body: { name: string; slug: string; description?: string },
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ) {
    if (!meta.actorRoles.includes("admin"))
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
   * Admin Only: Deletes a non-system role.
   */
  async delete(
    roleId: string,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    if (!meta.actorRoles.includes("admin"))
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
   * Admin Only: Grants a role to a specific user.
   */
  async assignToUser(
    userId: string,
    roleId: string,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    if (!meta.actorRoles.includes("admin"))
      throw AuthErrors.Role.adminRequired();
    const role = await this.repos.roleRepo.findById(roleId);
    if (!role) throw AuthErrors.Role.notFound();
    const user = await this.repos.userRepo.findById(userId);
    if (!user) throw AuthErrors.Role.userNotFound();
    await this.repos.userRoleRepo.assign({ userId, roleId, assignedBy: meta.actorId });
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
   * Admin Only: Removes a role assignment from a user.
   */
  async revokeFromUser(
    userId: string,
    roleId: string,
    meta: { actorId: string; actorRoles: string[]; ip: string },
  ): Promise<void> {
    if (!meta.actorRoles.includes("admin"))
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

export class ReferralServiceImpl {
  constructor(private readonly repos: AuthRepositories) { }
  /**
   * Retrieves the referral code for the current user.
   */
  async getMyCode(actorId: string) {
    const code = await this.repos.referralCodeRepo.findByUserId(actorId);
    if (!code) throw AuthErrors.Referral.notFound("No referral code found");
    return code;
  }

  /**
   * Generates a new referral code if none exists.
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
   * Lists users who used the current user's referral code.
   */
  async listMine(actorId: string, pagination: Pagination) {
    return this.repos.referralRepo.listByReferrer(actorId, pagination);
  }
}

// ── 8. DeviceService ──────────────────────────────────────────────────────────

export class DeviceServiceImpl {
  constructor(private readonly repos: AuthRepositories) { }
  /**
   * Lists devices that have signed into the user's account.
   */
  async listMine(actorId: string) {
    return this.repos.deviceRepo.listByUser(actorId);
  }

  /**
   * Toggles the 'trusted' status of a user's device.
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
   * Prevents a specific device from being used for future logins.
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
   * Permanently removes a device record from the account history.
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

export class AuditServiceImpl {
  constructor(private readonly repos: AuthRepositories) { }
  /**
   * Lists audit entries where the current user was the actor.
   */
  async listMine(actorId: string, pagination: Pagination) {
    return this.repos.auditRepo.listByActor(actorId, pagination);
  }

  /**
   * Admin Only: Lists all audit activity for a specific resource (e.g. 'user', 'role').
   */
  async listByResource(
    resource: string,
    resourceId: string,
    pagination: Pagination,
    actorRoles: string[],
  ) {
    if (!actorRoles.includes("admin")) throw AuthErrors.Audit.adminRequired();
    return this.repos.auditRepo.listByResource(resource, resourceId, pagination);
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
  abuseRepo: new RateLimitRepository(db)
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
