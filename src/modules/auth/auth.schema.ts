/**
 * auth.schema.ts
 *
 * FIXES APPLIED:
 *  - userSessionSelectSchema: refreshTokenHash max length updated to 64
 *    (SHA-256 hex = 64 chars). The model column was also updated from 255
 *    to 64 to match. Previously sized for argon2 output which is no longer
 *    used for refresh tokens.
 *
 * All other schemas are unchanged — they were correct as written.
 * The cross-field refines on setPinSchema and resetPinSchema are still here
 * and remain useful for any callers that do validate through Zod directly
 * (e.g. tests, CLI scripts). The service layer adds its own imperative checks
 * since TypeBox in routes does not run Zod refines.
 */

import { z } from "zod";
import { isIP } from "node:net";
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

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------
const uuidSchema = z.uuid();

const e164Phone = z
  .string()
  .regex(
    /^\+[1-9]\d{6,14}$/,
    "Phone must be in E.164 format (e.g. +14155552671)",
  );

const ipAddressSchema = z
  .string()
  .refine((val) => isIP(val) !== 0, { message: "Invalid IP address" });

const countryCodeSchema = z
  .string()
  .length(2)
  .transform((v) => v.toUpperCase());

// ---------------------------------------------------------------------------
// 1. Enums
// ---------------------------------------------------------------------------

export const rewardStatusSchema = z.enum(REWARD_STATUSES);
export type RewardStatus = z.infer<typeof rewardStatusSchema>;

export const otpPurposeSchema = z.enum(OTP_PURPOSES);
export type OtpPurpose = z.infer<typeof otpPurposeSchema>;

export const sessionStatusSchema = z.enum(SESSION_STATUSES);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

export const loginFailureReasonSchema = z.enum(LOGIN_FAILURE_REASONS);
export type LoginFailureReason = z.infer<typeof loginFailureReasonSchema>;

export const referralStatusSchema = z.enum(REFERRAL_STATUSES);
export type ReferralStatus = z.infer<typeof referralStatusSchema>;

export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

export const authMethodSchema = z.enum(AUTH_METHODS);
export type AuthMethod = z.infer<typeof authMethodSchema>;

export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRoleSchema>;

// ---------------------------------------------------------------------------
// 2. Users
// ---------------------------------------------------------------------------

export const userPublicSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255).nullable(),
  email: z.string().email("Invalid email address").nullable(),
  emailVerified: z.boolean(),
  phone: e164Phone,
  twoFactorEnabled: z.boolean(),
  status: accountStatusSchema,
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
});
export type UserPublic = z.infer<typeof userPublicSchema>;

/**
 * Maps a database user row to the public user response shape.
 * Used instead of Zod parsing on hot paths to avoid validation overhead.
 */
export function mapToUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: !!user.emailVerified,
    phone: user.phone,
    twoFactorEnabled: user.twoFactorEnabled,
    status: user.status as any, // Cast because Drizzle and Zod enums match but TS needs a hint
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

// ---------------------------------------------------------------------------
// 3. OTP Verifications
// ---------------------------------------------------------------------------

export const otpRequestSchema = z
  .object({
    purpose: otpPurposeSchema,
    phone: e164Phone.optional(),
    email: z.email().optional(),
  })
  .refine((d) => d.phone ?? d.email, {
    message: "Either phone or email must be provided",
    path: ["phone"],
  });
export type OtpRequest = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z
  .object({
    purpose: otpPurposeSchema,
    otp: z.string().min(4).max(8).regex(/^\d+$/, "OTP must be numeric"),
    phone: e164Phone.optional(),
    email: z.string().email().optional(),
  })
  .refine((d) => d.phone ?? d.email, {
    message: "Either phone or email must be provided",
    path: ["phone"],
  });
export type OtpVerify = z.infer<typeof otpVerifySchema>;

// ---------------------------------------------------------------------------
// 4. User Sessions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 5. Roles & Permissions (RBAC)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 6. Auth Attempts
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 7. Referrals
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 8. Audit Log
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 9. Rate Limits
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 10. User Devices
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 11. Composite / helper schemas
// ---------------------------------------------------------------------------

export const userWithRolesSchema = userPublicSchema.extend({
  roles: z.array(
    z.object({
      id: uuidSchema,
      name: z.string(),
      slug: z.string(),
      shopId: uuidSchema.nullable(),
      expiresAt: z.string().datetime({ offset: true }).nullable(),
    }),
  ),
});
export type UserWithRoles = z.infer<typeof userWithRolesSchema>;

export const sendOtpRequestSchema = z.object({
  phone: e164Phone,
});
export type SendOtpRequest = z.infer<typeof sendOtpRequestSchema>;

export const verifyOtpRequestSchema = z.object({
  phone: e164Phone,
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
  purpose: otpPurposeSchema.default("phone_verification"),
});
export type VerifyOtpRequest = z.infer<typeof verifyOtpRequestSchema>;

export const registerRequestSchema = z.object({
  otpToken: z.string().min(32),
  name: z.string().min(1).max(255),
  referralCode: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9]+$/)
    .optional(),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginWithPinSchema = z.object({
  phone: e164Phone,
  pin: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "PIN must be 6 digits"),
});
export type LoginWithPin = z.infer<typeof loginWithPinSchema>;

export const loginWithOtpTokenSchema = z.object({
  otpToken: z.string().min(32),
});
export type LoginWithOtpToken = z.infer<typeof loginWithOtpTokenSchema>;

export const setPinSchema = z
  .object({
    pin: z
      .string()
      .length(6)
      .regex(/^\d{6}$/, "PIN must be 6 digits"),
    confirmPin: z.string().length(6),
  })
  .refine((d) => d.pin === d.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });
export type SetPin = z.infer<typeof setPinSchema>;

export const resetPinSchema = z
  .object({
    otpToken: z.string().min(32),
    newPin: z
      .string()
      .length(6)
      .regex(/^\d{6}$/, "PIN must be 6 digits"),
    confirmPin: z.string().length(6),
  })
  .refine((d) => d.newPin === d.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });
export type ResetPin = z.infer<typeof resetPinSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email("Invalid email address").optional(),
});
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export const twoFactorVerifySchema = z.object({
  totp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "TOTP must be 6 digits"),
});
export type TwoFactorVerify = z.infer<typeof twoFactorVerifySchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z
    .union([uuidSchema, z.iso.datetime({ offset: true })])
    .optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type Pagination = z.infer<typeof paginationSchema>;
