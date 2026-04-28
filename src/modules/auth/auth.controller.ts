/**
 * Controller for the Authentication module.
 * 
 * Layer responsibilities:
 * - Validate/reshape inputs NOT covered by TypeBox schema (e.g. missing headers).
 * - Orchestrate calls to one or more business logic services.
 * - Shape and filter the final response for the client (stripping internal fields).
 * - Centralize logging, telemetry, and metrics hooks.
 * 
 * Architecture Flow: Routes → Controller → Service → Repository
 * 
 * Rules:
 * - No Elysia or TypeBox-specific logic here (kept in .routes.ts).
 * - No direct database access (always via Service layer).
 * - Use `toSessionResponse` to sanitize token objects before returning.
 */

import { status } from "elysia";
import { jwtVerify } from "jose";
import { redis } from "../../config/redis";
import { env } from "../../config/env";
import { AuthErrors } from "./auth.errors";

import {
  AuditService,
  AuthService,
  DeviceService,
  OtpService,
  PinService,
  ReferralService,
  RoleService,
  SessionService,
  UserService,
} from "./auth.service";
import { normalizePhone } from "../../utils/phone";

import type {
  LoginWithOtpToken,
  LoginWithPin,
  OtpRequest,
  OtpVerify,
  Pagination,
  RegisterRequest,
  ResetPin,
  SendOtpRequest,
  SetPin,
  UpdateProfile,
  VerifyOtpRequest
} from "./auth.schema";

import {
  setPinSchema,
  resetPinSchema,
  otpRequestSchema,
  otpVerifySchema,
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginWithPinSchema,
  loginWithOtpTokenSchema,
} from "./auth.schema";

import { paginatedRaw } from "../../core/response";

// ---------------------------------------------------------------------------
// Shared context shapes
// ---------------------------------------------------------------------------

/**
 * Represents the request-level metadata.
 */
export type Meta = {
  /** The client's original IP address (resolved via proxy if TRUST_PROXY is enabled). */
  ip: string;
  /** The raw User-Agent string from the client. */
  userAgent: string;
};

/**
 * Represents the authenticated actor (user).
 */
export type Actor = {
  /** The unique UUID of the user. */
  id: string;
  /** The list of role slugs assigned to the user. */
  roleIds: string[];
};

// ---------------------------------------------------------------------------
// Shared response envelopes
// ---------------------------------------------------------------------------

/**
 * Standard session response returned to the client upon login or registration.
 */
export type SessionResponse = {
  /** The short-lived JWT access token. */
  accessToken: string;
  /** The long-lived, high-entropy refresh token. */
  refreshToken: string;
  /** The unique ID of the login session. */
  sessionId: string;
  /** The timestamp when the refresh token expires. */
  expiresAt: Date;
  /** The public profile of the authenticated user. */
  user: unknown;
};

/**
 * Strips internal-only fields (like accessTokenJti) from the session object.
 * 
 * @param raw - The raw session object from the service layer.
 * @returns A sanitized SessionResponse for the client.

const OTP_TOKEN_SECRET = new TextEncoder().encode(env.OTP_TOKEN_SECRET);

/**
 * Controller-layer guard: verifies the OTP bridge token, enforces single-use
 * via Redis, and returns the verified phone. Throws before any service call.
 */

function toSessionResponse(raw: {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  accessTokenJti: string; // internal — stripped from response
  expiresAt: Date;
  user: unknown;
}): SessionResponse {
  const { accessTokenJti: _jti, ...response } = raw;
  return response;
}

const OTP_TOKEN_SECRET = new TextEncoder().encode(env.OTP_TOKEN_SECRET);

/**
 * Controller-layer guard: verifies the OTP bridge token, enforces single-use
 * via Redis, and returns the verified phone. Throws before any service call.
 */
