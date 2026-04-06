import { pgTable as table } from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  rewardStatusEnum,
  otpPurposeEnum,
  sessionStatusEnum,
  loginFailureReasonEnum,
  referralStatusEnum,
  accountStatusEnum,
  authMethodEnum,
  userRoleEnum,
} from "../shared/enums";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const userTable = table(
  "users",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 255 }),

    email: t.varchar("email", { length: 320 }),
    emailVerified: t.boolean("email_verified").default(false),
    emailVerifiedAt: t.timestamp("email_verified_at", { withTimezone: true }),

    phone: t.varchar("phone", { length: 20 }).notNull(),

    phoneVerifiedAt: t
      .timestamp("phone_verified_at", { withTimezone: true })
      .notNull(),

    pinHash: t.varchar("pin_hash", { length: 255 }),
    pinChangedAt: t.timestamp("pin_changed_at", {
      withTimezone: true,
    }),

    twoFactorEnabled: t.boolean("two_factor_enabled").default(false).notNull(),
    twoFactorSecret: t.varchar("two_factor_secret", { length: 255 }),

    status: accountStatusEnum("status").default("active").notNull(),

    lockedUntil: t.timestamp("locked_until", { withTimezone: true }),

    failedLoginAttempts: t
      .smallint("failed_login_attempts")
      .default(0)
      .notNull(),

    lastLoginAt: t.timestamp("last_login_at", { withTimezone: true }),
    lastLoginIp: t.inet("last_login_ip"),

    deletedAt: t.timestamp("deleted_at", { withTimezone: true }),
    deletedBy: t.uuid("deleted_by"),

    metadata: t.jsonb("metadata").default(sql`'{}'::jsonb`),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },

  (tbl) => [
    t
      .uniqueIndex("users_phone_unique_idx")
      .on(tbl.phone)
      .where(sql`deleted_at IS NULL`),

    t
      .uniqueIndex("users_email_unique_idx")
      .on(tbl.email)
      .where(sql`email IS NOT NULL AND deleted_at IS NULL`),

    t.index("users_status_idx").on(tbl.status),
    t.index("users_deleted_at_idx").on(tbl.deletedAt),

    t
      .index("users_active_idx")
      .on(tbl.id)
      .where(sql`deleted_at IS NULL AND status = 'active'`),
  ],
);

// ---------------------------------------------------------------------------
// OTP Verifications
// ---------------------------------------------------------------------------

export const otpVerificationTable = table(
  "otp_verifications",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "cascade" }),

    phone: t.varchar("phone", { length: 20 }),
    email: t.varchar("email", { length: 320 }),

    purpose: otpPurposeEnum("purpose").notNull(),

    otpHash: t.varchar("otp_hash", { length: 255 }).notNull(),

    attempts: t.smallint("attempts").default(0).notNull(),
    maxAttempts: t.smallint("max_attempts").default(3).notNull(),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }).notNull(),
    verified: t.boolean("verified").default(false).notNull(),
    verifiedAt: t.timestamp("verified_at", { withTimezone: true }),
    consumedAt: t.timestamp("consumed_at", { withTimezone: true }),

    ipAddress: t.inet("ip_address"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },

  (tbl) => [
    t.check("otp_identity_check", sql`phone IS NOT NULL OR email IS NOT NULL`),

    t.index("otp_phone_idx").on(tbl.phone),
    t.index("otp_email_idx").on(tbl.email),
    t.index("otp_userid_idx").on(tbl.userId),
    t.index("otp_expiresat_idx").on(tbl.expiresAt),

    t.uniqueIndex("otp_active_phone_idx").on(tbl.phone, tbl.purpose).where(sql`
    phone IS NOT NULL
    AND verified = false
    AND consumed_at IS NULL
    `),

    t.uniqueIndex("otp_active_email_idx").on(tbl.email, tbl.purpose).where(sql`
    email IS NOT NULL
    AND verified = false
    AND consumed_at IS NULL
    `),
  ],
);

// ---------------------------------------------------------------------------
// User Sessions
// ---------------------------------------------------------------------------

