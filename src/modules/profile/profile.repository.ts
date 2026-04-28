/**
 * profile.repository.ts
 *
 * Data-access layer for the profile domain.
 * One repository class per aggregate root.
 *
 * Key architectural decisions reflected here:
 * - kycProfileTable uses roleId (FK) not role enum
 * - kycDocumentsTable uses documentTypeId (FK) not documentType enum
 * - kycStatus removed from role profile tables — read from kycProfileTable
 * - KycRoleRequirementRepository replaces hardcoded ROLE_REQUIRED_DOCS map
 */

import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  isNotNull,
  lt,
  ne,
  sql,
} from "drizzle-orm";

import type { DB } from "../../db/index";
import {
  addressesTable,
  bankAccountsTable,
  customerProfileTable,
  deliveryPartnerProfileTable,
  documentsTable,
  kycDocumentsTable,
  kycProfileTable,
  kycReviewsTable,
  roleRequiredDocuments,
  shopOwnerProfileTable,
} from "../../db/schema";

import type {
  Address,
  AddressInsert,
  BankAccount,
  BankAccountInsert,
  CustomerProfile,
  CustomerProfileInsert,
  DeliveryPartnerProfile,
  DeliveryPartnerProfileInsert,
  KycDocument,
  KycDocumentInsert,
  KycProfile,
  KycProfileInsert,
  KycReview,
  KycReviewInsert,
  ShopOwnerProfile,
  ShopOwnerProfileInsert,
} from "../../db/schema";

import type { Pagination } from "../../shared";
import { applyPagination, applyCursorPagination, clean } from "../../shared";
import type { KycDocumentFilter } from "./profile.schema";
import type { BankAccountType } from "./profile.schema";

// =============================================================================
// Local update types
// =============================================================================

type BankAccountUpdate = Partial<BankAccountInsert>;
type KycDocumentUpdate = Partial<KycDocumentInsert>;
type AddressUpdate = Partial<AddressInsert>;
type ShopOwnerProfileUpdate = Partial<ShopOwnerProfileInsert>;
type DeliveryPartnerProfileUpdate = Partial<DeliveryPartnerProfileInsert>;
type CustomerProfileUpdate = Partial<CustomerProfileInsert>;
type KycReviewUpdate = Partial<KycReviewInsert>;
type KycProfileUpdate = Partial<KycProfileInsert>;

function geoPoint(lat: number, lng: number) {
  return sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
}

// =============================================================================
// 1 — BANK ACCOUNT REPOSITORY
// =============================================================================

export class BankAccountRepository {
  constructor(private readonly db: DB) {}

