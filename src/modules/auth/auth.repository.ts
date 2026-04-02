/**
 * auth.repository.ts
 *
 * Data-access layer — one repository class per domain aggregate.
 *
 * FIXES APPLIED:
 *  - UserRoleRepository.assign(): onConflictDoNothing returns undefined on
 *    conflict; return type changed to Promise<UserRole | null>, null-safe.
 *  - RolePermissionRepository.assign(): same fix as above.
 */

import { and, desc, eq, gt, gte, isNull, lt, or, sql } from "drizzle-orm";
import type { DB } from "../../db/index";
import {
  authAttemptsTable,
  authAuditLogTable,
  otpVerificationTable,
  permissionsTable,
  rateLimitsTable,
  referralCodesTable,
  referralTable,
  rolePermissionsTable,
  rolesTable,
  userDevicesTable,
  userRolesTable,
  userSessionTable,
  userTable,
} from "../../db/schema";

import type {
  User,
  UserInsert,
  OtpVerification,
  OtpVerificationInsert,
  UserSession,
  UserSessionInsert,
  Role,
  RoleInsert,
  Permission,
  PermissionInsert,
  RolePermission,
  RolePermissionInsert,
  UserRole,
  UserRoleInsert,
  AuthAttempt,
  AuthAttemptInsert,
  ReferralCode,
  ReferralCodeInsert,
  Referral,
  ReferralInsert,
  AuditLog,
  AuditLogInsert,
  RateLimit,
  RateLimitInsert,
  UserDevice,
  UserDeviceInsert,
} from "../../db/schema";

import { env } from "../../config/env";
import { redis } from "../../config/redis";
// ---------------------------------------------------------------------------
import type { Pagination } from "./auth.schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type UserUpdate = Partial<UserInsert>;
type UserSessionUpdate = Partial<UserSessionInsert>;
type RoleUpdate = Partial<RoleInsert>;
type ReferralUpdate = Partial<ReferralInsert>;
type RateLimitUpdate = Partial<RateLimitInsert>;
type UserDeviceUpdate = Partial<UserDeviceInsert>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

function applyPagination(limit: number, page: number) {
  return { limit, offset: (page - 1) * limit };
}

// Replace applyCursorPagination in auth.repository.ts
function applyCursorPagination(
  column: any,
  cursor: string | undefined,
  order: "asc" | "desc",
  existingWhere?: any
) {
  if (!cursor) return existingWhere;
  const cursorClause = order === "asc" ? gt(column, cursor) : lt(column, cursor);
  return existingWhere ? and(existingWhere, cursorClause) : cursorClause;
}


// ---------------------------------------------------------------------------
// 1. UserRepository
// ---------------------------------------------------------------------------

/**
 * Repository for User account data.
 * Handles profiles, account status (ban/suspend), and security metadata (PIN hashes, failed attempts).
 */
