/**
 * modules/auth/auth.controller.ts
 *
 * Layer responsibilities:
 *  - Validate / reshape inputs NOT covered by TypeBox (e.g. missing headers)
 *  - Coordinate one or more services
 *  - Shape / filter the response the client receives
 *  - Centralise logging / metrics hooks (add your logger here)
 *
 * Routes → Controller → Service
 *
 * Rules:
 *  - No Elysia, no TypeBox, no route definitions here
 *  - No direct DB access — always go through a Service
 *  - Throw `status(code, message)` from "elysia" for HTTP errors
 */

import { status } from "elysia";

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
} from "./auth.schema";

import { paginatedRaw } from "../../core/response";

// ---------------------------------------------------------------------------
// Shared context shapes
// ---------------------------------------------------------------------------

export type Meta = {
  ip: string;
  userAgent: string;
};

export type Actor = {
  id: string;
  roles: string[];
};

// ---------------------------------------------------------------------------
// Shared response envelopes
// ---------------------------------------------------------------------------

/** Returned by every login / register endpoint */
export type SessionResponse = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: Date;
  user: unknown;
};

function toSessionResponse(raw: {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  accessTokenJti: string; // internal — stripped from response
  expiresAt: Date;
  user: unknown;
}): SessionResponse {
  // accessTokenJti is an internal field used for session invalidation.
  // Never expose it to the client.
  const { accessTokenJti: _jti, ...response } = raw;
  return response;
}

// ---------------------------------------------------------------------------
// 1. AuthController
// ---------------------------------------------------------------------------