  async findById(
    id: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<BankAccount | null> {
    const conditions = [eq(bankAccountsTable.id, id)];
    if (!opts.includeDeleted)
      conditions.push(isNull(bankAccountsTable.deletedAt));

    const [row] = await this.db
      .select()
      .from(bankAccountsTable)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  async findByVerificationId(
    verificationId: string,
  ): Promise<BankAccount | null> {
    const [row] = await this.db
      .select()
      .from(bankAccountsTable)
      .where(
        and(
          eq(bankAccountsTable.verificationId, verificationId),
          isNull(bankAccountsTable.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findByIdAndUser(
    id: string,
    userId: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<BankAccount | null> {
    const conditions = [
      eq(bankAccountsTable.id, id),
      eq(bankAccountsTable.userId, userId),
    ];
    if (!opts.includeDeleted)
      conditions.push(isNull(bankAccountsTable.deletedAt));

    const [row] = await this.db
      .select()
      .from(bankAccountsTable)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  async findPrimaryByUser(userId: string): Promise<BankAccount | null> {
    const [row] = await this.db
      .select()
      .from(bankAccountsTable)
      .where(
        and(
          eq(bankAccountsTable.userId, userId),
          eq(bankAccountsTable.isPrimary, true),
          isNull(bankAccountsTable.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listByUser(
    userId: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<BankAccount[]> {
    const conditions = [eq(bankAccountsTable.userId, userId)];
    if (!opts.includeDeleted)
      conditions.push(isNull(bankAccountsTable.deletedAt));

    return this.db
      .select()
      .from(bankAccountsTable)
      .where(and(...conditions));
  }

  async create(data: BankAccountInsert): Promise<BankAccount> {
    const [row] = await this.db
      .insert(bankAccountsTable)
      .values(data)
      .returning();

    return row;
  }

  async update(
    id: string,
    data: BankAccountUpdate,
  ): Promise<BankAccount | null> {
    const [row] = await this.db
      .update(bankAccountsTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(
        and(eq(bankAccountsTable.id, id), isNull(bankAccountsTable.deletedAt)),
      )
      .returning();

    return row ?? null;
  }

  /**
   * Atomically unsets primary on all other accounts then sets it on the target.
   * Must be called inside a transaction.
   */
  async setPrimary(id: string, userId: string): Promise<BankAccount | null> {
    await this.db
      .update(bankAccountsTable)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(
        and(
          eq(bankAccountsTable.userId, userId),
          ne(bankAccountsTable.id, id),
          isNull(bankAccountsTable.deletedAt),
        ),
      );

    const [row] = await this.db
      .update(bankAccountsTable)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(
        and(
          eq(bankAccountsTable.id, id),
          eq(bankAccountsTable.userId, userId),
          isNull(bankAccountsTable.deletedAt),
        ),
      )
      .returning();

    return row ?? null;
  }

  async markVerified(
    id: string,
    verificationId: string,
    accountType: BankAccountType,
  ): Promise<BankAccount | null> {
    const [row] = await this.db
      .update(bankAccountsTable)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        verificationId,
        accountType,
        updatedAt: new Date(),
      })
      .where(
        and(eq(bankAccountsTable.id, id), isNull(bankAccountsTable.deletedAt)),
      )
      .returning();

    return row ?? null;
  }

  async softDelete(id: string, userId: string): Promise<BankAccount | null> {
    const [row] = await this.db
      .update(bankAccountsTable)
      .set({ deletedAt: new Date(), isPrimary: false, updatedAt: new Date() })
      .where(
        and(
          eq(bankAccountsTable.id, id),
          eq(bankAccountsTable.userId, userId),
          isNull(bankAccountsTable.deletedAt),
        ),
      )
      .returning();

    return row ?? null;
  }
}

// =============================================================================
// 2A — KYC DOCUMENT REPOSITORY
// Uses documentTypeId (FK → documentsTable) not documentType enum
// =============================================================================

export class KycDocumentRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<KycDocument | null> {
    const [row] = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(eq(kycDocumentsTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByIdAndUser(
    id: string,
    userId: string,
  ): Promise<KycDocument | null> {
    const [row] = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(
        and(eq(kycDocumentsTable.id, id), eq(kycDocumentsTable.userId, userId)),
      )
      .limit(1);

    return row ?? null;
  }

  /**
   * Returns the single active submission for a given document type per user.
   * documentTypeId is the FK to documentsTable — not an enum string.
   */
  async findActiveByUserAndType(
    userId: string,
    documentTypeId: string,
  ): Promise<KycDocument | null> {
    const [row] = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(
        and(
          eq(kycDocumentsTable.userId, userId),
          eq(kycDocumentsTable.documentTypeId, documentTypeId),
          ne(kycDocumentsTable.status, "rejected"),
          ne(kycDocumentsTable.status, "superseded"),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listByUser(
    userId: string,
    pagination: Pagination,
  ): Promise<{ items: KycDocument[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );
    const baseWhere = eq(kycDocumentsTable.userId, userId);
    const where = applyCursorPagination(
      kycDocumentsTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(kycDocumentsTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(where)
      .orderBy(
        pagination.order === "asc"
          ? kycDocumentsTable.createdAt
          : desc(kycDocumentsTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  /**
   * Filter by status and/or documentTypeId.
   * documentTypeId is a UUID FK — callers must resolve slug → id first
   * via DocumentTypeRepository.findBySlug().
   */
  async listByUserFilter(
    userId: string,
    filter: KycDocumentFilter,
  ): Promise<KycDocument[]> {
    const conditions = [eq(kycDocumentsTable.userId, userId)];

    if (filter.status?.length) {
      conditions.push(inArray(kycDocumentsTable.status, filter.status));
    }

    if (filter.documentTypeId) {
      conditions.push(
        eq(kycDocumentsTable.documentTypeId, filter.documentTypeId),
      );
    }

    return this.db
      .select()
      .from(kycDocumentsTable)
      .where(and(...conditions));
  }

  async listByStatus(
    status: KycDocument["status"],
    pagination: Pagination,
  ): Promise<{ items: KycDocument[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );
    const baseWhere = eq(kycDocumentsTable.status, status);
    const where = applyCursorPagination(
      kycDocumentsTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(kycDocumentsTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(where)
      .orderBy(
        pagination.order === "asc"
          ? kycDocumentsTable.createdAt
          : desc(kycDocumentsTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  async create(data: KycDocumentInsert): Promise<KycDocument> {
    const [row] = await this.db
      .insert(kycDocumentsTable)
      .values(data)
      .returning();

    return row;
  }

  async update(
    id: string,
    data: KycDocumentUpdate,
  ): Promise<KycDocument | null> {
    const [row] = await this.db
      .update(kycDocumentsTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(kycDocumentsTable.id, id))
      .returning();

    return row ?? null;
  }

  /**
   * Admin review — sets status, reviewedBy, reviewedAt, rejectionReason.
   * DB check constraint enforces rejectionReason when status = rejected.
   */
  async review(
    id: string,
    reviewedBy: string,
    status: "verified" | "rejected" | "under_review",
    rejectionReason?: string,
  ): Promise<KycDocument | null> {
    const [row] = await this.db
      .update(kycDocumentsTable)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
        ...(status === "verified" ? { verifiedAt: new Date() } : {}),
        ...(rejectionReason ? { rejectionReason } : {}),
        updatedAt: new Date(),
      })
      .where(eq(kycDocumentsTable.id, id))
      .returning();

    return row ?? null;
  }

  async expireByUserAndType(
    userId: string,
    documentTypeId: string,
  ): Promise<void> {
    await this.db
      .update(kycDocumentsTable)
      .set({ status: "expired", updatedAt: new Date() })
      .where(
        and(
          eq(kycDocumentsTable.userId, userId),
          eq(kycDocumentsTable.documentTypeId, documentTypeId),
          ne(kycDocumentsTable.status, "rejected"),
          ne(kycDocumentsTable.status, "expired"),
          lt(kycDocumentsTable.expiresAt, new Date()),
        ),
      );
  }

  async findByVerificationRef(
    ref: string,
    provider: string,
  ): Promise<KycDocument | null> {
    const [row] = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(
        and(
          eq(kycDocumentsTable.verificationId, ref),
          eq(kycDocumentsTable.verificationProvider, provider),
        ),
      )
      .limit(1);

    return row ?? null;
  }
}

// =============================================================================
// 2B — DOCUMENT TYPE REPOSITORY
// Resolves slug ("pan", "aadhaar") → UUID for use in kycDocumentsTable queries
// =============================================================================

export class DocumentTypeRepository {
  constructor(private readonly db: DB) {}

  async findBySlug(
    slug: string,
  ): Promise<typeof documentsTable.$inferSelect | null> {
    const [row] = await this.db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.slug, slug))
      .limit(1);

    return row ?? null;
  }

  async findById(
    id: string,
  ): Promise<typeof documentsTable.$inferSelect | null> {
    const [row] = await this.db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async listAll(): Promise<(typeof documentsTable.$inferSelect)[]> {
    return this.db.select().from(documentsTable);
  }
}

// =============================================================================
// 2C — KYC ROLE REQUIREMENT REPOSITORY
// Replaces the hardcoded ROLE_REQUIRED_DOCS map in service layer
// =============================================================================

export class KycRoleRequirementRepository {
  constructor(private readonly db: DB) {}

  /**
   * Returns all document type IDs required for a given roleId.
   * Used by onDocumentUpdated() to find which KYC profiles go stale.
   */
  async findRoleIdsByDocumentTypeId(
    documentTypeId: string,
  ): Promise<{ roleId: string }[]> {
    return this.db
      .select({ roleId: roleRequiredDocuments.roleId })
      .from(roleRequiredDocuments)
      .where(eq(roleRequiredDocuments.documentId, documentTypeId));
  }

  /**
   * Returns all mandatory document requirements for a given roleId.
   * Used by submitForReview() to check if all docs are present.
   */
  async findByRoleId(
    roleId: string,
  ): Promise<(typeof roleRequiredDocuments.$inferSelect)[]> {
    return this.db
      .select()
      .from(roleRequiredDocuments)
      .where(
        and(
          eq(roleRequiredDocuments.roleId, roleId),
          eq(roleRequiredDocuments.isMandatory, true),
        ),
      );
  }
}

// =============================================================================
// 2D — KYC PROFILE REPOSITORY
// One row per (userId, roleId) — single source of truth for KYC state
// =============================================================================

export class KycProfileRepository {
  constructor(private readonly db: DB) {}

  async findByUserAndRole(
    userId: string,
    roleId: string,
  ): Promise<KycProfile | null> {
    const [row] = await this.db
      .select()
      .from(kycProfileTable)
      .where(
        and(
          eq(kycProfileTable.userId, userId),
          eq(kycProfileTable.roleId, roleId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listByUser(userId: string): Promise<KycProfile[]> {
    return this.db
      .select()
      .from(kycProfileTable)
      .where(eq(kycProfileTable.userId, userId));
  }

  /**
   * Upserts a KYC profile row for a (userId, roleId) pair.
   * Safe to call multiple times — creates on first call, updates on subsequent.
   */
  async upsert(
    userId: string,
    roleId: string,
    status: KycProfile["status"],
  ): Promise<KycProfile> {
    const [row] = await this.db
      .insert(kycProfileTable)
      .values({ userId, roleId, status, submittedAt: new Date() })
      .onConflictDoUpdate({
        target: [kycProfileTable.userId, kycProfileTable.roleId],
        set: {
          status,
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return row;
  }

  /**
   * Updates the status of a single (userId, roleId) KYC profile.
   * Used by admin review flow and submitForReview().
   */
  async updateStatus(
    userId: string,
    roleId: string,
    status: KycProfile["status"],
  ): Promise<KycProfile | null> {
    const [row] = await this.db
      .update(kycProfileTable)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(kycProfileTable.userId, userId),
          eq(kycProfileTable.roleId, roleId),
        ),
      )
      .returning();

    return row ?? null;
  }

  /**
   * Marks KYC profiles stale for all provided roleIds.
   * Called inside a transaction when a shared document (e.g. PAN) is updated.
   * roleIds come from KycRoleRequirementRepository — never hardcoded.
   */
  async markStale(userId: string, roleIds: string[]): Promise<KycProfile[]> {
    if (roleIds.length === 0) return [];

    return this.db
      .update(kycProfileTable)
      .set({ status: "stale", updatedAt: new Date() })
      .where(
        and(
          eq(kycProfileTable.userId, userId),
          inArray(kycProfileTable.roleId, roleIds),
        ),
      )
      .returning();
  }

  /**
   * Admin queue — list profiles pending review, sorted oldest first (FIFO).
   */
  async listPendingForAdmin(
    pagination: Pagination,
  ): Promise<{ items: KycProfile[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseWhere = inArray(kycProfileTable.status, ["pending", "stale"]);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(kycProfileTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(kycProfileTable)
      .where(baseWhere)
      .orderBy(kycProfileTable.submittedAt) // oldest first
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }
}

// =============================================================================
// 3 — KYC REVIEW REPOSITORY
// Per-submission history — complements kycProfileTable's current-state view
// =============================================================================

export class KycReviewRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<KycReview | null> {
    const [row] = await this.db
      .select()
      .from(kycReviewsTable)
      .where(eq(kycReviewsTable.id, id))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds an active (pending/under_review) submission for a (userId, roleId) pair.
   * Prevents duplicate submissions.
   */
  async findPendingByUserAndRole(
    userId: string,
    roleId: string,
  ): Promise<KycReview | null> {
    const [row] = await this.db
      .select()
      .from(kycReviewsTable)
      .where(
        and(
          eq(kycReviewsTable.userId, userId),
          eq(kycReviewsTable.roleId, roleId),
          eq(kycReviewsTable.status, "pending"),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async create(data: KycReviewInsert): Promise<KycReview> {
    const [row] = await this.db
      .insert(kycReviewsTable)
      .values(data)
      .returning();

    return row;
  }

  async update(id: string, data: KycReviewUpdate): Promise<KycReview | null> {
    const [row] = await this.db
      .update(kycReviewsTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(kycReviewsTable.id, id))
      .returning();

    return row ?? null;
  }

  async listByStatus(
    status: KycReview["status"],
    pagination: Pagination,
  ): Promise<{ items: KycReview[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );
    const baseWhere = eq(kycReviewsTable.status, status);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(kycReviewsTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(kycReviewsTable)
      .where(baseWhere)
      .orderBy(desc(kycReviewsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  async listByUser(userId: string): Promise<KycReview[]> {
    return this.db
      .select()
      .from(kycReviewsTable)
      .where(eq(kycReviewsTable.userId, userId))
      .orderBy(desc(kycReviewsTable.createdAt));
  }

  async updateStatus(
    reviewId: string,
    status: KycReview["status"],
    extra?: {
      reviewedBy?: string;
      rejectionReason?: string;
      adminNotes?: string;
    },
  ): Promise<KycReview | null> {
    const isTerminal = status === "done" || status === "rejected";

    const [row] = await this.db
      .update(kycReviewsTable)
      .set({
        status,
        ...(isTerminal ? { reviewedAt: new Date() } : {}),
        ...(extra?.reviewedBy ? { reviewedBy: extra.reviewedBy } : {}),
        ...(extra?.rejectionReason
          ? { rejectionReason: extra.rejectionReason }
          : {}),
        ...(extra?.adminNotes ? { notes: extra.adminNotes } : {}),
        updatedAt: new Date(),
      })
      .where(eq(kycReviewsTable.id, reviewId))
      .returning();

    return row ?? null;
  }
}

// =============================================================================
// 4 — ADDRESS REPOSITORY
// =============================================================================

export class AddressRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<Address | null> {
    const [row] = await this.db
      .select()
      .from(addressesTable)
      .where(and(eq(addressesTable.id, id), isNull(addressesTable.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByIdAndUser(id: string, userId: string): Promise<Address | null> {
    const [row] = await this.db
      .select()
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.id, id),
          eq(addressesTable.userId, userId),
          isNull(addressesTable.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findCurrentByUser(userId: string): Promise<Address | null> {
    const [row] = await this.db
      .select()
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.userId, userId),
          eq(addressesTable.isCurrent, true),
          isNull(addressesTable.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listByUser(userId: string): Promise<Address[]> {
    const items = await this.db
      .select()
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.userId, userId),
          isNull(addressesTable.deletedAt),
        ),
      );

    return items;
  }

  async countByUser(userId: string): Promise<number> {
    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.userId, userId),
          isNull(addressesTable.deletedAt),
        ),
      );

    return countRow?.count ?? 0;
  }

  async create(data: AddressInsert): Promise<Address> {
    const [row] = await this.db.insert(addressesTable).values(data).returning();
    return row;
  }

  async updateByIdAndUser(
    id: string,
    userId: string,
    data: AddressUpdate,
  ): Promise<Address | null> {
    const [row] = await this.db
      .update(addressesTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(
        and(
          eq(addressesTable.id, id),
          eq(addressesTable.userId, userId),
          isNull(addressesTable.deletedAt),
        ),
      )
      .returning();

    return row ?? null;
  }

  /**
   * Unsets default on all addresses in scope, then sets it on the target.
   * Scope: personal addresses (shopId IS NULL) or shop-specific (shopId matches).
   * Must be called inside a transaction.
   */
  async setCurrent(id: string, userId: string): Promise<Address | null> {
    const target = await this.findByIdAndUser(id, userId);
    if (!target) return null;

    const scopeCondition = target.shopId
      ? eq(addressesTable.shopId, target.shopId)
      : isNull(addressesTable.shopId);

    await this.db
      .update(addressesTable)
      .set({ isCurrent: false, updatedAt: new Date() })
      .where(
        and(
          eq(addressesTable.userId, userId),
          ne(addressesTable.id, id),
          scopeCondition,
          isNull(addressesTable.deletedAt),
        ),
      );

    const [row] = await this.db
      .update(addressesTable)
      .set({ isCurrent: true, updatedAt: new Date() })
      .where(
        and(
          eq(addressesTable.id, id),
          eq(addressesTable.userId, userId),
          isNull(addressesTable.deletedAt),
        ),
      )
      .returning();

    return row ?? null;
  }

  async setLocation(
    id: string,
    lat: number,
    lng: number,
    h3: { res7: string; res9: string },
  ): Promise<Address | null> {
    const [row] = await this.db
      .update(addressesTable)
      .set({
        location: { lng: lng, lat: lat },
        h3IndexRes8: h3.res7,
        h3IndexRes9: h3.res9,
        updatedAt: new Date(),
      })
      .where(and(eq(addressesTable.id, id), isNull(addressesTable.deletedAt)))
      .returning();

    return row ?? null;
  }

  async softDelete(id: string, userId: string): Promise<Address | null> {
    const [row] = await this.db
      .update(addressesTable)
      .set({ deletedAt: new Date(), isCurrent: false, updatedAt: new Date() })
      .where(
        and(
          eq(addressesTable.id, id),
          eq(addressesTable.userId, userId),
          isNull(addressesTable.deletedAt),
        ),
      )
      .returning();

    return row ?? null;
  }

  async listNearby(
    lat: number,
    lng: number,
    radiusMetres: number,
    pagination: Pagination,
    h3Cells?: string[],
  ): Promise<{ items: Address[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseConditions = [
      isNull(addressesTable.deletedAt),
      isNotNull(addressesTable.location),
      sql`ST_DWithin(
        ${addressesTable.location},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${radiusMetres}
      )`,
    ];

    if (h3Cells?.length) {
      baseConditions.push(inArray(addressesTable.h3IndexRes9, h3Cells));
    }

    const baseWhere = and(...baseConditions);
    const where = applyCursorPagination(
      addressesTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(addressesTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(addressesTable)
      .where(where)
      .orderBy(
        sql`ST_Distance(
          ${addressesTable.location},
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        )`,
      )
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }
}

// =============================================================================
// 5 — SHOP OWNER PROFILE REPOSITORY
// kycStatus removed — read KYC state from kycProfileTable via KycProfileRepository
// =============================================================================

export class ShopOwnerProfileRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .select()
      .from(shopOwnerProfileTable)
      .where(eq(shopOwnerProfileTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByUserId(userId: string): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .select()
      .from(shopOwnerProfileTable)
      .where(eq(shopOwnerProfileTable.userId, userId))
      .limit(1);

    return row ?? null;
  }

  async create(data: ShopOwnerProfileInsert): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .insert(shopOwnerProfileTable)
      .values(data)
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  async update(
    userId: string,
    data: ShopOwnerProfileUpdate,
  ): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .update(shopOwnerProfileTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(shopOwnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  async markVerified(userId: string): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .update(shopOwnerProfileTable)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(shopOwnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  async suspend(
    userId: string,
    reason: string,
  ): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .update(shopOwnerProfileTable)
      .set({
        isSuspended: true,
        suspendedAt: new Date(),
        suspensionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(shopOwnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  async unsuspend(userId: string): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .update(shopOwnerProfileTable)
      .set({
        isSuspended: false,
        suspendedAt: null,
        suspensionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(shopOwnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  async setPrimaryBankAccount(
    userId: string,
    bankAccountId: string | null,
  ): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .update(shopOwnerProfileTable)
      .set({ primaryBankAccountId: bankAccountId, updatedAt: new Date() })
      .where(eq(shopOwnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }
}

// =============================================================================
// 6 — DELIVERY PARTNER PROFILE REPOSITORY
// kycStatus removed — read KYC state from kycProfileTable via KycProfileRepository
// =============================================================================

export class DeliveryPartnerProfileRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .select()
      .from(deliveryPartnerProfileTable)
      .where(eq(deliveryPartnerProfileTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByUserId(userId: string): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .select()
      .from(deliveryPartnerProfileTable)
      .where(eq(deliveryPartnerProfileTable.userId, userId))
      .limit(1);

    return row ?? null;
  }

  async create(
    data: DeliveryPartnerProfileInsert,
  ): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .insert(deliveryPartnerProfileTable)
      .values({ ...data})
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  async update(
    userId: string,
    data: DeliveryPartnerProfileUpdate,
  ): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .update(deliveryPartnerProfileTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(deliveryPartnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  /**
   * Atomically appends a rating — no read-modify-write race.
   * Average is computed on read: ratingSum / ratingCount.
   */
  async appendRating(
    userId: string,
    rating: number,
  ): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .update(deliveryPartnerProfileTable)
      .set({
        ratingSum: sql`${deliveryPartnerProfileTable.ratingSum} + ${rating}`,
        ratingCount: sql`${deliveryPartnerProfileTable.ratingCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(deliveryPartnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  async recordDelivery(
    userId: string,
    earningsPaise: bigint,
  ): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .update(deliveryPartnerProfileTable)
      .set({
        totalDeliveries: sql`${deliveryPartnerProfileTable.totalDeliveries} + 1`,
        totalEarnings: sql`${deliveryPartnerProfileTable.totalEarnings} + ${earningsPaise}`,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deliveryPartnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  async suspend(
    userId: string,
    reason: string,
  ): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .update(deliveryPartnerProfileTable)
      .set({
        isSuspended: true,
        suspendedAt: new Date(),
        suspensionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(deliveryPartnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  async unsuspend(userId: string): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .update(deliveryPartnerProfileTable)
      .set({
        isSuspended: false,
        suspendedAt: null,
        suspensionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(deliveryPartnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  async setPrimaryBankAccount(
    userId: string,
    bankAccountId: string | null,
  ): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .update(deliveryPartnerProfileTable)
      .set({ primaryBankAccountId: bankAccountId, updatedAt: new Date() })
      .where(eq(deliveryPartnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }
}

// =============================================================================
// 7 — CUSTOMER PROFILE REPOSITORY
// =============================================================================

export class CustomerProfileRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<CustomerProfile | null> {
    const [row] = await this.db
      .select()
      .from(customerProfileTable)
      .where(eq(customerProfileTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByUserId(userId: string): Promise<CustomerProfile | null> {
    const [row] = await this.db
      .select()
      .from(customerProfileTable)
      .where(eq(customerProfileTable.userId, userId))
      .limit(1);

    return row ?? null;
  }

  async create(data: CustomerProfileInsert): Promise<CustomerProfile | null> {
    const [row] = await this.db
      .insert(customerProfileTable)
      .values(data)
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  async update(
    userId: string,
    data: CustomerProfileUpdate,
  ): Promise<CustomerProfile | null> {
    const [row] = await this.db
      .update(customerProfileTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(customerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  async recordOrder(
    userId: string,
    amountPaise: bigint,
  ): Promise<CustomerProfile | null> {
    const [row] = await this.db
      .update(customerProfileTable)
      .set({
        totalOrders: sql`${customerProfileTable.totalOrders} + 1`,
        totalSpend: sql`${customerProfileTable.totalSpend} + ${amountPaise}`,
        lastOrderAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  /**
   * Signed delta — negative = debit.
   * DB check (loyalty_points >= 0) rejects writes that would go negative.
   * Caller must verify balance before debiting.
   */
  async adjustLoyaltyPoints(
    userId: string,
    delta: number,
  ): Promise<CustomerProfile | null> {
    const [row] = await this.db
      .update(customerProfileTable)
      .set({
        loyaltyPoints: sql`${customerProfileTable.loyaltyPoints} + ${delta}`,
        updatedAt: new Date(),
      })
      .where(eq(customerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  async listByLastOrderAfter(
    after: Date,
    pagination: Pagination,
  ): Promise<{ items: CustomerProfile[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseWhere = and(
      isNotNull(customerProfileTable.lastOrderAt),
      gte(customerProfileTable.lastOrderAt, after),
    );
    const where = applyCursorPagination(
      customerProfileTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customerProfileTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(customerProfileTable)
      .where(where)
      .orderBy(desc(customerProfileTable.lastOrderAt))
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }
}