export class UserRepository {
  constructor(private readonly db: DB) { }
  /**
   * Finds a user by their UUID.
   * By default, filters out soft-deleted accounts.
   */
  async findById(
    id: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<User | null> {
    const conditions = [eq(userTable.id, id)];
    if (!opts.includeDeleted) conditions.push(isNull(userTable.deletedAt));

    const [row] = await this.db
      .select()
      .from(userTable)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  async findByEmail(
    email: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<User | null> {
    const conditions = [eq(userTable.email, email.toLowerCase())];
    if (!opts.includeDeleted) conditions.push(isNull(userTable.deletedAt));

    const [row] = await this.db
      .select()
      .from(userTable)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a user by their phone number. Used during registration and login.
   */
  async findByPhone(
    phone: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<User | null> {
    const conditions = [eq(userTable.phone, phone)];
    if (!opts.includeDeleted) conditions.push(isNull(userTable.deletedAt));

    const [row] = await this.db
      .select()
      .from(userTable)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  async list(
    pagination: Pagination,
  ): Promise<{ items: User[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseWhere = isNull(userTable.deletedAt);
    const where = applyCursorPagination(
      userTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(userTable)
      .where(where)
      .orderBy(
        pagination.order === "asc"
          ? userTable.createdAt
          : desc(userTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  async create(data: UserInsert): Promise<User> {
    const [row] = await this.db
      .insert(userTable)
      .values({
        ...data,
        ...(data.email ? { email: data.email.toLowerCase() } : {}),
      })
      .returning();

    return row;
  }

  async update(id: string, data: UserUpdate): Promise<User | null> {
    const [row] = await this.db
      .update(userTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)))
      .returning();

    return row ?? null;
  }

  /**
   * Sets the `deleted_at` timestamp for a user.
   * Prevents them from being found by standard repository lookups.
   */
  async softDelete(id: string, deletedBy: string): Promise<User | null> {
    const [row] = await this.db
      .update(userTable)
      .set({ deletedAt: new Date(), deletedBy, updatedAt: new Date() })
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)))
      .returning();

    return row ?? null;
  }

  /**
   * Anti-Brute Force: Atomically increments the failed login counter.
   */
  async incrementFailedLogins(id: string): Promise<number> {
    const [row] = await this.db
      .update(userTable)
      .set({
        failedLoginAttempts: sql`${userTable.failedLoginAttempts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, id))
      .returning({ failedLoginAttempts: userTable.failedLoginAttempts });

    return row?.failedLoginAttempts ?? 0;
  }

  async resetFailedLogins(id: string): Promise<void> {
    await this.db
      .update(userTable)
      .set({ failedLoginAttempts: 0, updatedAt: new Date() })
      .where(eq(userTable.id, id))
      .returning();
  }

  /**
   * Anti-Brute Force: Temporarily locks the account from future logins.
   */
  async lockUntil(id: string, until: Date): Promise<User | null> {
    const [row] = await this.db
      .update(userTable)
      .set({ lockedUntil: until, updatedAt: new Date() })
      .where(eq(userTable.id, id))
      .returning();

    return row ?? null;
  }

  async markEmailVerified(id: string): Promise<User | null> {
    const [row] = await this.db
      .update(userTable)
      .set({
        emailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, id))
      .returning();

    return row ?? null;
  }

  async markPhoneVerified(id: string): Promise<User | null> {
    const [row] = await this.db
      .update(userTable)
      .set({
        phoneVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, id))
      .returning();

    return row ?? null;
  }

  async updateLastLogin(id: string, ip: string): Promise<User | null> {
    const [row] = await this.db
      .update(userTable)
      .set({ lastLoginAt: new Date(), lastLoginIp: ip, updatedAt: new Date() })
      .where(eq(userTable.id, id))
      .returning();

    return row ?? null;
  }

  async updatePinHash(id: string, pinHash: string): Promise<User | null> {
    const [row] = await this.db
      .update(userTable)
      .set({
        pinHash,
        pinChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)))
      .returning();

    return row ?? null;
  }
}

// ---------------------------------------------------------------------------
// 2. OtpRepository
// ---------------------------------------------------------------------------

/**
 * Repository for One-Time Password (OTP) verifications.
 * Handles generation, consumption, and brute-force protection for SMS/Email codes.
 */
export class OtpRepository {
  constructor(private readonly db: DB) { }

  // Add inside OtpRepository class
  async incrementAndGetAttempts(id: string): Promise<{ attempts: number }> {
    const [row] = await this.db
      .update(otpVerificationTable)
      .set({ attempts: sql`${otpVerificationTable.attempts} + 1` })
      .where(eq(otpVerificationTable.id, id))
      .returning({ attempts: otpVerificationTable.attempts });

    return row;
  }

  /**
   * Finds a valid, non-expired, and non-consumed OTP by phone number and purpose.
   */
  async findActiveByPhone(
    phone: string,
    purpose: OtpVerification["purpose"],
  ): Promise<OtpVerification | null> {
    const [row] = await this.db
      .select()
      .from(otpVerificationTable)
      .where(
        and(
          eq(otpVerificationTable.phone, phone),
          eq(otpVerificationTable.purpose, purpose),
          eq(otpVerificationTable.verified, false),
          isNull(otpVerificationTable.consumedAt),
          gt(otpVerificationTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findActiveByEmail(
    email: string,
    purpose: OtpVerification["purpose"],
  ): Promise<OtpVerification | null> {
    const [row] = await this.db
      .select()
      .from(otpVerificationTable)
      .where(
        and(
          eq(otpVerificationTable.email, email.toLowerCase()),
          eq(otpVerificationTable.purpose, purpose),
          eq(otpVerificationTable.verified, false),
          isNull(otpVerificationTable.consumedAt),
          gt(otpVerificationTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findActiveByUserAndPurpose(
    userId: string,
    purpose: OtpVerification["purpose"],
  ): Promise<OtpVerification | null> {
    const [row] = await this.db
      .select()
      .from(otpVerificationTable)
      .where(
        and(
          eq(otpVerificationTable.userId, userId),
          eq(otpVerificationTable.purpose, purpose),
          eq(otpVerificationTable.verified, false),
          isNull(otpVerificationTable.consumedAt),
          gt(otpVerificationTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async create(data: OtpVerificationInsert): Promise<OtpVerification> {
    const [row] = await this.db
      .insert(otpVerificationTable)
      .values({
        ...data,
        ...(data.email ? { email: data.email.toLowerCase() } : {}),
      })
      .returning();

    return row;
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.db
      .update(otpVerificationTable)
      .set({ attempts: sql`${otpVerificationTable.attempts} + 1` })
      .where(eq(otpVerificationTable.id, id));
  }

  async markVerified(id: string): Promise<OtpVerification | null> {
    const [row] = await this.db
      .update(otpVerificationTable)
      .set({ verified: true, verifiedAt: new Date() })
      .where(eq(otpVerificationTable.id, id))
      .returning();

    return row ?? null;
  }

  async consume(id: string): Promise<OtpVerification | null> {
    const [row] = await this.db
      .update(otpVerificationTable)
      .set({ consumedAt: new Date() })
      .where(eq(otpVerificationTable.id, id))
      .returning();

    return row ?? null;
  }

  /**
   * Atomically marks an OTP as verified AND consumed in a single UPDATE.
   * Prevents the race condition where a crash between markVerified() and
   * consume() could leave an OTP verified but reusable.
   */
  async markVerifiedAndConsume(id: string): Promise<OtpVerification | null> {
    const now = new Date();
    const [row] = await this.db
      .update(otpVerificationTable)
      .set({ verified: true, verifiedAt: now, consumedAt: now })
      .where(
        and(
          eq(otpVerificationTable.id, id),
          isNull(otpVerificationTable.consumedAt),
        ),
      )
      .returning();

    return row ?? null;
  }

  /**
   * Consumes all currently active OTPs for a specific phone and purpose.
   * Typically called before sending a fresh OTP.
   */
  async invalidateActiveByPhone(
    phone: string,
    purpose: OtpVerification["purpose"],
  ): Promise<void> {
    await this.db
      .update(otpVerificationTable)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(otpVerificationTable.phone, phone),
          eq(otpVerificationTable.purpose, purpose),
          isNull(otpVerificationTable.consumedAt),
        ),
      );
  }

  async invalidateActive(
    userId: string,
    purpose: OtpVerification["purpose"],
  ): Promise<void> {
    await this.db
      .update(otpVerificationTable)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(otpVerificationTable.userId, userId),
          eq(otpVerificationTable.purpose, purpose),
          isNull(otpVerificationTable.consumedAt),
        ),
      );
  }
}

// ---------------------------------------------------------------------------
// 3. SessionRepository
// ---------------------------------------------------------------------------

/**
 * Repository for User Sessions.
 * Manages token hashes, session status (active/revoked/logged_out), and rotation metadata.
 */
export class SessionRepository {
  constructor(private readonly db: DB) { }

  async findById(id: string): Promise<UserSession | null> {
    const [row] = await this.db
      .select()
      .from(userSessionTable)
      .where(eq(userSessionTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByRefreshTokenHash(hash: string): Promise<UserSession | null> {
    const [row] = await this.db
      .select()
      .from(userSessionTable)
      .where(eq(userSessionTable.refreshTokenHash, hash))
      .limit(1);

    return row ?? null;
  }

  async findByAccessTokenJti(jti: string): Promise<UserSession | null> {
    const [row] = await this.db
      .select()
      .from(userSessionTable)
      .where(eq(userSessionTable.accessTokenJti, jti))
      .limit(1);

    return row ?? null;
  }

  /**
   * Retrieves all active, non-expired sessions for a user.
   * Used to show the user their current logins or for mass-revocation.
   */
  async listActiveByUser(userId: string): Promise<UserSession[]> {
    return this.db
      .select()
      .from(userSessionTable)
      .where(
        and(
          eq(userSessionTable.userId, userId),
          eq(userSessionTable.status, "active"),
          gt(userSessionTable.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(userSessionTable.lastActiveAt));
  }

  async create(data: UserSessionInsert): Promise<UserSession> {
    const [row] = await this.db
      .insert(userSessionTable)
      .values(data)
      .returning();

    return row;
  }

  async update(
    id: string,
    data: UserSessionUpdate,
  ): Promise<UserSession | null> {
    const [row] = await this.db
      .update(userSessionTable)
      .set(clean(data))
      .where(eq(userSessionTable.id, id))
      .returning();

    return row ?? null;
  }

  async touchLastActive(id: string): Promise<void> {
    await this.db
      .update(userSessionTable)
      .set({ lastActiveAt: new Date() })
      .where(eq(userSessionTable.id, id));
  }

  /**
   * Admin/System Function: Forces a session into 'revoked' status.
   */
  async revoke(id: string, reason: string): Promise<UserSession | null> {
    const [row] = await this.db
      .update(userSessionTable)
      .set({ status: "revoked", revokedAt: new Date(), revokedReason: reason })
      .where(eq(userSessionTable.id, id))
      .returning();

    if (row && row.accessTokenJti) {
      await redis.setex(`revoke_jti:${row.accessTokenJti}`, (env.JWT_ACCESS_TTL_MIN ?? 15) * 60, "revoked");
    }

    return row ?? null;
  }

  async revokeAllByUser(userId: string, reason: string): Promise<void> {
    const rows = await this.db
      .update(userSessionTable)
      .set({ status: "revoked", revokedAt: new Date(), revokedReason: reason })
      .where(
        and(
          eq(userSessionTable.userId, userId),
          eq(userSessionTable.status, "active"),
        ),
      )
      .returning();

    if (rows.length > 0) {
      const ttl = (env.JWT_ACCESS_TTL_MIN ?? 15) * 60;
      const pipeline = redis.pipeline();
      for (const row of rows) {
        if (row.accessTokenJti) {
          pipeline.setex(`revoke_jti:${row.accessTokenJti}`, ttl, "revoked");
        }
      }
      await pipeline.exec();
    }
  }

  /**
   * Marks a session as 'logged_out' upon user request.
   */
  async logout(id: string): Promise<UserSession | null> {
    const [row] = await this.db
      .update(userSessionTable)
      .set({ status: "logged_out", loggedOutAt: new Date() })
      .where(eq(userSessionTable.id, id))
      .returning();

    if (row && row.accessTokenJti) {
      await redis.setex(`revoke_jti:${row.accessTokenJti}`, (env.JWT_ACCESS_TTL_MIN ?? 15) * 60, "logged_out");
    }

    return row ?? null;
  }
}

// ---------------------------------------------------------------------------
// 4. RoleRepository
// ---------------------------------------------------------------------------

/**
 * Repository for Role definitions (e.g., 'admin', 'customer').
 */
export class RoleRepository {
  constructor(private readonly db: DB) { }

  async findById(id: string): Promise<Role | null> {
    const [row] = await this.db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findBySlug(slug: string): Promise<Role | null> {
    const [row] = await this.db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.slug, slug))
      .limit(1);

    return row ?? null;
  }

  async list(): Promise<Role[]> {
    return this.db.select().from(rolesTable).orderBy(rolesTable.name);
  }

  async create(data: RoleInsert): Promise<Role> {
    const [row] = await this.db.insert(rolesTable).values(data).returning();
    return row;
  }

  async update(id: string, data: RoleUpdate): Promise<Role | null> {
    const [row] = await this.db
      .update(rolesTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(and(eq(rolesTable.id, id), eq(rolesTable.isSystem, false)))
      .returning();

    return row ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(rolesTable)
      .where(and(eq(rolesTable.id, id), eq(rolesTable.isSystem, false)));

    return (result.rowCount ?? 0) > 0;
  }
}

// ---------------------------------------------------------------------------
// 5. PermissionRepository
// ---------------------------------------------------------------------------

/**
 * Repository for individual Permission nodes (e.g., 'create', 'user').
 */
export class PermissionRepository {
  constructor(private readonly db: DB) { }

  async findById(id: string): Promise<Permission | null> {
    const [row] = await this.db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByActionResource(
    action: string,
    resource: string,
  ): Promise<Permission | null> {
    const [row] = await this.db
      .select()
      .from(permissionsTable)
      .where(
        and(
          eq(permissionsTable.action, action),
          eq(permissionsTable.resource, resource),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async list(): Promise<Permission[]> {
    return this.db
      .select()
      .from(permissionsTable)
      .orderBy(permissionsTable.resource, permissionsTable.action);
  }

  async create(data: PermissionInsert): Promise<Permission> {
    const [row] = await this.db
      .insert(permissionsTable)
      .values(data)
      .returning();
    return row;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(permissionsTable)
      .where(eq(permissionsTable.id, id));

    return (result.rowCount ?? 0) > 0;
  }
}

// ---------------------------------------------------------------------------
// 6. RolePermissionRepository
// ---------------------------------------------------------------------------

/**
 * Repository for Role-to-Permission mappings (the 'Bridge' table).
 */
export class RolePermissionRepository {
  constructor(private readonly db: DB) { }

  async listByRole(roleId: string): Promise<RolePermission[]> {
    return this.db
      .select()
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.roleId, roleId));
  }

  // FIX: Return type is now Promise<RolePermission | null>.
  // onConflictDoNothing() yields no row on conflict — the old code typed the
  // return as Promise<RolePermission> and returned undefined silently.
  async assign(data: RolePermissionInsert): Promise<RolePermission | null> {
    const [row] = await this.db
      .insert(rolePermissionsTable)
      .values(data)
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  async revoke(roleId: string, permissionId: string): Promise<boolean> {
    const result = await this.db
      .delete(rolePermissionsTable)
      .where(
        and(
          eq(rolePermissionsTable.roleId, roleId),
          eq(rolePermissionsTable.permissionId, permissionId),
        ),
      );

    return (result.rowCount ?? 0) > 0;
  }
}

// ---------------------------------------------------------------------------
// 7. UserRoleRepository
// ---------------------------------------------------------------------------

/**
 * Repository for User-to-Role assignments.
 */
export class UserRoleRepository {
  constructor(private readonly db: DB) { }

  async listByUser(userId: string): Promise<UserRole[]> {
    return this.db
      .select()
      .from(userRolesTable)
      .where(
        and(
          eq(userRolesTable.userId, userId),
          or(
            isNull(userRolesTable.expiresAt),
            gt(userRolesTable.expiresAt, new Date()),
          ),
        ),
      );
  }

  /**
   * Retrieves the raw list of role slugs assigned to a user.
   * Primarily used for JWT payload construction.
   */
  async findByUserId(userId: string): Promise<{ roleSlug: string }[]> {
    return this.db
      .select({
        roleSlug: rolesTable.slug,
      })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(
        and(
          eq(userRolesTable.userId, userId),
          or(
            isNull(userRolesTable.expiresAt),
            gt(userRolesTable.expiresAt, new Date()),
          ),
        ),
      );
  }

  // FIX: Return type is now Promise<UserRole | null>.
  // onConflictDoNothing() yields no row on conflict — the old code returned
  // undefined while typed as Promise<UserRole>, causing silent type lies.
  async assign(data: UserRoleInsert): Promise<UserRole | null> {
    const [row] = await this.db
      .insert(userRolesTable)
      .values(data)
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  async revoke(
    userId: string,
    roleId: string,
    shopId?: string | null,
  ): Promise<boolean> {
    const conditions = [
      eq(userRolesTable.userId, userId),
      eq(userRolesTable.roleId, roleId),
    ];

    if (shopId !== undefined) {
      conditions.push(
        shopId === null
          ? isNull(userRolesTable.shopId)
          : eq(userRolesTable.shopId, shopId),
      );
    }

    const result = await this.db
      .delete(userRolesTable)
      .where(and(...conditions));

    return (result.rowCount ?? 0) > 0;
  }
}

/**
 * Repository for tracking Authentication attempts (Login history).
 * Primarily used for security monitoring and brute-force detection.
 */
export class AuthAttemptRepository {
  constructor(private readonly db: DB) { }

  async create(data: AuthAttemptInsert): Promise<AuthAttempt> {
    const [row] = await this.db
      .insert(authAttemptsTable)
      .values(data)
      .returning();

    return row;
  }

  async countRecentFailuresByIp(
    ip: string,
    windowMinutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(authAttemptsTable)
      .where(
        and(
          eq(authAttemptsTable.ipAddress, ip),
          eq(authAttemptsTable.success, false),
          gte(authAttemptsTable.createdAt, since),
        ),
      );

    return row?.count ?? 0;
  }

  async countRecentFailuresByUser(
    userId: string,
    windowMinutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(authAttemptsTable)
      .where(
        and(
          eq(authAttemptsTable.userId, userId),
          eq(authAttemptsTable.success, false),
          gte(authAttemptsTable.createdAt, since),
        ),
      );

    return row?.count ?? 0;
  }

  async countRecentFailuresByPhone(
    phone: string,
    windowMinutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(authAttemptsTable)
      .where(
        and(
          eq(authAttemptsTable.phoneAttempted, phone),
          eq(authAttemptsTable.success, false),
          gte(authAttemptsTable.createdAt, since),
        ),
      );

    return row?.count ?? 0;
  }

  async listByUser(
    userId: string,
    pagination: Pagination,
  ): Promise<AuthAttempt[]> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const where = applyCursorPagination(
      authAttemptsTable.id,
      pagination.cursor,
      pagination.order,
      eq(authAttemptsTable.userId, userId),
    );

    return this.db
      .select()
      .from(authAttemptsTable)
      .where(where)
      .orderBy(
        pagination.order === "asc"
          ? authAttemptsTable.createdAt
          : desc(authAttemptsTable.createdAt),
      )
      .limit(limit)
      .offset(offset);
  }
}

/**
 * Repository for Referral Codes (the codes shared by users).
 */
export class ReferralCodeRepository {
  constructor(private readonly db: DB) { }

  async findByCode(code: string): Promise<ReferralCode | null> {
    const [row] = await this.db
      .select()
      .from(referralCodesTable)
      .where(eq(referralCodesTable.code, code.toUpperCase()))
      .limit(1);

    return row ?? null;
  }

  async findActiveByCode(code: string): Promise<ReferralCode | null> {
    const [row] = await this.db
      .select()
      .from(referralCodesTable)
      .where(
        and(
          eq(referralCodesTable.code, code.toUpperCase()),
          eq(referralCodesTable.isActive, true),
          or(
            isNull(referralCodesTable.expiresAt),
            gt(referralCodesTable.expiresAt, new Date()),
          ),
          or(
            isNull(referralCodesTable.maxUsage),
            lt(referralCodesTable.usageCount, referralCodesTable.maxUsage),
          ),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findByUserId(userId: string): Promise<ReferralCode | null> {
    const [row] = await this.db
      .select()
      .from(referralCodesTable)
      .where(eq(referralCodesTable.userId, userId))
      .limit(1);

    return row ?? null;
  }

  async create(data: ReferralCodeInsert): Promise<ReferralCode> {
    const [row] = await this.db
      .insert(referralCodesTable)
      .values({ ...data, code: data.code.toUpperCase() })
      .returning();

    return row;
  }

  async incrementUsage(id: string): Promise<void> {
    await this.db
      .update(referralCodesTable)
      .set({ usageCount: sql`${referralCodesTable.usageCount} + 1` })
      .where(eq(referralCodesTable.id, id));
  }

  async deactivate(id: string): Promise<void> {
    await this.db
      .update(referralCodesTable)
      .set({ isActive: false })
      .where(eq(referralCodesTable.id, id));
  }
}

/**
 * Repository for Referral instances (the actual link between referee and referrer).
 */
export class ReferralRepository {
  constructor(private readonly db: DB) { }

  async findByReferee(refereeId: string): Promise<Referral | null> {
    const [row] = await this.db
      .select()
      .from(referralTable)
      .where(eq(referralTable.refereeId, refereeId))
      .limit(1);

    return row ?? null;
  }

  async listByReferrer(
    referrerId: string,
    pagination: Pagination,
  ): Promise<{ items: Referral[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseWhere = eq(referralTable.referrerId, referrerId);
    const where = applyCursorPagination(
      referralTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(referralTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(referralTable)
      .where(where)
      .orderBy(
        pagination.order === "asc"
          ? referralTable.createdAt
          : desc(referralTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  async create(data: ReferralInsert): Promise<Referral> {
    const [row] = await this.db.insert(referralTable).values(data).returning();
    return row;
  }

  async update(id: string, data: ReferralUpdate): Promise<Referral | null> {
    const [row] = await this.db
      .update(referralTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(referralTable.id, id))
      .returning();

    return row ?? null;
  }
}

/**
 * Repository for high-level Authentication Audit Logs.
 * Tracks events like account creation, status changes, and role assignments.
 */
export class AuditLogRepository {
  constructor(private readonly db: DB) { }

  async create(data: AuditLogInsert): Promise<AuditLog> {
    const [row] = await this.db
      .insert(authAuditLogTable)
      .values(data)
      .returning({
        id: sql<string>`id::text`,
        actorId: authAuditLogTable.actorId,
        actorRole: authAuditLogTable.actorRole,
        actorIp: authAuditLogTable.actorIp,
        actorUserAgent: authAuditLogTable.actorUserAgent,
        requestId: authAuditLogTable.requestId,
        action: authAuditLogTable.action,
        resource: authAuditLogTable.resource,
        resourceId: authAuditLogTable.resourceId,
        before: authAuditLogTable.before,
        after: authAuditLogTable.after,
        metadata: authAuditLogTable.metadata,
        createdAt: authAuditLogTable.createdAt,
      });
    return row as unknown as AuditLog;
  }

  async listByActor(
    actorId: string,
    pagination: Pagination,
  ): Promise<{ items: AuditLog[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseWhere = eq(authAuditLogTable.actorId, actorId);
    const where = applyCursorPagination(
      authAuditLogTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(authAuditLogTable)
      .where(baseWhere);

    const items = await this.db
      .select({
        id: sql<string>`id::text`,
        actorId: authAuditLogTable.actorId,
        actorRole: authAuditLogTable.actorRole,
        actorIp: authAuditLogTable.actorIp,
        actorUserAgent: authAuditLogTable.actorUserAgent,
        requestId: authAuditLogTable.requestId,
        action: authAuditLogTable.action,
        resource: authAuditLogTable.resource,
        resourceId: authAuditLogTable.resourceId,
        before: authAuditLogTable.before,
        after: authAuditLogTable.after,
        metadata: authAuditLogTable.metadata,
        createdAt: authAuditLogTable.createdAt,
      })
      .from(authAuditLogTable)
      .where(where)
      .orderBy(
        pagination.order === "asc"
          ? authAuditLogTable.createdAt
          : desc(authAuditLogTable.createdAt),
      )
      .limit(limit)
      .offset(offset);
    return { items: items as unknown as AuditLog[], total: countRow?.count ?? 0 };
  }

  async listByResource(
    resource: string,
    resourceId: string,
    pagination: Pagination,
  ): Promise<{ items: AuditLog[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseWhere = and(
      eq(authAuditLogTable.resource, resource),
      eq(authAuditLogTable.resourceId, resourceId),
    );
    const where = applyCursorPagination(
      authAuditLogTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(authAuditLogTable)
      .where(baseWhere);

    const items = await this.db
      .select({
        id: sql<string>`id::text`,
        actorId: authAuditLogTable.actorId,
        actorRole: authAuditLogTable.actorRole,
        actorIp: authAuditLogTable.actorIp,
        actorUserAgent: authAuditLogTable.actorUserAgent,
        requestId: authAuditLogTable.requestId,
        action: authAuditLogTable.action,
        resource: authAuditLogTable.resource,
        resourceId: authAuditLogTable.resourceId,
        before: authAuditLogTable.before,
        after: authAuditLogTable.after,
        metadata: authAuditLogTable.metadata,
        createdAt: authAuditLogTable.createdAt,
      })
      .from(authAuditLogTable)
      .where(where)
      .orderBy(
        pagination.order === "asc"
          ? authAuditLogTable.createdAt
          : desc(authAuditLogTable.createdAt),
      )
      .limit(limit)
      .offset(offset);
    return { items: items as unknown as AuditLog[], total: countRow?.count ?? 0 };
  }

  async listByTimeRange(
    from: Date,
    to: Date,
    pagination: Pagination,
  ): Promise<AuditLog[]> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const items = await this.db
      .select({
        id: sql<string>`id::text`,
        actorId: authAuditLogTable.actorId,
        actorRole: authAuditLogTable.actorRole,
        actorIp: authAuditLogTable.actorIp,
        actorUserAgent: authAuditLogTable.actorUserAgent,
        requestId: authAuditLogTable.requestId,
        action: authAuditLogTable.action,
        resource: authAuditLogTable.resource,
        resourceId: authAuditLogTable.resourceId,
        before: authAuditLogTable.before,
        after: authAuditLogTable.after,
        metadata: authAuditLogTable.metadata,
        createdAt: authAuditLogTable.createdAt,
      })
      .from(authAuditLogTable)
      .where(
        and(
          gte(authAuditLogTable.createdAt, from),
          lt(authAuditLogTable.createdAt, to),
        ),
      )
      .orderBy(desc(authAuditLogTable.createdAt))
      .limit(limit)
      .offset(offset);
    return items as unknown as AuditLog[];
  }
}

/**
 * Repository for sliding-window Rate Limiting data.
 * Supports flexible window sizes and blocking logic.
 */
export class RateLimitRepository {
  constructor(private readonly db: DB) { }

  async findByKeyAndAction(
    key: string,
    action: string,
  ): Promise<RateLimit | null> {
    const [row] = await this.db
      .select()
      .from(rateLimitsTable)
      .where(
        and(eq(rateLimitsTable.key, key), eq(rateLimitsTable.action, action)),
      )
      .limit(1);

    return row ?? null;
  }

  async upsert(data: RateLimitInsert): Promise<RateLimit> {
    const [row] = await this.db
      .insert(rateLimitsTable)
      .values(data)
      .onConflictDoUpdate({
        target: [rateLimitsTable.key, rateLimitsTable.action],
        set: {
          attempts: sql`${rateLimitsTable.attempts} + 1`,
          lastAttemptAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return row;
  }

  async update(id: string, data: RateLimitUpdate): Promise<RateLimit | null> {
    const [row] = await this.db
      .update(rateLimitsTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(rateLimitsTable.id, id))
      .returning();

    return row ?? null;
  }

  async block(id: string, until: Date): Promise<void> {
    await this.db
      .update(rateLimitsTable)
      .set({ blockedUntil: until, updatedAt: new Date() })
      .where(eq(rateLimitsTable.id, id));
  }

  async reset(key: string, action: string): Promise<void> {
    await this.db
      .update(rateLimitsTable)
      .set({ attempts: 0, blockedUntil: null, updatedAt: new Date() })
      .where(
        and(eq(rateLimitsTable.key, key), eq(rateLimitsTable.action, action)),
      );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db
      .delete(rateLimitsTable)
      .where(lt(rateLimitsTable.windowEnd, new Date()));

    return result.rowCount ?? 0;
  }

  /**
   * High-level rate limit check.
   * Increments the counter and returns true if the limit is exceeded.
   */
  async checkAndIncrement(
    key: string,
    action: string,
    opts: { max: number; windowSec: number },
  ): Promise<boolean> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + opts.windowSec * 1000);

    const [row] = await this.db
      .insert(rateLimitsTable)
      .values({
        key,
        action,
        attempts: 1,
        windowStart: now,
        windowEnd,
        lastAttemptAt: now,
      })
      .onConflictDoUpdate({
        target: [rateLimitsTable.key, rateLimitsTable.action],
        set: {
          attempts: sql`
          CASE
            WHEN ${rateLimitsTable.windowEnd} < ${now} 
            THEN 1
            ELSE ${rateLimitsTable.attempts} + 1
          END
        `,
          windowStart: sql`
          CASE
            WHEN ${rateLimitsTable.windowEnd} < ${now}
            THEN ${now}
            ELSE ${rateLimitsTable.windowStart}
          END
        `,
          windowEnd: sql`
          CASE
            WHEN ${rateLimitsTable.windowEnd} < ${now}
            THEN ${windowEnd}
            ELSE ${rateLimitsTable.windowEnd}
          END
        `,
          blockedUntil: sql`
          CASE
            WHEN ${rateLimitsTable.windowEnd} < ${now}
            THEN NULL
            ELSE ${rateLimitsTable.blockedUntil}
          END
        `,
          lastAttemptAt: now,
          updatedAt: now,
        },
      })
      .returning();

    if (row.blockedUntil && row.blockedUntil > now) return true;
    return row.attempts > opts.max;
  }
}

/**
 * Repository for tracking hardware devices associated with user accounts.
 */
export class UserDeviceRepository {
  constructor(private readonly db: DB) { }

  async findByFingerprint(
    userId: string,
    fingerprint: string,
  ): Promise<UserDevice | null> {
    const [row] = await this.db
      .select()
      .from(userDevicesTable)
      .where(
        and(
          eq(userDevicesTable.userId, userId),
          eq(userDevicesTable.deviceFingerprint, fingerprint),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listByUser(userId: string): Promise<UserDevice[]> {
    return this.db
      .select()
      .from(userDevicesTable)
      .where(eq(userDevicesTable.userId, userId))
      .orderBy(desc(userDevicesTable.lastActiveAt));
  }

  async upsert(data: UserDeviceInsert): Promise<UserDevice> {
    const [row] = await this.db
      .insert(userDevicesTable)
      .values(data)
      .onConflictDoUpdate({
        target: [userDevicesTable.userId, userDevicesTable.deviceFingerprint],
        set: {
          lastIp: data.lastIp,
          lastCountry: data.lastCountry,
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return row;
  }

  async update(id: string, data: UserDeviceUpdate): Promise<UserDevice | null> {
    const [row] = await this.db
      .update(userDevicesTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(userDevicesTable.id, id))
      .returning();

    return row ?? null;
  }

  async setTrusted(id: string, trusted: boolean): Promise<void> {
    await this.db
      .update(userDevicesTable)
      .set({ trusted, updatedAt: new Date() })
      .where(eq(userDevicesTable.id, id));
  }

  async revoke(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .update(userDevicesTable)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(
        and(eq(userDevicesTable.id, id), eq(userDevicesTable.userId, userId)),
      );

    return (result.rowCount ?? 0) > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(userDevicesTable)
      .where(
        and(eq(userDevicesTable.id, id), eq(userDevicesTable.userId, userId)),
      );

    return (result.rowCount ?? 0) > 0;
  }
}