async function verifyAndConsumeOtpToken(
  token: string,
  expectedPurpose: string,
): Promise<string> {
  let payload: { phone?: unknown; purpose?: unknown; jti?: unknown };
  try {
    ({ payload } = await jwtVerify(token, OTP_TOKEN_SECRET));
  } catch (err) {
    // Distinguish infra errors from invalid token errors
    if (
      err instanceof Error &&
      err.name !== "JWSInvalid" &&
      err.name !== "JWTExpired" &&
      err.name !== "JWTClaimValidationFailed"
    ) {
      throw err; // let Redis-down or other infra errors bubble as 500
    }
    throw AuthErrors.Otp.tokenInvalid();
  }

  if (
    payload.purpose !== expectedPurpose ||
    typeof payload.phone !== "string" ||
    typeof payload.jti !== "string"
  ) {
    throw AuthErrors.Otp.tokenInvalid();
  }

  // 3. Atomically consume the token to prevent concurrent reuse (TOCTOU protection).
  // We use SET with NX (Set if Not eXists) to ensure only one request succeeds.
  const wasSet = await redis.set(
    `revoke_otp_jti:${payload.jti}`,
    "1",
    "EX",
    env.OTP_TOKEN_TTL_MIN * 60,
    "NX",
  );

  if (!wasSet) {
    throw AuthErrors.Otp.tokenInvalid("OTP token already used");
  }

  return payload.phone;
}

// ---------------------------------------------------------------------------
// 1. AuthController
// ---------------------------------------------------------------------------

export const AuthController = {
  /**
   * Triggers the delivery of a 6-digit OTP to a phone number.
   * Used for both registration (new users) and OTP-based login (existing users).
   * 
   * @param body - The request containing the phone number.
   * @param meta - Request metadata (IP).
   * @returns The estimated expiration timestamp of the OTP.
   */
  async sendOtp(
    body: SendOtpRequest,
    meta: Pick<Meta, "ip">,
  ): Promise<{ expiresAt: string }> {
    const normalizedBody = { ...body, phone: normalizePhone(body.phone) };
    sendOtpSchema.parse(normalizedBody);

    return await AuthService.sendOtp(normalizedBody, { ip: meta.ip });
  },

  /**
   * Validates the 6-digit OTP sent to the user's phone.
   * Returns an `otpToken` upon success, which serves as a short-lived proof 
   * of phone ownership for subsequent registration or login steps.
   * 
   * @param body - The phone and the code.
   * @param meta - Request metadata (IP).
   * @returns Registration status and a proof-of-verification bridge token.
   */
  async verifyOtp(
    body: VerifyOtpRequest,
    meta: Pick<Meta, "ip">,
  ): Promise<{ isRegistered: boolean; otpToken: string }> {
    const normalizedBody = { ...body, phone: normalizePhone(body.phone) };
    verifyOtpSchema.parse(normalizedBody);

    return AuthService.verifyOtp(normalizedBody, { ip: meta.ip });
  },

  /**
   * Creates a new user account. 
   * Requires a valid `otpToken` from the verification step.
   * Returns the initial session tokens (access/refresh).
   * 
   * @param body - Registration details.
   * @param meta - Metadata including IP, User Agent, and optional device fingerprint.
   * @returns Sanitized session tokens and user profile.
   */
  async register(
    body: RegisterRequest,
    meta: Meta & { deviceInfo?: Record<string, unknown> },
  ): Promise<SessionResponse> {
    registerSchema.parse(body);

    // Boundary: verify token and extract trusted phone before hitting service
    const phone = await verifyAndConsumeOtpToken(
      body.otpToken,
      "phone_verification",
    );
    const raw = await AuthService.register({ ...body, phone }, meta);
    return toSessionResponse(raw);
  },

  /**
   * Authenticates an existing user using their phone and 6-digit PIN.
   * Returns new session tokens if the PIN is correct.
   * 
   * @param body - Phone and PIN.
   * @param meta - Metadata for the new session.
   * @returns Sanitized session tokens.
   */
  async loginWithPin(
    body: LoginWithPin,
    meta: Meta & { deviceInfo?: Record<string, unknown> },
  ): Promise<SessionResponse> {
    const normalizedBody = { ...body, phone: normalizePhone(body.phone) };
    loginWithPinSchema.parse(normalizedBody);

    const raw = await AuthService.loginWithPin(normalizedBody, meta);
    return toSessionResponse(raw);
  },

  /**
   * Authenticates an existing user using a valid `otpToken`.
   * Useful for users who haven't set a PIN or prefer OTP-only login.
   * 
   * @param body - The OTP bridge token.
   * @param meta - Metadata for the new session.
   * @returns Sanitized session tokens.
   */
  async loginWithOtpToken(
    body: LoginWithOtpToken,
    meta: Meta & { deviceInfo?: Record<string, unknown> },
  ): Promise<SessionResponse> {
    loginWithOtpTokenSchema.parse(body);

    const phone = await verifyAndConsumeOtpToken(
      body.otpToken,
      "phone_verification",
    );
    const raw = await AuthService.loginWithOtpToken({ phone }, meta);
    return toSessionResponse(raw);
  },

  /**
   * Rotates the current session's tokens (Refresh Token Rotation).
   * Expects the refresh token in the `x-refresh-token` header.
   * This is a critical security step performed periodically by the client.
   * 
   * @param rawRefreshToken - The token from the header.
   * @param meta - Request metadata (IP).
   * @returns New access/refresh tokens.
   * @throws 401 if header is missing.
   */
  async refresh(
    rawRefreshToken: string | undefined,
    meta: Pick<Meta, "ip">,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    if (!rawRefreshToken)
      throw status(401, "x-refresh-token header is required");

    const { accessTokenJti: _jti, ...response } =
      await AuthService.refreshSession(rawRefreshToken, { ip: meta.ip });

    return response;
  },

  /**
   * Ends a specific user session, effectively logging out that device/browser.
   * 
   * @param sessionId - The UUID of the session to terminate.
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   */
  async logout(
    sessionId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return AuthService.signOut(sessionId, { actorId: actor.id, ip: meta.ip });
  },

  /**
   * Ends ALL active sessions for the current user across all devices.
   * Generally used for emergency security lockouts.
   * 
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   */
  async logoutAll(actor: Actor, meta: Pick<Meta, "ip">): Promise<void> {
    return AuthService.signOutAll({ actorId: actor.id, ip: meta.ip });
  },
};

