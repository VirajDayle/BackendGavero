/**
 * Routes for the Authentication module.
 *
 * Public vs Protected Split:
 * - PUBLIC: No JWT required. Includes OTP request/verify, registration, login, and token refresh.
 * - PROTECTED: Requires a valid JWT access token and an active session (verified via JTI blacklist).
 *
 * Layer Responsibilities:
 * - Extract HTTP inputs (body, params, headers, ip, userAgent).
 * - Enforce rate limits at the infrastructure level.
 * - Delegate business orchestration to the controller layer.
 *
 * Security Rule: Routes MUST NOT import from auth.service directly; always use the controller.
 */

import { Elysia, t } from "elysia";
import { jwtAuthPlugin } from "../../middleware/auth.middleware";
import { rbacGuard, rbacPlugin } from "../../middleware/rbac.middleware";
import { ROLES } from "../../shared";

import {
  AuthController,
  AuditController,
  DeviceController,
  OtpController,
  PinController,
  ReferralController,
  RoleController,
  SessionController,
  TwoFactorController,
  UserController,
} from "./auth.controller";

import { rateLimit } from "../../middleware/rateLimit.middleware";
import { env } from "../../config/env";
import {
  UUIDParam,
  SendOtpBody,
  VerifyOtpBody,
  RegisterBody,
  LoginWithPinBody,
  LoginWithOtpTokenBody,
  SignOutBody,
  OtpRequestBody,
  OtpVerifyBody,
  SetPinBody,
  PinResetRequestBody,
  PinResetConfirmBody,
  UpdateProfileBody,
  UpdateStatusBody,
  TwoFactorVerifyBody,
  CreateRoleBody,
  RoleParams,
  RoleUserParams,
  SetTrustedBody,
  ResourceAuditParams,
} from "./auth.schema";

import { PaginationQuerySchema, parsePagination } from "../../shared/index";
// ── Rate limit windows ────────────────────────────────────────────────────────

const RL_WINDOW = env.RATE_LIMIT_WINDOW_MIN * 60;
const RL_OTP_WINDOW = env.RATE_LIMIT_OTP_WINDOW_SEC;
const RL_COOLDOWN = env.RATE_LIMIT_COOLDOWN_SEC;

// ── Shared TypeBox primitives ─────────────────────────────────────────────────
// Schemas imported from auth.schema.ts

import {
  authenticate,
  resolveRequestContext,
} from "../../shared/utils/request.utils";
// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES — No JWT Required
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Public Authentication Routes.
 * Handles the initial entry points for users: OTP delivery, verification,
 * registration, login, and refresh token rotation.
 */
