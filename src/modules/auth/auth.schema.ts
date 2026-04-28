/**
 * auth.schema.ts
 *
 * ⚠️  SINGLE SOURCE OF TRUTH for the Auth module.
 *
 * All TypeBox route schemas, Zod cross-field schemas, internal enum types,
 * and response-shaping mappers live here.
 *
 * Import rules:
 *  - auth.routes.ts     → imports TypeBox schemas (XxxBody) from here
 *  - auth.controller.ts → imports TS types from here
 *  - auth.service.ts    → imports TS types + Zod schemas from here
 *  - auth.repository.ts → imports TS types from here
 *
 * When to use Zod vs TypeBox:
 *  TypeBox → HTTP boundary validation (route body/query/params)
 *  Zod     → Cross-field .refine() checks, DB enum types, response shaping
 *
 * Phone number contract:
 *  Routes accept loose input (e.g. "9876543210" or "+919876543210").
 *  normalizePhone() is called in the CONTROLLER layer — services always
 *  receive a clean E.164 string and never need to think about formatting.
 */

import { t, type Static } from "elysia";
import { z } from "zod";
import type { User } from "../../db/schema";
import {
  ACCOUNT_STATUSES,
  AUTH_METHODS,
  LOGIN_FAILURE_REASONS,
  OTP_PURPOSES,
  REFERRAL_STATUSES,
  REWARD_STATUSES,
  SESSION_STATUSES,
  USER_ROLES,
} from "../../db/shared/enums";

// ─────────────────────────────────────────────────────────────────────────────
// 0. Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a `as const` string array into a TypeBox t.Union of t.Literal.
 * Keeps TypeBox enums in sync with DB enum arrays automatically.
 *
 * @example
 * const OtpPurpose = toUnion(OTP_PURPOSES)
 */
function toUnion<T extends readonly string[]>(arr: T) {
  return t.Union(arr.map((v) => t.Literal(v)) as any);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Shared TypeBox primitives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loose phone pattern — accepts raw local input (e.g. "9876543210")
 * as well as E.164 (e.g. "+919876543210").
 * normalizePhone() in the controller converts this to strict E.164
 * before it reaches the service layer.
 */
export const E164Phone = t.String({
  pattern: "^(\\+[1-9]\\d{6,14}|\\d{10,12})$",
  description: "Phone number — E.164 or 10-12 digit local format",
});

export const UUIDParam = t.Object({
  id: t.String({ format: "uuid" }),
});

import {type Pagination, type PaginationQuery } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// 2. TypeBox enum schemas — derived from DB enum arrays (single source)
// ─────────────────────────────────────────────────────────────────────────────

export const OtpPurposeSchema = toUnion(OTP_PURPOSES);
export const AccountStatusSchema = toUnion(ACCOUNT_STATUSES);
export const SessionStatusSchema = toUnion(SESSION_STATUSES);
export const UserRoleSchema = toUnion(USER_ROLES);
export const AuthMethodSchema = toUnion(AUTH_METHODS);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Route body / param schemas (TypeBox)
//    Used directly in auth.routes.ts for HTTP boundary validation.
//    TS types are derived via Static<> — no duplication.
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────

export const SendOtpBody = t.Object({
  phone: E164Phone,
});

export const VerifyOtpBody = t.Object({
  phone: E164Phone,
  otp: t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
});

export const RegisterBody = t.Object({
  otpToken: t.String({ minLength: 32, description: "From /auth/otp/verify" }),
  name: t.String({ minLength: 1, maxLength: 255 }),
  referralCode: t.Optional(
    t.String({ minLength: 3, maxLength: 20, pattern: "^[A-Z0-9]+$" }),
  ),
});

export const LoginWithPinBody = t.Object({
  phone: E164Phone,
  pin: t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
});

export const LoginWithOtpTokenBody = t.Object({
  otpToken: t.String({ minLength: 32, description: "From /auth/otp/verify" }),
});

export const SignOutBody = t.Object({
  sessionId: t.String({ format: "uuid" }),
});

// ── OTP ──────────────────────────────────────────────────────────────────────

export const OtpRequestBody = t.Object({
  purpose: OtpPurposeSchema,
  phone: t.Optional(E164Phone),
  email: t.Optional(t.String({ format: "email" })),
});

export const OtpVerifyBody = t.Object({
  purpose: OtpPurposeSchema,
  otp: t.String({ minLength: 4, maxLength: 8, pattern: "^\\d+$" }),
  phone: t.Optional(E164Phone),
  email: t.Optional(t.String({ format: "email" })),
});

// ── PIN ───────────────────────────────────────────────────────────────────────

export const SetPinBody = t.Object({
  pin: t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
  confirmPin: t.String({ minLength: 6, maxLength: 6 }),
});

export const PinResetRequestBody = t.Object({
  phone: E164Phone,
});

export const PinResetConfirmBody = t.Object({
  otpToken: t.String({ minLength: 32 }),
  newPin: t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
  confirmPin: t.String({ minLength: 6, maxLength: 6 }),
});

// ── User / profile ────────────────────────────────────────────────────────────

export const UpdateProfileBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  email: t.Optional(t.String({ format: "email" })),
});

