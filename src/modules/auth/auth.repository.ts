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
  /**
   * Initializes the UserRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a user by their unique UUID.
   * By default, it filters out accounts that have been soft-deleted.
   * 
   * @param id - The UUID of the user.
   * @param opts - Query options.
   * @param opts.includeDeleted - If true, include soft-deleted accounts in search.
   * @returns The user record if found, otherwise null.
   */
  /**
   * Finds a role by its unique UUID.
   * 
   * @param id - The UUID of the role.
   * @returns The role record, or null.
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

  /**
   * Finds a user by their email address.
   * Efficiently handles lowercase normalization for consistent lookups.
   * 
   * @param email - The email address to search for.
   * @param opts - Query options.
   * @param opts.includeDeleted - If true, include soft-deleted accounts.
   * @returns The user record if found, otherwise null.
   */
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
   * Finds a user by their normalized E.164 phone number.
   * Primary lookup used during the OTP-based registration and login flows.
   * 
   * @param phone - The E.164 phone number.
   * @param opts - Query options.
   * @param opts.includeDeleted - If true, include soft-deleted accounts.
   * @returns The user record if found, otherwise null.
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

  /**
   * Retrieves a paginated list of all active users.
   * Supports offset-based pagination and cursor-based ordering.
   * 
   * @param pagination - Pagination and ordering parameters.
   * @returns A promise resolving to an object containing items and the total count.
   */
  /**
   * Lists all roles in the system, ordered by name.
   * 
   * @returns An array of all role records.
   */
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
   * Performs a soft-delete by setting the `deletedAt` timestamp.
   * This effectively hides the user from standard lookups while preserving data for audit.
   * 
   * @param id - The UUID of the user to delete.
   * @param deletedBy - The ID of the actor performing the deletion.
   * @returns The updated user record, or null if already deleted.
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
   * Part of the security mechanism to prevent PIN brute-forcing.
   * 
   * @param id - The UUID of the user.
   * @returns The updated number of failed attempts.
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

  /**
   * Resets the failed login counter for a user after a successful login.
   * 
   * @param id - The UUID of the user.
   */
  async resetFailedLogins(id: string): Promise<void> {
    await this.db
      .update(userTable)
      .set({ failedLoginAttempts: 0, updatedAt: new Date() })
      .where(eq(userTable.id, id))
      .returning();
  }

  /**
   * Anti-Brute Force: Temporarily locks the account from future logins.
   * Prevents further attempts until the specified timestamp.
   * 
   * @param id - The UUID of the user.
   * @param until - The timestamp when the lock should expire.
   * @returns The updated user record.
   */
  async lockUntil(id: string, until: Date): Promise<User | null> {
    const [row] = await this.db
      .update(userTable)
      .set({ lockedUntil: until, updatedAt: new Date() })
      .where(eq(userTable.id, id))
      .returning();

    return row ?? null;
  }

  /**
   * Marks a user's email as verified and records the timestamp.
   * 
   * @param id - The UUID of the user.
   * @returns The updated user record.
   */
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

  /**
   * Marks a user's phone as verified.
   * 
   * @param id - The UUID of the user.
   * @returns The updated user record.
   */
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

  /**
   * Updates the `lastLoginAt` and `lastLoginIp` metadata for a user.
   * 
   * @param id - The UUID of the user.
   * @param ip - The client IP address of the most recent login.
   * @returns The updated user record.
   */
  async updateLastLogin(id: string, ip: string): Promise<User | null> {
    const [row] = await this.db
      .update(userTable)
      .set({ lastLoginAt: new Date(), lastLoginIp: ip, updatedAt: new Date() })
      .where(eq(userTable.id, id))
      .returning();

    return row ?? null;
  }

  /**
   * Updates the user's security PIN hash.
   * Also updates the `pinChangedAt` timestamp for session invalidation tracking.
   * 
   * @param id - The UUID of the user.
   * @param pinHash - The Argon2/Bcrypt hash of the new 6-digit PIN.
   * @returns The updated user record.
   */
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
  /**
   * Initializes the OtpRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Atomically increments the attempt counter for an OTP record.
   * Used to prevent brute-forcing of the 6-digit codes.
   * 
   * @param id - The UUID of the OTP record.
   * @returns The updated attempt count.
   */
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
   * This is the primary lookup during phone-based login and registration.
   * 
   * @param phone - The E.164 phone number.
   * @param purpose - The specific intent of the OTP (e.g., 'phone_verification').
   * @returns The active OTP record, or null if none exist or it's expired.
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

  /**
   * Finds a valid, non-expired, and non-consumed OTP by email address.
   * 
   * @param email - The user's email address.
   * @param purpose - The specific intent (e.g., 'email_verification').
   * @returns The active OTP record, or null.
   */
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

  /**
   * Finds an active OTP for a specific user and purpose.
   * Used for in-app flows like 2FA setup or account deletion.
   * 
   * @param userId - The UUID of the authenticated user.
   * @param purpose - The specific intent (e.g., 'enable_2fa').
   * @returns The active OTP record, or null.
   */
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

  /**
   * Increments the attempt counter for an OTP.
   * 
   * @param id - The UUID of the OTP record.
   */
  async incrementAttempts(id: string): Promise<void> {
    await this.db
      .update(otpVerificationTable)
      .set({ attempts: sql`${otpVerificationTable.attempts} + 1` })
      .where(eq(otpVerificationTable.id, id));
  }

  /**
   * Marks an OTP as verified and sets the verification timestamp.
   * 
   * @param id - The UUID of the OTP record.
   * @returns The updated OTP record, or null.
   */
  async markVerified(id: string): Promise<OtpVerification | null> {
    const [row] = await this.db
      .update(otpVerificationTable)
      .set({ verified: true, verifiedAt: new Date() })
      .where(eq(otpVerificationTable.id, id))
      .returning();

    return row ?? null;
  }

  /**
   * Marks an OTP as consumed to prevent reuse.
   * 
   * @param id - The UUID of the OTP record.
   * @returns The updated OTP record, or null.
   */
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
   * 
   * @param id - The UUID of the OTP record.
   * @returns The updated OTP record, or null if already consumed.
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
   * Typically called before sending a fresh OTP to ensure single-active-OTP policy.
   * 
   * @param phone - The E.164 phone number.
   * @param purpose - The specific intent of the OTP.
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

  /**
   * Invalidates all active OTPs for a specific user and purpose.
   * 
   * @param userId - The UUID of the user.
   * @param purpose - The specific intent of the OTP.
   */
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
  /**
   * Initializes the SessionRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a session by its unique UUID.
   * 
   * @param id - The UUID of the session.
   * @returns The session record, or null.
   */
  async findById(id: string): Promise<UserSession | null> {
    const [row] = await this.db
      .select()
      .from(userSessionTable)
      .where(eq(userSessionTable.id, id))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a session by the SHA-256 hash of its refresh token.
   * Used during the `/auth/token/refresh` flow.
   * 
   * @param hash - The hex-encoded SHA-256 hash of the refresh token.
   * @returns The session record, or null.
   */
  async findByRefreshTokenHash(hash: string): Promise<UserSession | null> {
    const [row] = await this.db
      .select()
      .from(userSessionTable)
      .where(eq(userSessionTable.refreshTokenHash, hash))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a session by its associated Access Token JTI (unique identifier).
   * Used for validating access tokens against the database/Redis blacklist.
   * 
   * @param jti - The unique identifier of the access token.
   * @returns The session record, or null.
   */
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
   * 
   * @param userId - The UUID of the user.
   * @returns An array of active session records.
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

  /**
   * Updates an existing session record.
   * 
   * @param id - The UUID of the session.
   * @param data - The partial session data to update.
   * @returns The updated session record, or null.
   */
  /**
   * Updates a custom role definition.
   * Note: System-managed roles (isSystem: true) cannot be updated.
   * 
   * @param id - The UUID of the role.
   * @param data - The partial data to update.
   * @returns The updated role record, or null if system-managed or not found.
   */
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

  /**
   * Updates the `lastActiveAt` timestamp for a session to the current time.
   * 
   * @param id - The UUID of the session.
   */
  async touchLastActive(id: string): Promise<void> {
    await this.db
      .update(userSessionTable)
      .set({ lastActiveAt: new Date() })
      .where(eq(userSessionTable.id, id));
  }

  /**
   * Admin/System Function: Forces a session into 'revoked' status.
   * Also blacklists the session's JTI in Redis for immediate invalidation.
   * 
   * @param id - The UUID of the session.
   * @param reason - The reason for revocation (e.g., 'suspicious_activity').
   * @returns The updated session record, or null.
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

  /**
   * Revokes all active sessions for a specific user.
   * Used for security resets or when a user changes their PIN.
   * 
   * @param userId - The UUID of the user.
   * @param reason - The reason for mass revocation.
   */
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
   * Blacklists the JTI in Redis to ensure the access token is invalid.
   * 
   * @param id - The UUID of the session.
   * @returns The updated session record, or null.
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
  /**
   * Initializes the RoleRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a role by its unique UUID.
   * 
   * @param id - The UUID of the role.
   * @returns The role record, or null.
   */
  async findById(id: string): Promise<Role | null> {
    const [row] = await this.db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a role by its unique URL-friendly slug (e.g., 'admin').
   * 
   * @param slug - The role slug.
   * @returns The role record, or null.
   */
  async findBySlug(slug: string): Promise<Role | null> {
    const [row] = await this.db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.slug, slug))
      .limit(1);

    return row ?? null;
  }

  /**
   * Lists all available roles.
   * 
   * @returns An array of all role records.
   */
  async list(): Promise<Role[]> {
    return this.db.select().from(rolesTable).orderBy(rolesTable.name);
  }

  /**
   * Creates a new role definition.
   * 
   * @param data - The role data to insert.
   * @returns The created role record.
   */
  async create(data: RoleInsert): Promise<Role> {
    const [row] = await this.db.insert(rolesTable).values(data).returning();
    return row;
  }

  /**
   * Updates a custom role definition.
   * Note: System-managed roles (isSystem: true) cannot be updated.
   * 
   * @param id - The UUID of the role.
   * @param data - The partial data to update.
   * @returns The updated role record, or null if system-managed or not found.
   */
  async update(id: string, data: RoleUpdate): Promise<Role | null> {
    const [row] = await this.db
      .update(rolesTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(and(eq(rolesTable.id, id), eq(rolesTable.isSystem, false)))
      .returning();

    return row ?? null;
  }

  /**
   * Deletes a custom role definition.
   * Note: System-managed roles (isSystem: true) cannot be deleted.
   * 
   * @param id - The UUID of the role.
   * @returns True if the role was deleted, false otherwise.
   */
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
  /**
   * Initializes the PermissionRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a permission by its unique UUID.
   * 
   * @param id - The UUID of the permission.
   * @returns The permission record, or null.
   */
  async findById(id: string): Promise<Permission | null> {
    const [row] = await this.db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.id, id))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a specific permission node by action and resource.
   * e.g., action='create', resource='user'.
   * 
   * @param action - The HTTP-style action.
   * @param resource - The resource identifier.
   * @returns The permission record, or null.
   */
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

  /**
   * Lists all available permissions.
   * 
   * @returns An array of all permission records.
   */
  async list(): Promise<Permission[]> {
    return this.db
      .select()
      .from(permissionsTable)
      .orderBy(permissionsTable.resource, permissionsTable.action);
  }

  /**
   * Creates a new permission node.
   * 
   * @param data - The permission data to insert.
   * @returns The created permission record.
   */
  async create(data: PermissionInsert): Promise<Permission> {
    const [row] = await this.db
      .insert(permissionsTable)
      .values(data)
      .returning();
    return row;
  }

  /**
   * Deletes a permission node.
   * 
   * @param id - The UUID of the permission.
   * @returns True if the permission was deleted, false otherwise.
   */
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
  /**
   * Initializes the RolePermissionRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Lists all permissions associated with a specific role.
   * 
   * @param roleId - The UUID of the role.
   * @returns An array of role-permission mappings.
   */
  async listByRole(roleId: string): Promise<RolePermission[]> {
    return this.db
      .select()
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.roleId, roleId));
  }

  // FIX: Return type is now Promise<RolePermission | null>.
  // onConflictDoNothing() yields no row on conflict — the old code typed the
  // return as Promise<RolePermission> and returned undefined silently.
  /**
   * Assigns a permission to a role.
   * Uses `onConflictDoNothing` to prevent duplicate mappings.
   * 
   * @param data - The role-permission mapping data.
   * @returns The newly created mapping record, or null if it already exists.
   */
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
 * Repository for User-to-Role mappings.
 */