export const publicAuthRoutes = new Elysia({ prefix: "/auth", tags: ["Auth"] })
  .derive(resolveRequestContext)

  // Step 1: Send a 6-digit OTP to the user's phone number.
  // Works for both new (registration) and existing (login) users.
  .post("/otp/send", ({ body, ip }) => AuthController.sendOtp(body, { ip }), {
    body: SendOtpBody,
    detail: { summary: "Send OTP to phone — new and returning users" },
    beforeHandle: [
      // Layer 1: IP-based limit (prevent general infrastructure abuse)
      rateLimit({
        max: env.RATE_LIMIT_OTP_SEND_MAX,
        windowSec: RL_OTP_WINDOW,
        action: "otp:send:ip",
      }),
      // Layer 2: Phone-based limit (prevent targeted SMS spam / cost abuse)
      rateLimit({
        max: 5,
        windowSec: RL_OTP_WINDOW, // 5 OTPs per 15-minute window per phone
        action: "otp:send:phone",
        key: ({ body }: { body?: { phone?: string } }) =>
          body?.phone ?? "unknown",
      }),
      // Layer 3: Short cooldown (force a minimum gap between sends)
      rateLimit({
        max: 1,
        windowSec: RL_COOLDOWN, // 1 request per cooldown window per phone
        action: "otp:send:cooldown",
        key: ({ body }: { body?: { phone?: string } }) =>
          body?.phone ?? "unknown",
      }),
    ],
  })

  // Step 2: Verify the 6-digit OTP sent to the phone.
  // If valid, returns an `otpToken` which is used in the next step (register/login).
  .post(
    "/otp/verify",
    ({ body, ip }) => AuthController.verifyOtp(body, { ip }),
    {
      body: VerifyOtpBody,
      detail: {
        summary: "Verify phone OTP",
        description:
          "Returns { isRegistered, otpToken }. Use otpToken in /auth/register or /auth/login/otp.",
      },
      beforeHandle: [
        // Layer 1: IP-based
        rateLimit({
          max: env.RATE_LIMIT_OTP_VERIFY_MAX,
          windowSec: RL_WINDOW,
          action: "otp:verify:ip",
        }),
        // Layer 2: Phone-based
        rateLimit({
          max: 6,
          windowSec: RL_WINDOW,
          action: "otp:verify:phone",
          key: ({ body }: { body?: { phone?: string } }) =>
            body?.phone ?? "unknown",
        }),
      ],
    },
  )

  // Step 3a: Register a new account using the `otpToken` from Step 2.
  // Requires a name and optional referral code. Returns access/refresh tokens.
  .post(
    "/register",
    ({ body, ip, userAgent, deviceInfo }) =>
      AuthController.register(body, { ip, userAgent, deviceInfo }),
    {
      body: RegisterBody,
      detail: { summary: "Register a new user" },
      beforeHandle: [
        // IP cap: otpToken is single-use & short-lived but we still guard
        // against bulk registration attempts from the same IP.
        rateLimit({
          max: 5,
          windowSec: RL_WINDOW,
          action: "register:ip",
        }),
      ],
    },
  )

  // Alternative: Login using phone number and a pre-set 6-digit PIN.
  // Fast-track login for returning users who have already set a PIN.
  .post(
    "/login/pin",
    ({ body, ip, userAgent, deviceInfo }) =>
      AuthController.loginWithPin(body, { ip, userAgent, deviceInfo }),
    {
      body: LoginWithPinBody,
      detail: { summary: "Login with phone + PIN" },
      beforeHandle: [
        // Layer 1: IP-based
        rateLimit({
          max: env.RATE_LIMIT_LOGIN_PIN_MAX,
          windowSec: RL_WINDOW,
          action: "login:pin:ip",
        }),
        // Layer 2: Phone-based
        rateLimit({
          max: 5,
          windowSec: RL_WINDOW,
          action: "login:pin:phone",
          key: ({ body }: { body?: { phone?: string } }) =>
            body?.phone ?? "unknown",
        }),
      ],
    },
  )

  // Step 3b: Login for existing users using the `otpToken` from Step 2.
  // Used when a user doesn't want to use a PIN or hasn't set one yet.
  .post(
    "/login/otp",
    ({ body, ip, userAgent, deviceInfo }) =>
      AuthController.loginWithOtpToken(body, { ip, userAgent, deviceInfo }),
    {
      body: LoginWithOtpTokenBody,
      detail: { summary: "Login via OTP token" },
      beforeHandle: [
        rateLimit({
          max: env.RATE_LIMIT_LOGIN_OTP_MAX,
          windowSec: RL_WINDOW,
          action: "login:otp",
        }),
      ],
    },
  )

  .post(
    "/token/refresh",
    ({ headers, ip }) =>
      // Exchange a refresh token for a new access token.
      // Expects the 'x-refresh-token' header.
      AuthController.refresh(headers["x-refresh-token"], { ip }),
    {
      detail: { summary: "Rotate access token using x-refresh-token header" },
      beforeHandle: [
        // Prevent token farming from a single IP
        rateLimit({
          max: env.RATE_LIMIT_REFRESH_MAX,
          windowSec: RL_WINDOW,
          action: "token:refresh:ip",
        }),
      ],
    },
  );

// ── 2. Public PIN routes ──────────────────────────────────────────────────────

/**
 * Public PIN Management Routes.
 * Used exclusively for resetting a forgotten PIN via out-of-band OTP verification.
 * These are public because the user is typically locked out and cannot provide a JWT.
 */