export const AuthController = {
  /**
   * Triggers the delivery of a 6-digit OTP to a phone number.
   * Used for both registration (new users) and OTP-based login (existing users).
   */
  async sendOtp(
    body: SendOtpRequest,
    meta: Pick<Meta, "ip">,
  ): Promise<{ expiresAt: string }> {
    // ← updated return type
    return await AuthService.sendOtp(body, { ip: meta.ip });
  },

  /**
   * Validates the 6-digit OTP sent to the user's phone.
   * Returns an `otpToken` upon success, which serves as a short-lived proof 
   * of phone ownership for subsequent registration or login steps.
   */
  async verifyOtp(
    body: { phone: string; otp: string },
    meta: Pick<Meta, "ip">,
  ): Promise<{ isRegistered: boolean; otpToken: string }> {
    return AuthService.verifyOtp(body, { ip: meta.ip });
  },

  /**
   * Creates a new user account. 
   * Requires a valid `otpToken` from the verification step.
   * Returns the initial session tokens (access/refresh).
   */
  async register(
    body: RegisterRequest,
    meta: Meta & { deviceInfo?: Record<string, unknown> },
  ): Promise<SessionResponse> {
    const raw = await AuthService.register(body, meta);
    return toSessionResponse(raw);
  },

  /**
   * Authenticates an existing user using their phone and 6-digit PIN.
   * Returns new session tokens if the PIN is correct.
   */
  async loginWithPin(
    body: LoginWithPin,
    meta: Meta & { deviceInfo?: Record<string, unknown> },
  ): Promise<SessionResponse> {
    const raw = await AuthService.loginWithPin(body, meta);
    return toSessionResponse(raw);
  },

  /**
   * Authenticates an existing user using a valid `otpToken`.
   * Useful for users who haven't set a PIN or prefer OTP-only login.
   */
  async loginWithOtpToken(
    body: LoginWithOtpToken,
    meta: Meta & { deviceInfo?: Record<string, unknown> },
  ): Promise<SessionResponse> {
    const raw = await AuthService.loginWithOtpToken(body, meta);
    return toSessionResponse(raw);
  },

  /**
   * Rotates the current session's tokens. 
   * Expects the refresh token in the 'x-refresh-token' header.
   * This is a critical security step performed periodically by the client.
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
   * Requests a new OTP for a specific purpose (email verify, account deletion, etc.).
   * This is for users who are already logged in.
   */
  async request(
    body: OtpRequest,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<{ expiresAt: string }> {
    return OtpService.request(body, { actorId: actor.id, ip: meta.ip });
  },

  /**
   * Verifies an OTP code for a specific protected action.
   */
  async verify(
    body: OtpVerify,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<{ verified: true }> {
    return OtpService.verify(body, { actorId: actor.id, ip: meta.ip });
  },
};

// ---------------------------------------------------------------------------
// 3. PinController
// ---------------------------------------------------------------------------

export const PinController = {
  /**
   * Sets or changes the user's 6-digit security PIN.
   */
  async setPin(
    body: SetPin,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return PinService.setPin(body, { actorId: actor.id, ip: meta.ip });
  },

  /**
   * Initiates a PIN reset flow by sending an OTP to the user's phone.
   */
  async resetRequest(
    phone: string,
    meta: Pick<Meta, "ip">,
  ): Promise<{ expiresAt: string }> {
    return PinService.requestReset(phone, { ip: meta.ip });
  },

  /**
   * Finalizes a PIN reset using an `otpToken` and a new 6-digit PIN.
   */
  async resetConfirm(body: ResetPin, meta: Pick<Meta, "ip">): Promise<void> {
    return PinService.resetPin(body, { ip: meta.ip });
  },
};

// ---------------------------------------------------------------------------
// 4. UserController
// ---------------------------------------------------------------------------

export const UserController = {
  /**
   * Retrieves a paginated list of all users.
   * Administrative access is verified within the service layer.
   */
  async list(pagination: Pagination, actor: Actor) {
    const { items, total } = await UserService.list(pagination, actor.roles);
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },

  /**
   * Retrieves detailed profile information for a specific user ID.
   * Users can always view their own profile; admins can view any profile.
   */
  async getById(id: string, actor: Actor) {
    return UserService.getById(id, actor.id, actor.roles);
  },

  /**
   * Updates user profile fields (e.g. name, email).
   */
  async update(
    id: string,
    body: UpdateProfile,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ) {
    return UserService.update(id, body, {
      actorId: actor.id,
      actorRoles: actor.roles,
      ip: meta.ip,
    });
  },

  /**
   * Updates the account status (active, suspended, etc.) of a user.
   * Restricted to administrative users.
   */
  async updateStatus(
    id: string,
    status: "active" | "suspended" | "deactivated" | "banned",
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ) {
    return UserService.updateStatus(id, status, {
      actorId: actor.id,
      actorRoles: actor.roles,
      ip: meta.ip,
    });
  },

  /**
   * Performs a soft-delete on a user account, marking it as deactivated.
   */
  async softDelete(
    id: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return UserService.softDelete(id, {
      actorId: actor.id,
      actorRoles: actor.roles,
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
   */
  async listMine(actor: Actor) {
    return SessionService.listMine(actor.id);
  },

  /**
   * Revokes (invalidates) a specific session by its ID.
   */
  async revoke(
    sessionId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return SessionService.revoke(sessionId, {
      actorId: actor.id,
      actorRoles: actor.roles,
      ip: meta.ip,
    });
  },
};

// ---------------------------------------------------------------------------
// 6. TwoFactorController
// ---------------------------------------------------------------------------
export const TwoFactorController = {
  // Sends OTP — first step of enabling 2FA
  async enable(
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<{ expiresAt: string }> {
    return OtpService.request(
      { purpose: "enable_2fa" },
      { actorId: actor.id, ip: meta.ip },
    );
  },

  // Verifies OTP — completes 2FA activation
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

  // Sends OTP — first step of disabling 2FA
  async disable(
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<{ expiresAt: string }> {
    return OtpService.request(
      { purpose: "disable_2fa" },
      { actorId: actor.id, ip: meta.ip },
    );
  },

  // Verifies OTP — completes 2FA deactivation
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
   * Lists all defined roles in the system. (Admin only)
   */
  async list(actor: Actor) {
    return RoleService.list(actor.roles);
  },

  /**
   * Creates a new user role. (Admin only)
   */
  async create(
    body: { name: string; slug: string; description?: string },
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ) {
    return RoleService.create(body, {
      actorId: actor.id,
      actorRoles: actor.roles,
      ip: meta.ip,
    });
  },

  /**
   * Deletes a role from the system. (Admin only)
   */
  async delete(
    roleId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return RoleService.delete(roleId, {
      actorId: actor.id,
      actorRoles: actor.roles,
      ip: meta.ip,
    });
  },

  /**
   * Assigns a specific role to a user. (Admin only)
   */
  async assignToUser(
    userId: string,
    roleId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return RoleService.assignToUser(userId, roleId, {
      actorId: actor.id,
      actorRoles: actor.roles,
      ip: meta.ip,
    });
  },

  /**
   * Revokes a role from a user. (Admin only)
   */
  async revokeFromUser(
    userId: string,
    roleId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return RoleService.revokeFromUser(userId, roleId, {
      actorId: actor.id,
      actorRoles: actor.roles,
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
   */
  async getMyCode(actor: Actor) {
    return ReferralService.getMyCode(actor.id);
  },

  /**
   * Generates a new unique referral code if the user doesn't already have one.
   */
  async generateCode(actor: Actor) {
    return ReferralService.generateCode(actor.id);
  },

  /**
   * Lists users who were referred by the current user.
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
   * Lists devices that have been used to access the user's account.
   */
  async listMine(actor: Actor) {
    return DeviceService.listMine(actor.id);
  },

  /**
   * Updates the trust status of a specific device.
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
   * Marks a device as revoked, preventing future logins from it.
   */
  async revoke(
    deviceId: string,
    actor: Actor,
    meta: Pick<Meta, "ip">,
  ): Promise<void> {
    return DeviceService.revoke(deviceId, { actorId: actor.id, ip: meta.ip });
  },

  /**
   * Permanently deletes a device record from the user's account.
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
   * Lists security and activity logs related specifically to the current user.
   */
  async listMine(actor: Actor, pagination: Pagination) {
    const { items, total } = await AuditService.listMine(actor.id, pagination);
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },

  /**
   * Lists audit logs for a specific resource (e.g. 'user', 'role').
   * Restricted to administrative users.
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
      actor.roles,
    );
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },
};

// 1. Remove unused imports        → ok, SuccessResponse no longer needed
// 2. Strip accessTokenJti         → in refresh(), same as toSessionResponse
// 3. Drop explicit return types   → let TypeScript infer from service
// 4. paginatedRaw on list methods → list, listMine, listByResource