export const userSessionTable = table(
  "user_sessions",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    refreshTokenHash: t
      .varchar("refresh_token_hash", { length: 64 }) // FIX: SHA-256 hex = 64 chars (was 255, sized for argon2)
      .notNull(),

    accessTokenJti: t.uuid("access_token_jti"),

    status: sessionStatusEnum("status").default("active").notNull(),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }).notNull(),

    lastActiveAt: t
      .timestamp("last_active_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    revokedAt: t.timestamp("revoked_at", { withTimezone: true }),
    revokedReason: t.varchar("revoked_reason", { length: 100 }),

    loggedOutAt: t.timestamp("logged_out_at", { withTimezone: true }),

    deviceInfo: t.jsonb("device_info"),
    userAgent: t.text("user_agent"),

    ipAddress: t.inet("ip_address").notNull(),
    ipCountry: t.varchar("ip_country", { length: 2 }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },

  (tbl) => [
    t.index("sessions_userid_idx").on(tbl.userId),
    t.index("sessions_expiresat_idx").on(tbl.expiresAt),
    t.index("sessions_status_idx").on(tbl.status),
    t.index("sessions_refresh_token_idx").on(tbl.refreshTokenHash),

    t
      .index("sessions_active_idx")
      .on(tbl.userId, tbl.expiresAt)
      .where(sql`status = 'active'`),

    t.index("sessions_jti_idx").on(tbl.accessTokenJti),
  ],
);

// ---------------------------------------------------------------------------
// Roles & Permissions (RBAC)
// ---------------------------------------------------------------------------

export const rolesTable = table("roles", {
  id: t.uuid("id").defaultRandom().primaryKey(),
  name: t.varchar("name", { length: 255 }).notNull(),
  slug: t.varchar("slug", { length: 100 }).unique().notNull(),
  description: t.text("description"),
  isSystem: t.boolean("is_system").default(false).notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ? still doubt
export const permissionsTable = table(
  "permissions",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),
    action: t.varchar("action", { length: 100 }).notNull(),
    resource: t.varchar("resource", { length: 100 }).notNull(),
    description: t.text("description"),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("permissions_action_resource_uq")
      .on(tbl.action, tbl.resource),
    t.index("permissions_resource_idx").on(tbl.resource),
  ],
);