export const UpdateStatusBody = t.Object({
  status: AccountStatusSchema,
});

// ── 2FA ───────────────────────────────────────────────────────────────────────

export const TwoFactorVerifyBody = t.Object({
  totp: t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
});

// ── Roles ─────────────────────────────────────────────────────────────────────

export const CreateRoleBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  slug: t.String({ minLength: 1, maxLength: 100, pattern: "^[a-z0-9-]+$" }),
  description: t.Optional(t.String({ maxLength: 1000 })),
});

export const RoleParams = t.Object({
  roleId: t.String({ format: "uuid" }),
});

export const RoleUserParams = t.Object({
  roleId: t.String({ format: "uuid" }),
  userId: t.String({ format: "uuid" }),
});

// ── Device / audit ────────────────────────────────────────────────────────────

export const SetTrustedBody = t.Object({
  trusted: t.Boolean(),
});

export const ResourceAuditParams = t.Object({
  resource: t.String(),
  resourceId: t.String({ format: "uuid" }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TypeScript types — derived from TypeBox via Static<>
//    Used in controllers and services. No duplication, no drift.
// ─────────────────────────────────────────────────────────────────────────────

export type SendOtpRequest = Static<typeof SendOtpBody>;
export type VerifyOtpRequest = Static<typeof VerifyOtpBody>;
export type RegisterRequest = Static<typeof RegisterBody>;
export type LoginWithPin = Static<typeof LoginWithPinBody>;
export type LoginWithOtpToken = Static<typeof LoginWithOtpTokenBody>;
export type UpdateProfile = Static<typeof UpdateProfileBody>;
export type TwoFactorVerify = Static<typeof TwoFactorVerifyBody>;

export { Pagination, PaginationQuery };

// ─────────────────────────────────────────────────────────────────────────────
// 5. Internal DB enum types (Zod)
//    Derived from the same DB arrays — used in service / repo layer.
//    TypeBox enums (section 2) and Zod enums (here) both derive from the
//    same DB arrays — change the array, both update automatically.
// ─────────────────────────────────────────────────────────────────────────────

export const rewardStatusSchema = z.enum(REWARD_STATUSES);
export const otpPurposeSchema = z.enum(OTP_PURPOSES);
export const sessionStatusSchema = z.enum(SESSION_STATUSES);
export const loginFailureReasonSchema = z.enum(LOGIN_FAILURE_REASONS);
export const referralStatusSchema = z.enum(REFERRAL_STATUSES);
export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export const authMethodSchema = z.enum(AUTH_METHODS);
export const userRoleSchema = z.enum(USER_ROLES);

export type RewardStatus = z.infer<typeof rewardStatusSchema>;
export type OtpPurpose = z.infer<typeof otpPurposeSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type LoginFailureReason = z.infer<typeof loginFailureReasonSchema>;
export type ReferralStatus = z.infer<typeof referralStatusSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type AuthMethod = z.infer<typeof authMethodSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// 6. Cross-field Zod schemas
//    TypeBox cannot express these — .refine() is Zod's unique value here.
//    Services call .parse() on these AFTER TypeBox has already validated
//    individual field shapes at the route boundary.
// ─────────────────────────────────────────────────────────────────────────────
// Primitives for consistent validation across the module
const phoneSchema = z.string().regex(/^\+[1-9]\d{6,14}$/, "Invalid phone format");
const otpSchema = z.string().length(6).regex(/^\d{6}$/, "OTP must be 6 digits");
const pinSchema = z.string().length(6).regex(/^\d{6}$/, "PIN must be 6 digits");
const tokenSchema = z.string().min(32);

/**
 * SetPin — enforces pin === confirmPin.
 * PinService.setPin() calls setPinSchema.parse(body).
 */
export const setPinSchema = z
  .object({
    pin: pinSchema,
    confirmPin: z.string().length(6),
  })
  .refine((d) => d.pin === d.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

export type SetPin = z.infer<typeof setPinSchema>;

/**
 * ResetPin — enforces newPin === confirmPin.
 * PinService.resetPin() calls resetPinSchema.parse(body).
 */
export const resetPinSchema = z
  .object({
    otpToken: tokenSchema,
    newPin: pinSchema,
    confirmPin: z.string().length(6),
  })
  .refine((d) => d.newPin === d.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

export type ResetPin = z.infer<typeof resetPinSchema>;

/**
 * OtpRequest — enforces at least one of phone or email is present.
 * TypeBox cannot express "either phone or email must be present".
 * OtpService.request() calls otpRequestSchema.parse(body).
 * Note: phone is already normalized to E.164 by the controller.
 */
export const otpRequestSchema = z
  .object({
    purpose: otpPurposeSchema,
    phone: phoneSchema.optional(),
    email: z.email().optional(),
  })
  .refine(
    (d) =>
      d.phone ??
      d.email ??
      ["enable_2fa", "disable_2fa"].includes(d.purpose),
    {
      message: "Either phone or email must be provided",
      path: ["phone"],
    },
  );

export type OtpRequest = z.infer<typeof otpRequestSchema>;

/**
 * OtpVerify — same either/or constraint as OtpRequest.
 * OtpService.verify() calls otpVerifySchema.parse(body).
 * Note: phone is already normalized to E.164 by the controller.
 */
export const otpVerifySchema = z
  .object({
    purpose: otpPurposeSchema,
    otp: z.string().min(4).max(8).regex(/^\d+$/, "OTP must be numeric"),
    phone: phoneSchema.optional(),
    email: z.email().optional(),
  })
  .refine(
    (d) =>
      d.phone ??
      d.email ??
      ["enable_2fa", "disable_2fa"].includes(d.purpose),
    {
      message: "Either phone or email must be provided",
      path: ["phone"],
    },
  );

export type OtpVerify = z.infer<typeof otpVerifySchema>;

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const registerSchema = z.object({
  otpToken: tokenSchema,
  name: z.string().min(1, "Name is required").max(255),
  referralCode: z.string().min(3).max(20).optional(),
});

export const loginWithPinSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
});

export const loginWithOtpTokenSchema = z.object({
  otpToken: tokenSchema,
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Response shaping (Zod)
//    Outbound types — strips sensitive DB fields before data leaves the
//    service layer. mapToUserPublic() is the runtime enforcement.
// ─────────────────────────────────────────────────────────────────────────────

const uuidSchema = z.uuid();
const e164Strict = z.string().regex(/^\+[1-9]\d{6,14}$/); // outbound is always strict E.164

/**
 * Public user profile sent to clients.
 * Strips: pinHash, failedLoginAttempts, lockedUntil, deletedAt, etc.
 */
export const userPublicSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255).nullable(),
  email: z.email().nullable(),
  emailVerified: z.boolean(),
  phone: e164Strict,
  twoFactorEnabled: z.boolean(),
  status: accountStatusSchema,
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
});

export type UserPublic = z.infer<typeof userPublicSchema>;

/**
 * Maps a raw Drizzle User record to the sanitized UserPublic type.
 * Only place in the codebase where sensitive fields are stripped.
 *
 * @param user - Raw DB record from UserRepository.
 * @returns A sanitized public user profile safe to send to clients.
 */
export function mapToUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: !!user.emailVerified,
    phone: user.phone,
    twoFactorEnabled: user.twoFactorEnabled,
    status: user.status as AccountStatus,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

/**
 * Extended user profile including assigned roles.
 * Used for admin views or JWT payload enrichment.
 */
export const userWithRolesSchema = userPublicSchema.extend({
  roles: z.array(
    z.object({
      id: uuidSchema,
      name: z.string(),
      slug: z.string(),
      shopId: uuidSchema.nullable(),
      expiresAt: z.iso.datetime({ offset: true }).nullable(),
    }),
  ),
});


export const verifyDigilockerAccountSchema = z
  .object({
    verificationId: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-zA-Z0-9._\-]+$/, "Invalid verification ID"),
    mobileNumber: z.string().min(5).max(15).optional(),
    aadhaarNumber: z
      .string()
      .length(12)
      .regex(/^\d{12}$/, "Must be 12 digits")
      .optional(),
  })
  .refine(
    (d) => d.mobileNumber !== undefined || d.aadhaarNumber !== undefined,
    {
      message: "Either mobileNumber or aadhaarNumber is required",
      path: ["mobileNumber"],
    },
  );

export type VerifyDigilockerAccount = z.infer<typeof verifyDigilockerAccountSchema>;

export type UserWithRoles = z.infer<typeof userWithRolesSchema>;