export const publicPinRoutes = new Elysia({ prefix: "/pin", tags: ["PIN"] })
  .derive(resolveRequestContext)

  .post(
    "/reset/request",
    ({ body, ip }) => PinController.resetRequest(body.phone, { ip }),
    {
      body: PinResetRequestBody,
      detail: { summary: "Request PIN reset OTP" },
      beforeHandle: [
        // Layer 1: IP-based
        rateLimit({
          max: env.RATE_LIMIT_PIN_RESET_MAX,
          windowSec: RL_WINDOW,
          action: "pin:reset:ip",
        }),
        // Layer 2: Phone-based
        rateLimit({
          max: 3,
          windowSec: RL_WINDOW,
          action: "pin:reset:phone",
          key: ({ body }: { body?: { phone?: string } }) =>
            body?.phone ?? "unknown",
        }),
      ],
    },
  )

  .post(
    "/reset/confirm",
    ({ body, ip }) => PinController.resetConfirm(body, { ip }),
    {
      body: PinResetConfirmBody,
      detail: { summary: "Confirm PIN reset with OTP token and new PIN" },
    },
  );

// ═════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES — JWT & Active Session Required
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Protected Authentication Routes.
 * Requires a valid Bearer token. Handles session termination and logout.
 */
export const protectedAuthRoutes = new Elysia({
  prefix: "/auth",
  tags: ["Auth"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  // Log out of a specific device or browser session.
  .post(
    "/logout",
    ({ actor, body, ip }) =>
      AuthController.logout(body.sessionId, actor, { ip }),
    {
      body: SignOutBody,
      detail: {
        summary: "Logout from a specific session",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  // Log out of ALL sessions (panic button / security reset).
  .post(
    "/logout/all",
    ({ actor, ip }) => AuthController.logoutAll(actor, { ip }),
    {
      detail: {
        summary: "Revoke all active sessions",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── 4. Protected PIN routes ───────────────────────────────────────────────────

/**
 * Protected PIN Management Routes.
 * Allows authenticated users to set or update their security PIN.
 */
export const protectedPinRoutes = new Elysia({ prefix: "/pin", tags: ["PIN"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  // Set or update the account's 6-digit security PIN.
  .post(
    "/set",
    ({ actor, body, ip }) => PinController.setPin(body, actor, { ip }),
    {
      body: SetPinBody,
      detail: {
        summary: "Set or change PIN (requires active session)",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── 5. OTP routes (protected) ─────────────────────────────────────────────────

/**
 * Protected OTP Routes.
 * Generic OTP flow for authenticated users (e.g. verifying email or deactivating account).
 */
export const otpRoutes = new Elysia({ prefix: "/otp", tags: ["OTP"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .post(
    "/request",
    ({ actor, body, ip }) => OtpController.request(body, actor, { ip }),
    {
      body: OtpRequestBody,
      detail: {
        summary: "Request OTP for email verify, 2FA, or account deletion",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/verify",
    ({ actor, body, ip }) => OtpController.verify(body, actor, { ip }),
    {
      body: OtpVerifyBody,
      detail: {
        summary: "Verify an OTP code",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── 6. User / profile routes (protected) ─────────────────────────────────────

/**
 * Protected User profile routes.
 * Management of user account data and metadata.
 */
export const userRoutes = new Elysia({ prefix: "/users", tags: ["Users"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get(
    "/",
    ({ actor, query }) => UserController.list(parsePagination(query), actor),
    {
      beforeHandle: [rbacGuard([ROLES.ADMIN])],
      query: PaginationQuerySchema,
      detail: {
        summary: "List all users (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .get("/me", ({ actor }) => UserController.getById(actor.id, actor), {
    detail: {
      summary: "Get current user profile",
      security: [{ bearerAuth: [] }],
    },
  })

  .get(
    "/:id",
    ({ actor, params }) => UserController.getById(params.id, actor),
    {
      beforeHandle: [rbacGuard([ROLES.ADMIN])],
      params: UUIDParam,
      detail: {
        summary: "Get a user by ID",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch(
    "/me",
    ({ actor, body, ip }) =>
      UserController.update(actor.id, body, actor, { ip }),
    {
      body: UpdateProfileBody,
      detail: {
        summary: "Update current user profile",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch(
    "/:id",
    ({ actor, params, body, ip }) =>
      UserController.update(params.id, body, actor, { ip }),
    {
      beforeHandle: [rbacGuard([ROLES.ADMIN])],
      params: UUIDParam,
      body: UpdateProfileBody,
      detail: {
        summary: "Update a user profile (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch(
    "/:id/status",
    ({ actor, params, body, ip }) =>
      UserController.updateStatus(params.id, body.status, actor, { ip }),
    {
      beforeHandle: [rbacGuard([ROLES.ADMIN])],
      params: UUIDParam,
      body: UpdateStatusBody,
      detail: {
        summary: "Update account status (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete(
    "/me",
    ({ actor, ip }) => UserController.softDelete(actor.id, actor, { ip }),
    {
      detail: {
        summary: "Delete current user account",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete(
    "/:id",
    ({ actor, params, ip }) =>
      UserController.softDelete(params.id, actor, { ip }),
    {
      beforeHandle: [rbacGuard([ROLES.ADMIN])],
      params: UUIDParam,
      detail: {
        summary: "Soft-delete a user account (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── 7. 2FA routes (protected) ─────────────────────────────────────────────────

/**
 * Protected Two-Factor Authentication routes.
 * Management of MFA status for the authenticated account.
 */
export const twoFactorRoutes = new Elysia({ prefix: "/2fa", tags: ["2FA"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  // Step 1 of enabling: sends OTP to user's phone
  .post(
    "/enable",
    ({ actor, ip }) => TwoFactorController.enable(actor, { ip }),
    {
      detail: {
        summary: "Enable 2FA — step 1, sends OTP to phone",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  // Step 2 of enabling: verify OTP → sets twoFactorEnabled = true
  .post(
    "/enable/verify",
    ({ actor, body, ip }) =>
      TwoFactorController.verifyEnable(body.totp, actor, { ip }),
    {
      body: TwoFactorVerifyBody,
      detail: {
        summary: "Enable 2FA — step 1.5, confirm OTP to activate",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  // Step 1 of disabling: sends OTP to confirm identity before disabling
  .post(
    "/disable",
    ({ actor, ip }) => TwoFactorController.disable(actor, { ip }),
    {
      detail: {
        summary: "Disable 2FA — step 1, sends OTP to phone",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  // Step 2 of disabling: verify OTP → sets twoFactorEnabled = false
  .post(
    "/disable/verify",
    ({ actor, body, ip }) =>
      TwoFactorController.verifyDisable(body.totp, actor, { ip }),
    {
      body: TwoFactorVerifyBody,
      detail: {
        summary: "Disable 2FA — step 2, confirm OTP to deactivate",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── 8. Session routes (protected) ─────────────────────────────────────────────

/**
 * Protected Session routes.
 * View and revoke active login sessions across devices.
 */
export const sessionRoutes = new Elysia({
  prefix: "/sessions",
  tags: ["Sessions"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get("/", ({ actor }) => SessionController.listMine(actor), {
    detail: {
      summary: "List active sessions",
      security: [{ bearerAuth: [] }],
    },
  })

  .delete(
    "/:id",
    ({ actor, params, ip }) =>
      SessionController.revoke(params.id, actor, { ip }),
    {
      params: UUIDParam,
      detail: {
        summary: "Revoke a specific session",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── 9. Device routes (protected) ──────────────────────────────────────────────

/**
 * Protected Device routes.
 * Management of hardware fingerprints and device-level trust/revocation.
 */
export const deviceRoutes = new Elysia({
  prefix: "/devices",
  tags: ["Devices"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get("/", ({ actor }) => DeviceController.listMine(actor), {
    detail: {
      summary: "List known devices",
      security: [{ bearerAuth: [] }],
    },
  })

  .patch(
    "/:id",
    ({ actor, params, body, ip }) =>
      DeviceController.setTrusted(params.id, body.trusted, actor, { ip }),
    {
      params: UUIDParam,
      body: SetTrustedBody,
      detail: {
        summary: "Trust or untrust a device",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete(
    "/:id/revoke",
    ({ actor, params, ip }) =>
      DeviceController.revoke(params.id, actor, { ip }),
    {
      params: UUIDParam,
      detail: {
        summary: "Soft-revoke a device",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete(
    "/:id",
    ({ actor, params, ip }) =>
      DeviceController.remove(params.id, actor, { ip }),
    {
      params: UUIDParam,
      detail: {
        summary: "Permanently remove a device",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── 10. Referral routes (protected) ───────────────────────────────────────────

/**
 * Protected Referral routes.
 * Tracking and generation of referral codes.
 */
export const referralRoutes = new Elysia({
  prefix: "/referrals",
  tags: ["Referrals"],
})
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get("/my-code", ({ actor }) => ReferralController.getMyCode(actor), {
    detail: {
      summary: "Get current user's referral code",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/generate-code",
    ({ actor }) => ReferralController.generateCode(actor),
    {
      detail: {
        summary: "Generate a referral code (idempotent)",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .get(
    "/",
    ({ actor, query }) =>
      ReferralController.listMine(actor, parsePagination(query)),
    {
      query: PaginationQuerySchema,
      detail: {
        summary: "List referrals made by current user",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── 11. Role routes (protected — admin only) ──────────────────────────────────

/**
 * Protected RBAC/Role Management routes.
 * Creating, assigning, and revoking roles. Most are restricted to administrators.
 */
export const roleRoutes = new Elysia({ prefix: "/roles", tags: ["Roles"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .use(rbacPlugin([ROLES.ADMIN]))

  .get("/", ({ actor }) => RoleController.list(actor), {
    detail: {
      summary: "List all roles (admin)",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/",
    ({ actor, body, ip }) => RoleController.create(body, actor, { ip }),
    {
      body: CreateRoleBody,
      detail: {
        summary: "Create a new role (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete(
    "/:roleId",
    ({ actor, params, ip }) =>
      RoleController.delete(params.roleId, actor, { ip }),
    {
      params: RoleParams,
      detail: {
        summary: "Delete a non-system role (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/:roleId/users/:userId",
    ({ actor, params, ip }) =>
      RoleController.assignToUser(params.userId, params.roleId, actor, { ip }),
    {
      params: RoleUserParams,
      detail: {
        summary: "Assign role to user (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete(
    "/:roleId/users/:userId",
    ({ actor, params, ip }) =>
      RoleController.revokeFromUser(params.userId, params.roleId, actor, {
        ip,
      }),
    {
      params: RoleUserParams,
      detail: {
        summary: "Revoke role from user (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── 12. Audit routes (protected) ──────────────────────────────────────────────

/**
 * Protected Audit log routes.
 * Security auditing and tracking resource changes.
 */
export const auditRoutes = new Elysia({ prefix: "/audit", tags: ["Audit"] })
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get(
    "/me",
    ({ actor, query }) =>
      AuditController.listMine(actor, parsePagination(query)),
    {
      query: PaginationQuerySchema,
      detail: {
        summary: "List audit entries for current user",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .get(
    "/resource/:resource/:resourceId",
    ({ actor, params, query }) =>
      AuditController.listByResource(
        params.resource,
        params.resourceId,
        parsePagination(query),
        actor,
      ),
    {
      beforeHandle: [rbacGuard([ROLES.ADMIN])],
      params: ResourceAuditParams,
      query: PaginationQuerySchema,
      detail: {
        summary: "List audit entries for a resource (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  );

/**
 * Composed Authentication Plugin.
 * Mounts all auth-related sub-routes into the main Elysia application.
 */
export const authPlugin = new Elysia({ name: "auth-plugin" })
  // ── Public ──
  .use(publicAuthRoutes)
  .use(publicPinRoutes)
  // ── Protected ──
  .use(protectedAuthRoutes)
  .use(protectedPinRoutes)
  .use(otpRoutes)
  .use(userRoutes)
  .use(twoFactorRoutes)
  .use(sessionRoutes)
  .use(deviceRoutes)
  .use(referralRoutes)
  .use(roleRoutes)
  .use(auditRoutes);