// ---------------------------------------------------------------------------
// 2. OtpController
// ---------------------------------------------------------------------------

export const OtpController = {
  /**
   * Requests a new OTP for a specific purpose (e.g. email verification).
   * This is for users who are already logged into the system.
   * 
   * @param body - The purpose and target details.
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   * @returns The OTP expiration timestamp.
   */
  async request(
    body: OtpRequest,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<{ expiresAt: string }> {
    const normalizedBody = {
      ...body,
      phone: body.phone ? normalizePhone(body.phone) : undefined,
      email: body.email?.toLowerCase(),
    };

    // Cross-field guard: phone OR email must be present
    // Schema validates normalized E.164 and lowercase email.
    otpRequestSchema.parse(normalizedBody);

    return OtpService.request(normalizedBody, {
      actorId: actor.id,
      ip: meta.ip,
    });
  },

  /**
   * Verifies an OTP code for a specific protected action (e.g. enabling 2FA).
   * 
   * @param body - The code and purpose.
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   * @returns Success status.
   */
  async verify(
    body: OtpVerify,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<{ verified: true }> {
    const normalizedBody = {
      ...body,
      phone: body.phone ? normalizePhone(body.phone) : undefined,
      email: body.email?.toLowerCase(),
    };

    // Cross-field guard: phone OR email must be present
    otpVerifySchema.parse(normalizedBody);

    return OtpService.verify(normalizedBody, { actorId: actor.id, ip: meta.ip });
  },
};

// ---------------------------------------------------------------------------
// 3. PinController
// ---------------------------------------------------------------------------

export const PinController = {
  /**
   * Sets or changes the user's 6-digit security PIN.
   * 
   * @param body - The new PIN and confirmation.
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   */
  async setPin(
    body: SetPin,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    // Cross-field guard: pin === confirmPin
    setPinSchema.parse(body);

    return PinService.setPin(body, { actorId: actor.id, ip: meta.ip });
  },

  /**
   * Initiates a public PIN reset flow by sending an OTP to the user's phone.
   * 
   * @param phone - The target phone number.
   * @param meta - Request metadata (IP).
   * @returns The OTP expiration timestamp.
   */
  async resetRequest(
    phone: string,
    meta: Pick<Meta, "ip">,
  ): Promise<{ expiresAt: string }> {
    return PinService.requestReset(normalizePhone(phone), { ip: meta.ip });
  },

  /**
   * Finalizes a PIN reset using an `otpToken` and a new 6-digit PIN.
   * 
   * @param body - The OTP bridge token and new PIN.
   * @param meta - Request metadata (IP).
   */
  async resetConfirm(body: ResetPin, meta: Pick<Meta, "ip">): Promise<void> {
    const phone = await verifyAndConsumeOtpToken(body.otpToken, "pin_reset");

    // Cross-field guard: newPin === confirmPin
    resetPinSchema.parse(body);

    return PinService.resetPin({ ...body, phone }, { ip: meta.ip });
  },
};

// ---------------------------------------------------------------------------
// 4. UserController
// ---------------------------------------------------------------------------

export const UserController = {
  /**
   * Retrieves a paginated list of all users.
   * Administrative access is verified within the service layer.
   * 
   * @param pagination - Page and limit filters.
   * @param actor - The requesting user.
   * @returns Paginated user profile objects.
   */
  async list(pagination: Pagination, actor: Actor) {
    const { items, total } = await UserService.list(pagination, actor.roleIds);
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },

  /**
   * Retrieves detailed profile information for a specific user ID.
   * Users can always view their own profile; admins can view any profile.
   * 
   * @param id - The UUID of the user to fetch.
   * @param actor - The requesting user.
   * @returns The public profile data.
   */
  async getById(id: string, actor: Actor) {
    return UserService.getById(id, actor.id, actor.roleIds);
  },

  /**
   * Updates user profile fields (e.g. name, email).
   * 
   * @param id - The UUID of the user to update.
   * @param body - Partial user data.
   * @param actor - The requesting user.
   * @param meta - Request metadata (IP).
   * @returns The updated public profile.
   */
  async update(
    id: string,
    body: UpdateProfile,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ) {
    return UserService.update(id, body, {
      actorId: actor.id,
      actorRoles: actor.roleIds,
      ip: meta.ip,
    });
  },

  /**
   * Updates the account status (active, suspended, etc.) of a user.
   * Restricted to administrative users.
   * 
   * @param id - The UUID of the user.
   * @param status - The target status enum.
   * @param actor - The requesting admin.
   * @param meta - Request metadata (IP).
   */
  async updateStatus(
    id: string,
    status: "active" | "suspended" | "deactivated" | "banned",
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ) {
    return UserService.updateStatus(id, status, {
      actorId: actor.id,
      actorRoles: actor.roleIds,
      ip: meta.ip,
    });
  },

  /**
   * Performs a soft-delete on a user account, marking it as deactivated.
   * 
   * @param id - The UUID of the user to delete.
   * @param actor - The requesting user.
   * @param meta - Request metadata (IP).
   */
  async softDelete(
    id: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return UserService.softDelete(id, {
      actorId: actor.id,
      actorRoles: actor.roleIds,
      ip: meta.ip,
    });
  },
};

// ---------------------------------------------------------------------------
// 5. SessionController
// ---------------------------------------------------------------------------

export const SessionController = {
  /**
   * Lists all active login sessions for the currently authenticated user.
   * 
   * @param actor - The authenticated user.
   * @returns An array of sanitized session objects.
   */
  async listMine(actor: Actor) {
    return SessionService.listMine(actor.id);
  },

  /**
   * Revokes (invalidates) a specific session by its ID.
   * 
   * @param sessionId - The UUID of the session.
   * @param actor - The requesting user.
   * @param meta - Request metadata (IP).
   */
  async revoke(
    sessionId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return SessionService.revoke(sessionId, {
      actorId: actor.id,
      actorRoles: actor.roleIds,
      ip: meta.ip,
    });
  },
};

// ---------------------------------------------------------------------------
// 6. TwoFactorController
// ---------------------------------------------------------------------------
export const TwoFactorController = {
  /**
   * Sends an OTP — the first step of enabling 2FA.
   * 
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   * @returns The OTP expiration timestamp.
   */
  async enable(
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<{ expiresAt: string }> {
    return OtpService.request(
      { purpose: "enable_2fa" },
      { actorId: actor.id, ip: meta.ip },
    );
  },

  /**
   * Verifies the OTP — completes the 2FA activation process.
   * 
   * @param totp - The 6-digit code.
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   * @returns Success status.
   */
  async verifyEnable(
    totp: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<{ verified: true }> {
    return OtpService.verify(
      { purpose: "enable_2fa", otp: totp },
      { actorId: actor.id, ip: meta.ip },
    );
  },

  /**
   * Sends an OTP — the first step of disabling 2FA.
   * 
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   * @returns The OTP expiration timestamp.
   */
  async disable(
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<{ expiresAt: string }> {
    return OtpService.request(
      { purpose: "disable_2fa" },
      { actorId: actor.id, ip: meta.ip },
    );
  },

  /**
   * Verifies the OTP — completes the 2FA deactivation process.
   * 
   * @param totp - The 6-digit code.
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   * @returns Success status.
   */
  async verifyDisable(
    totp: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<{ verified: true }> {
    return OtpService.verify(
      { purpose: "disable_2fa", otp: totp },
      { actorId: actor.id, ip: meta.ip },
    );
  },
};

// ---------------------------------------------------------------------------
// 7. RoleController
// ---------------------------------------------------------------------------

export const RoleController = {
  /**
   * Lists all defined roles in the system. 
   * Restricted to admin users.
   * 
   * @param actor - The requesting admin.
   */
  async list(actor: Actor) {
    return RoleService.list(actor.roleIds);
  },

  /**
   * Creates a new user role definition. 
   * Restricted to admin users.
   * 
   * @param body - The role name, slug, and description.
   * @param actor - The requesting admin.
   * @param meta - Request metadata (IP).
   */
  async create(
    body: { name: string; slug: string; description?: string },
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ) {
    return RoleService.create(body, {
      actorId: actor.id,
      actorRoles: actor.roleIds,
      ip: meta.ip,
    });
  },

  /**
   * Deletes a custom role from the system. 
   * Restricted to admin users.
   * 
   * @param roleId - The UUID of the role to delete.
   * @param actor - The requesting admin.
   * @param meta - Request metadata (IP).
   */
  async delete(
    roleId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return RoleService.delete(roleId, {
      actorId: actor.id,
      actorRoles: actor.roleIds,
      ip: meta.ip,
    });
  },

  /**
   * Assigns a specific role to a user. 
   * Restricted to admin users.
   * 
   * @param userId - The UUID of the target user.
   * @param roleId - The UUID of the role to assign.
   * @param actor - The requesting admin.
   * @param meta - Request metadata (IP).
   */
  async assignToUser(
    userId: string,
    roleId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return RoleService.assignToUser(userId, roleId, {
      actorId: actor.id,
      actorRoles: actor.roleIds,
      ip: meta.ip,
    });
  },

  /**
   * Revokes a specific role assignment from a user. 
   * Restricted to admin users.
   * 
   * @param userId - The UUID of the user.
   * @param roleId - The UUID of the role.
   * @param actor - The requesting admin.
   * @param meta - Request metadata (IP).
   */
  async revokeFromUser(
    userId: string,
    roleId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return RoleService.revokeFromUser(userId, roleId, {
      actorId: actor.id,
      actorRoles: actor.roleIds,
      ip: meta.ip,
    });
  },
};

// ---------------------------------------------------------------------------
// 8. ReferralController
// ---------------------------------------------------------------------------

export const ReferralController = {
  /**
   * Retrieves the referral code for the current user.
   * 
   * @param actor - The authenticated user.
   * @returns The referral code and usage metadata.
   */
  async getMyCode(actor: Actor) {
    return ReferralService.getMyCode(actor.id);
  },

  /**
   * Generates a new unique referral code if the user doesn't already have one.
   * 
   * @param actor - The authenticated user.
   * @returns The newly created or existing referral code.
   */
  async generateCode(actor: Actor) {
    return ReferralService.generateCode(actor.id);
  },

  /**
   * Lists users who were referred by the current user.
   * 
   * @param actor - The authenticated user.
   * @param pagination - Pagination settings.
   * @returns Paginated list of referees.
   */
  async listMine(actor: Actor, pagination: Pagination) {
    const { items, total } = await ReferralService.listMine(actor.id, pagination);
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },
};

// ---------------------------------------------------------------------------
// 9. DeviceController
// ---------------------------------------------------------------------------

export const DeviceController = {
  /**
   * Lists hardware devices that have been used to sign into the user's account.
   * 
   * @param actor - The authenticated user.
   * @returns An array of recognized device records.
   */
  async listMine(actor: Actor) {
    return DeviceService.listMine(actor.id);
  },

  /**
   * Updates the trust status of a specific device.
   * 
   * @param deviceId - The UUID of the device ID.
   * @param trusted - Whether the device should be trusted.
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   */
  async setTrusted(
    deviceId: string,
    trusted: boolean,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return DeviceService.setTrusted(deviceId, trusted, {
      actorId: actor.id,
      ip: meta.ip,
    });
  },

  /**
   * Marks a device record as revoked, preventing future automatic logins from it.
   * 
   * @param deviceId - The UUID of the device.
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   */
  async revoke(
    deviceId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return DeviceService.revoke(deviceId, { actorId: actor.id, ip: meta.ip });
  },

  /**
   * Permanently deletes a specific device record from the user's account history.
   * 
   * @param deviceId - The UUID of the device ID.
   * @param actor - The authenticated user.
   * @param meta - Request metadata (IP).
   */
  async remove(
    deviceId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return DeviceService.remove(deviceId, { actorId: actor.id, ip: meta.ip });
  },
};

// ---------------------------------------------------------------------------
// 10. AuditController
// ---------------------------------------------------------------------------

export const AuditController = {
  /**
   * Lists activity and security logs related specifically to the current user.
   * 
   * @param actor - The authenticated user.
   * @param pagination - Pagination settings.
   * @returns Paginated audit log records.
   */
  async listMine(actor: Actor, pagination: Pagination) {
    const { items, total } = await AuditService.listMine(actor.id, pagination);
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },

  /**
   * Lists audit logs for a specific resource type and ID.
   * Restricted to administrative users.
   * 
   * @param resource - The resource type slug (e.g. 'user').
   * @param resourceId - The UUID of the target resource.
   * @param pagination - Pagination settings.
   * @param actor - The requesting admin.
   * @returns Paginated audit log records.
   */
  async listByResource(
    resource: string,
    resourceId: string,
    pagination: Pagination,
    actor: Actor,
  ) {
    const { items, total } = await AuditService.listByResource(
      resource,
      resourceId,
      pagination,
      actor.roleIds,
    );
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },
};

// 1. Remove unused imports        → ok, SuccessResponse no longer needed
// 2. Strip accessTokenJti         → in refresh(), same as toSessionResponse
// 3. Drop explicit return types   → let TypeScript infer from service
// 4. paginatedRaw on list methods → list, listMine, listByResource