// ! review and verified
export const rolePermissionsTable = table(
  "role_permissions",
  {
    roleId: t
      .uuid("role_id")
      .notNull()
      .references(() => rolesTable.id, { onDelete: "cascade" }),

    permissionId: t
      .uuid("permission_id")
      .notNull()
      .references(() => permissionsTable.id, { onDelete: "cascade" }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.primaryKey({ columns: [tbl.roleId, tbl.permissionId] }),
    t.index("role_permissions_role_idx").on(tbl.roleId),
  ],
);

export const userRolesTable = table(
  "user_roles",
  {
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    roleId: t
      .uuid("role_id")
      .notNull()
      .references(() => rolesTable.id, { onDelete: "cascade" }),

    shopId: t.uuid("shop_id"),

    assignedBy: t
      .uuid("assigned_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

    assignedAt: t
      .timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.primaryKey({ columns: [tbl.userId, tbl.roleId] }),
    t
      .uniqueIndex("user_roles_user_role_shop_uq")
      .on(tbl.userId, tbl.roleId, tbl.shopId),
    t.index("user_roles_user_idx").on(tbl.userId),
    t.index("user_roles_role_idx").on(tbl.roleId),
    t.index("user_roles_shop_idx").on(tbl.shopId),
  ],
);

// ---------------------------------------------------------------------------
// Login Attempts (security audit trail)
// ---------------------------------------------------------------------------

export const authAttemptsTable = table(
  "auth_attempts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),

    phoneAttempted: t.varchar("phone_attempted", { length: 20 }),
    method: authMethodEnum("method").notNull(),

    ipAddress: t.inet("ip_address").notNull(),
    ipCountry: t.varchar("ip_country", { length: 2 }),

    userAgent: t.text("user_agent"),

    success: t.boolean("success").default(false).notNull(),

    failureReason: loginFailureReasonEnum("failure_reason"),

    sessionId: t
      .uuid("session_id")
      .references(() => userSessionTable.id, { onDelete: "set null" }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },

  (tbl) => [
    t.index("auth_attempts_user_created_idx").on(tbl.userId, tbl.createdAt),
    t.index("auth_attempts_ip_created_idx").on(tbl.ipAddress, tbl.createdAt),
    t.index("auth_attempts_phone_idx").on(tbl.phoneAttempted),
    t
      .index("auth_attempts_ip_fail_idx")
      .on(tbl.ipAddress, tbl.createdAt)
      .where(sql`success = false`),
  ],
);

// ---------------------------------------------------------------------------
// Referrals
// ---------------------------------------------------------------------------

export const referralCodesTable = table(
  "referral_codes",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    code: t.varchar("code", { length: 20 }).notNull().unique(),
    usageCount: t.integer("usage_count").default(0).notNull(),
    maxUsage: t.integer("max_usage"),
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
    isActive: t.boolean("is_active").default(true).notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("referral_codes_code_uq_idx").on(tbl.code),
    t.index("referral_codes_userid_idx").on(tbl.userId),
  ],
);

export const referralTable = table(
  "referrals",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    referrerId: t
      .uuid("referrer_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    refereeId: t
      .uuid("referee_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    referralCodeId: t
      .uuid("referral_code_id")
      .references(() => referralCodesTable.id, { onDelete: "set null" }),

    codeUsedAt: t.timestamp("code_used_at", { withTimezone: true }),

    status: referralStatusEnum("status").default("pending").notNull(),

    rewardStatus: rewardStatusEnum("reward_status")
      .default("no_reward")
      .notNull(),

    rewardGrantedAt: t.timestamp("reward_granted_at", { withTimezone: true }),

    completedAt: t.timestamp("completed_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.unique("referrals_refereeid_uq").on(tbl.refereeId),
    t.unique("referrals_pair_uq").on(tbl.referrerId, tbl.refereeId),
    t.index("referrals_referrerid_idx").on(tbl.referrerId),
    t.index("referrals_refereeid_idx").on(tbl.refereeId),
    t.index("referrals_status_idx").on(tbl.status),
    t.check(
      "referrals_no_self_referral",
      sql`${tbl.referrerId} <> ${tbl.refereeId}`,
    ),
  ],
);

// ---------------------------------------------------------------------
// Audit Log (immutable append-only trail)
// ---------------------------------------------------------------------------

/**
 * PRODUCTION SCALE WARNING:
 * ---------------------------------------------------------------------------
 * This table records every sign-in and security action. At 100k+ users,
 * it will quickly grow to millions of rows, degrading query performance.
 *
 * Drizzle ORM does not natively support `PARTITION BY RANGE` schema generation yet.
 * Before going to production, you MUST run a manual SQL migration to partition this table:
 *
 * CREATE TABLE auth_audit_log (...) PARTITION BY RANGE (created_at);
 * CREATE TABLE auth_audit_log_y2026m04 PARTITION OF auth_audit_log FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
 *
 * Consider using the `pg_partman` PostgreSQL extension to automate creating
 * future monthly partitions.
 * ---------------------------------------------------------------------------
 */
export const authAuditLogTable = table(
  "auth_audit_log",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    actorId: t
      .uuid("actor_id")
      .references(() => userTable.id, { onDelete: "set null" }),

    actorRole: userRoleEnum("actor_role"),
    actorIp: t.inet("actor_ip"),
    actorUserAgent: t.text("actor_user_agent"),
    requestId: t.uuid("request_id"),

    action: t.varchar("action", { length: 100 }).notNull(),
    resource: t.varchar("resource", { length: 100 }).notNull(),
    resourceId: t.uuid("resource_id"),

    before: t.jsonb("before"),
    after: t.jsonb("after"),

    metadata: t.jsonb("metadata").default(sql`'{}'::jsonb`),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("auth_audit_log_actorid_idx").on(tbl.actorId),
    t.index("auth_audit_log_resource_idx").on(tbl.resource, tbl.resourceId),
    t.index("auth_audit_log_createdat_idx").on(tbl.createdAt),
    t.index("auth_audit_log_action_idx").on(tbl.action),
    t.index("auth_audit_log_requestid_idx").on(tbl.requestId),
  ],
);

// ---------------------------------------------------------------------------
// Rate Limits
// ---------------------------------------------------------------------------

export const rateLimitsTable = table(
  "rate_limits",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    key: t.varchar("key", { length: 255 }).notNull(),
    action: t.varchar("action", { length: 100 }).notNull(),

    attempts: t.integer("attempts").default(0).notNull(),

    windowStart: t.timestamp("window_start", { withTimezone: true }).notNull(),
    windowEnd: t.timestamp("window_end", { withTimezone: true }).notNull(),

    blockedUntil: t.timestamp("blocked_until", { withTimezone: true }),
    lastAttemptAt: t.timestamp("last_attempt_at", { withTimezone: true }),

    metadata: t.jsonb("metadata").default(sql`'{}'::jsonb`),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("rate_limits_key_action_uq").on(tbl.key, tbl.action),
    t.index("rate_limits_window_idx").on(tbl.windowEnd),
    t.index("rate_limits_blocked_idx").on(tbl.blockedUntil),
    t
      .index("rate_limits_active_block_idx")
      .on(tbl.blockedUntil)
      .where(sql`blocked_until IS NOT NULL`),
  ],
);

// ---------------------------------------------------------------------------
// User Devices
// ---------------------------------------------------------------------------

export const userDevicesTable = table(
  "user_devices",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    deviceFingerprint: t
      .varchar("device_fingerprint", { length: 255 })
      .notNull(),

    deviceName: t.varchar("device_name", { length: 255 }),
    deviceType: t.varchar("device_type", { length: 50 }),
    os: t.varchar("os", { length: 100 }),
    browser: t.varchar("browser", { length: 100 }),
    firstIp: t.inet("first_ip"),
    lastIp: t.inet("last_ip"),
    lastCountry: t.varchar("last_country", { length: 2 }),
    trusted: t.boolean("trusted").default(false).notNull(),
    revokedAt: t.timestamp("revoked_at", { withTimezone: true }),
    lastActiveAt: t.timestamp("last_active_at", { withTimezone: true }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .unique("user_devices_fingerprint_uq")
      .on(tbl.userId, tbl.deviceFingerprint),
    t.index("user_devices_userid_idx").on(tbl.userId),
    t.index("user_devices_last_active_idx").on(tbl.lastActiveAt),
  ],
);

// ---------------------------------------------------------------------------
// Model Types
// ---------------------------------------------------------------------------

export type User = InferSelectModel<typeof userTable>;
export type UserInsert = InferInsertModel<typeof userTable>;

export type OtpVerification = InferSelectModel<typeof otpVerificationTable>;
export type OtpVerificationInsert = InferInsertModel<
  typeof otpVerificationTable
>;

export type UserSession = InferSelectModel<typeof userSessionTable>;
export type UserSessionInsert = InferInsertModel<typeof userSessionTable>;

export type Role = InferSelectModel<typeof rolesTable>;
export type RoleInsert = InferInsertModel<typeof rolesTable>;

export type Permission = InferSelectModel<typeof permissionsTable>;
export type PermissionInsert = InferInsertModel<typeof permissionsTable>;

export type RolePermission = InferSelectModel<typeof rolePermissionsTable>;
export type RolePermissionInsert = InferInsertModel<
  typeof rolePermissionsTable
>;

export type UserRole = InferSelectModel<typeof userRolesTable>;
export type UserRoleInsert = InferInsertModel<typeof userRolesTable>;

export type AuthAttempt = InferSelectModel<typeof authAttemptsTable>;
export type AuthAttemptInsert = InferInsertModel<typeof authAttemptsTable>;

export type ReferralCode = InferSelectModel<typeof referralCodesTable>;
export type ReferralCodeInsert = InferInsertModel<typeof referralCodesTable>;

export type Referral = InferSelectModel<typeof referralTable>;
export type ReferralInsert = InferInsertModel<typeof referralTable>;

export type AuditLog = InferSelectModel<typeof authAuditLogTable>;
export type AuditLogInsert = InferInsertModel<typeof authAuditLogTable>;

export type RateLimit = InferSelectModel<typeof rateLimitsTable>;
export type RateLimitInsert = InferInsertModel<typeof rateLimitsTable>;

export type UserDevice = InferSelectModel<typeof userDevicesTable>;
export type UserDeviceInsert = InferInsertModel<typeof userDevicesTable>;