export class UserRoleRepository {
  /**
   * Initializes the UserRoleRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Lists all active roles assigned to a user.
   * 
   * @param userId - The UUID of the user.
   * @returns An array of user-role mappings.
   */
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
   * 
   * @param userId - The UUID of the user.
   * @returns An array of objects containing the role slug.
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

  /**
   * Assigns a role to a user.
   * 
   * @param data - The user-role mapping data.
   * @returns The newly created mapping, or null if it already exists.
   */
  async assign(data: UserRoleInsert): Promise<UserRole | null> {
    const [row] = await this.db
      .insert(userRolesTable)
      .values(data)
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  /**
   * Revokes a role from a user.
   * 
   * @param userId - The UUID of the user.
   * @param roleId - The UUID of the role.
   * @param shopId - Optional shop context for the role assignment.
   * @returns True if the mapping was deleted, false otherwise.
   */
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
  /**
   * Initializes the AuthAttemptRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Creates a new authentication attempt record.
   * 
   * @param data - The auth attempt data to insert.
   * @returns The newly created record.
   */
  async create(data: AuthAttemptInsert): Promise<AuthAttempt> {
    const [row] = await this.db
      .insert(authAttemptsTable)
      .values(data)
      .returning();

    return row;
  }

  /**
   * Counts recent failed login attempts by IP address.
   * 
   * @param ip - The IP address to check.
   * @param windowMinutes - The time window in minutes.
   * @returns The count of failed attempts.
   */
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

  /**
   * Counts recent failed login attempts by User ID.
   * 
   * @param userId - The UUID of the user.
   * @param windowMinutes - The time window in minutes.
   * @returns The count of failed attempts.
   */
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

  /**
   * Counts recent failed login attempts by phone number.
   * 
   * @param phone - The phone number to check.
   * @param windowMinutes - The time window in minutes.
   * @returns The count of failed attempts.
   */
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

  /**
   * Lists authentication attempts for a user with pagination.
   * 
   * @param userId - The UUID of the user.
   * @param pagination - Pagination settings.
   * @returns An array of auth attempt records.
   */
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
  /**
   * Initializes the ReferralCodeRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a referral code by its string representation.
   * 
   * @param code - The referral code string.
   * @returns The referral code record, or null.
   */
  async findByCode(code: string): Promise<ReferralCode | null> {
    const [row] = await this.db
      .select()
      .from(referralCodesTable)
      .where(eq(referralCodesTable.code, code.toUpperCase()))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds an active referral code by its unique string (e.g., 'REF123').
   * 
   * @param code - The Alphanumeric referral code.
   * @returns The referral code record, or null if expired or not found.
   */
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

  /**
   * Retrieves the referral code assigned to a specific user.
   * 
   * @param userId - The UUID of the user.
   * @returns The referral code record, or null.
   */
  async findByUserId(userId: string): Promise<ReferralCode | null> {
    const [row] = await this.db
      .select()
      .from(referralCodesTable)
      .where(eq(referralCodesTable.userId, userId))
      .limit(1);

    return row ?? null;
  }

  /**
   * Creates a new referral code for a user.
   * 
   * @param data - The referral code data to insert.
   * @returns The newly created record.
   */
  async create(data: ReferralCodeInsert): Promise<ReferralCode> {
    const [row] = await this.db
      .insert(referralCodesTable)
      .values({ ...data, code: data.code.toUpperCase() })
      .returning();

    return row;
  }

  /**
   * Atomically increments the usage counter for a referral code.
   * 
   * @param id - The UUID of the referral code.
   */
  async incrementUsage(id: string): Promise<void> {
    await this.db
      .update(referralCodesTable)
      .set({ usageCount: sql`${referralCodesTable.usageCount} + 1` })
      .where(eq(referralCodesTable.id, id));
  }

  /**
   * Deactivates a referral code.
   * 
   * @param id - The UUID of the referral code.
   */
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
  /**
   * Initializes the ReferralRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a referral record by the referee's user ID.
   * 
   * @param refereeId - The UUID of the referee.
   * @returns The referral record, or null.
   */
  async findByReferee(refereeId: string): Promise<Referral | null> {
    const [row] = await this.db
      .select()
      .from(referralTable)
      .where(eq(referralTable.refereeId, refereeId))
      .limit(1);

    return row ?? null;
  }

  /**
   * Lists all referrals made by a specific referrer.
   * 
   * @param referrerId - The UUID of the referrer.
   * @param pagination - Pagination settings.
   * @returns An object containing the list of referrals and the total count.
   */
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

  /**
   * Creates a new referral record.
   * 
   * @param data - The referral data to insert.
   * @returns The created referral record.
   */
  async create(data: ReferralInsert): Promise<Referral> {
    const [row] = await this.db.insert(referralTable).values(data).returning();
    return row;
  }

  /**
   * Updates a referral record.
   * 
   * @param id - The UUID of the referral.
   * @param data - The partial data to update.
   * @returns The updated referral record, or null.
   */
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
  /**
   * Initializes the AuditLogRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Creates a new audit log entry.
   * 
   * @param data - The audit log data to insert.
   * @returns The created audit log record.
   */
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

  /**
   * Lists audit logs filtered by the actor who performed the action.
   * 
   * @param actorId - The UUID of the actor.
   * @param pagination - Pagination settings.
   * @returns An object containing the list of logs and the total count.
   */
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

  /**
   * Lists audit logs filtered by the resource affected.
   * 
   * @param resource - The resource type.
   * @param resourceId - The UUID of the resource.
   * @param pagination - Pagination settings.
   * @returns An object containing the list of logs and the total count.
   */
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

  /**
   * Lists audit logs within a specific time range.
   * 
   * @param from - Start date.
   * @param to - End date.
   * @param pagination - Pagination settings.
   * @returns An array of audit log records.
   */
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
  /**
   * Initializes the RateLimitRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a rate limit record by key and action.
   * 
   * @param key - The identifier (e.g., IP or User ID).
   * @param action - The action being rate limited.
   * @returns The rate limit record, or null.
   */
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

  /**
   * Upserts a rate limit record.
   * 
   * @param data - The rate limit data to insert or update.
   * @returns The rate limit record.
   */
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

  /**
   * Updates a rate limit record.
   * 
   * @param id - The UUID of the rate limit record.
   * @param data - The partial data to update.
   * @returns The updated rate limit record, or null.
   */
  async update(id: string, data: RateLimitUpdate): Promise<RateLimit | null> {
    const [row] = await this.db
      .update(rateLimitsTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(rateLimitsTable.id, id))
      .returning();

    return row ?? null;
  }

  /**
   * Blocks a rate limit key until a specific time.
   * 
   * @param id - The UUID of the rate limit record.
   * @param until - The date until which the key is blocked.
   */
  async block(id: string, until: Date): Promise<void> {
    await this.db
      .update(rateLimitsTable)
      .set({ blockedUntil: until, updatedAt: new Date() })
      .where(eq(rateLimitsTable.id, id));
  }

  /**
   * Resets the rate limit counters for a key and action.
   * 
   * @param key - The identifier.
   * @param action - The action.
   */
  async reset(key: string, action: string): Promise<void> {
    await this.db
      .update(rateLimitsTable)
      .set({ attempts: 0, blockedUntil: null, updatedAt: new Date() })
      .where(
        and(eq(rateLimitsTable.key, key), eq(rateLimitsTable.action, action)),
      );
  }

  /**
   * Deletes all expired rate limit records.
   * 
   * @returns The number of deleted records.
   */
  async deleteExpired(): Promise<number> {
    const result = await this.db
      .delete(rateLimitsTable)
      .where(lt(rateLimitsTable.windowEnd, new Date()));

    return result.rowCount ?? 0;
  }

  /**
   * High-level rate limit check.
   * Increments the counter and returns true if the limit is exceeded.
   * 
   * @param key - The identifier.
   * @param action - The action.
   * @param opts - Configuration for max attempts and window size.
   * @returns True if rate limited, false otherwise.
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
  /**
   * Initializes the UserDeviceRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a device by user ID and fingerprint.
   * 
   * @param userId - The UUID of the user.
   * @param fingerprint - The device fingerprint string.
   * @returns The user device record, or null.
   */
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

  /**
   * Lists all devices associated with a user.
   * 
   * @param userId - The UUID of the user.
   * @returns An array of user device records.
   */
  async listByUser(userId: string): Promise<UserDevice[]> {
    return this.db
      .select()
      .from(userDevicesTable)
      .where(eq(userDevicesTable.userId, userId))
      .orderBy(desc(userDevicesTable.lastActiveAt));
  }

  /**
   * Upserts a user device record.
   * 
   * @param data - The user device data to insert or update.
   * @returns The user device record.
   */
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

  /**
   * Updates a user device record.
   * 
   * @param id - The UUID of the device.
   * @param data - The partial data to update.
   * @returns The updated user device record, or null.
   */
  async update(id: string, data: UserDeviceUpdate): Promise<UserDevice | null> {
    const [row] = await this.db
      .update(userDevicesTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(userDevicesTable.id, id))
      .returning();

    return row ?? null;
  }

  /**
   * Sets the trusted status of a device.
   * 
   * @param id - The UUID of the device.
   * @param trusted - Whether the device is trusted.
   */
  async setTrusted(id: string, trusted: boolean): Promise<void> {
    await this.db
      .update(userDevicesTable)
      .set({ trusted, updatedAt: new Date() })
      .where(eq(userDevicesTable.id, id));
  }

  /**
   * Revokes a device session.
   * 
   * @param id - The UUID of the device.
   * @param userId - The UUID of the user.
   * @returns True if the device was revoked, false otherwise.
   */
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
