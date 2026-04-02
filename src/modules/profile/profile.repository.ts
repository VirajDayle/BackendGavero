/**
 * profile.repository.ts
 *
 * Data-access layer for the profile domain — one repository class per
 * aggregate root, following the same conventions as auth.repository.ts.
 *
 * Repositories:
 *   1.  CityRepository
 *   2.  ServiceablePincodeRepository
 *   3.  BankAccountRepository
 *   4.  KycDocumentRepository
 *   5.  AddressRepository
 *   6.  ShopOwnerProfileRepository
 *   7.  DeliveryPartnerProfileRepository
 *   8.  CustomerProfileRepository
 *
 * ─── Conventions ─────────────────────────────────────────────────────────────
 *   • All write methods use .returning() — callers always get the persisted row.
 *   • Soft-deleted rows (deletedAt IS NOT NULL) are excluded by default;
 *     pass { includeDeleted: true } to override where applicable.
 *   • onConflictDoNothing() returns undefined on conflict; all such methods
 *     are typed Promise<T | null> and return null on conflict.
 *   • Monetary counters (totalEarnings, totalSpend, loyaltyPoints) are
 *     incremented atomically via sql`` expressions — never read-modify-write.
 *   • PostGIS write helpers accept { lat, lng } objects and emit the correct
 *     ST_SetSRID(ST_MakePoint(...)) literal internally.
 *   • No business logic lives here — only queries. Validation, auth checks,
 *     and workflow orchestration belong in the service layer.
 */

import {
  and,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  isNotNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { DB } from "../../db/index";
import type { Pagination } from "./profile.schema";

import {
  addressesTable,
  bankAccountsTable,
  customerProfileTable,
  deliveryPartnerProfileTable,
  kycDocumentsTable,
  shopOwnerProfileTable,
} from "../../db/schema";

// =============================================================================
// ROW TYPES
// =============================================================================

type BankAccount = InferSelectModel<typeof bankAccountsTable>;
type BankAccountInsert = InferInsertModel<typeof bankAccountsTable>;
type BankAccountUpdate = Partial<BankAccountInsert>;

type KycDocument = InferSelectModel<typeof kycDocumentsTable>;
type KycDocumentInsert = InferInsertModel<typeof kycDocumentsTable>;
type KycDocumentUpdate = Partial<KycDocumentInsert>;

type Address = InferSelectModel<typeof addressesTable>;
type AddressInsert = InferInsertModel<typeof addressesTable>;
type AddressUpdate = Partial<AddressInsert>;

type ShopOwnerProfile = InferSelectModel<typeof shopOwnerProfileTable>;
type ShopOwnerProfileInsert = InferInsertModel<typeof shopOwnerProfileTable>;
type ShopOwnerProfileUpdate = Partial<ShopOwnerProfileInsert>;

type DeliveryPartnerProfile = InferSelectModel<typeof deliveryPartnerProfileTable>;
type DeliveryPartnerProfileInsert = InferInsertModel<typeof deliveryPartnerProfileTable>;
type DeliveryPartnerProfileUpdate = Partial<DeliveryPartnerProfileInsert>;

type CustomerProfile = InferSelectModel<typeof customerProfileTable>;
type CustomerProfileInsert = InferInsertModel<typeof customerProfileTable>;
type CustomerProfileUpdate = Partial<CustomerProfileInsert>;

// =============================================================================
// HELPERS
// =============================================================================

/** Strip undefined values so Drizzle does not emit NULL for omitted fields. */
function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

function applyPagination(limit: number, page: number) {
  return { limit, offset: (page - 1) * limit };
}

/**
 * Emit a PostGIS geography(Point) write literal.
 * Usage: .set({ currentLocation: geoPoint(lat, lng) })
 */
function geoPoint(lat: number, lng: number) {
  return sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
}

// =============================================================================
// 3 — BANK ACCOUNT REPOSITORY
// =============================================================================

export class BankAccountRepository {
  constructor(private readonly db: DB) { }

  async findById(id: string): Promise<BankAccount | null> {
    const [row] = await this.db
      .select()
      .from(bankAccountsTable)
      .where(
        and(
          eq(bankAccountsTable.id, id),
          isNull(bankAccountsTable.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findByIdAndUser(id: string, userId: string): Promise<BankAccount | null> {
    const [row] = await this.db
      .select()
      .from(bankAccountsTable)
      .where(
        and(
          eq(bankAccountsTable.id, id),
          eq(bankAccountsTable.userId, userId),
          isNull(bankAccountsTable.deletedAt),
        ),
      )
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

  async listByUser(userId: string): Promise<BankAccount[]> {
    return this.db
      .select()
      .from(bankAccountsTable)
      .where(
        and(
          eq(bankAccountsTable.userId, userId),
          isNull(bankAccountsTable.deletedAt),
        ),
      )
      .orderBy(desc(bankAccountsTable.isPrimary), desc(bankAccountsTable.createdAt));
  }

  async create(data: BankAccountInsert): Promise<BankAccount> {
    const [row] = await this.db
      .insert(bankAccountsTable)
      .values(data)
      .returning();

    return row;
  }

  async update(id: string, data: BankAccountUpdate): Promise<BankAccount | null> {
    const [row] = await this.db
      .update(bankAccountsTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(
        and(
          eq(bankAccountsTable.id, id),
          isNull(bankAccountsTable.deletedAt),
        ),
      )
      .returning();

    return row ?? null;
  }

  /**
   * Atomically sets one account as primary and clears the flag on all others
   * for the same user. Must be called inside a transaction.
   */
  async setPrimary(id: string, userId: string): Promise<BankAccount | null> {
    // Clear primary flag on all other accounts for this user
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

    // Set the target account as primary
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

  async markVerified(id: string, pennyDropRef: string): Promise<BankAccount | null> {
    const [row] = await this.db
      .update(bankAccountsTable)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        pennyDropRef,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bankAccountsTable.id, id),
          isNull(bankAccountsTable.deletedAt),
        ),
      )
      .returning();

    return row ?? null;
  }

  /**
   * Soft-delete. Hard-delete is intentionally omitted — accounts must be
   * preserved for settled payout audit trails.
   */
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
// 4 — KYC DOCUMENT REPOSITORY
// =============================================================================

export class KycDocumentRepository {
  constructor(private readonly db: DB) { }

  async findById(id: string): Promise<KycDocument | null> {
    const [row] = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(eq(kycDocumentsTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByIdAndUser(id: string, userId: string): Promise<KycDocument | null> {
    const [row] = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(
        and(
          eq(kycDocumentsTable.id, id),
          eq(kycDocumentsTable.userId, userId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  /**
   * Returns the single active submission for a given document type per user.
   * "Active" means not rejected and not expired, matching the unique index
   * constraint on the model.
   */
  async findActiveByUserAndType(
    userId: string,
    documentType: KycDocument["documentType"],
  ): Promise<KycDocument | null> {
    const [row] = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(
        and(
          eq(kycDocumentsTable.userId, userId),
          eq(kycDocumentsTable.documentType, documentType),
          ne(kycDocumentsTable.status, "rejected"),
          ne(kycDocumentsTable.status, "expired"),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listByUser(
    userId: string,
    pagination: Pagination,
  ): Promise<{ items: KycDocument[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(kycDocumentsTable)
      .where(eq(kycDocumentsTable.userId, userId));

    const items = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(eq(kycDocumentsTable.userId, userId))
      .orderBy(desc(kycDocumentsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  async listByStatus(
    status: KycDocument["status"],
    pagination: Pagination,
  ): Promise<{ items: KycDocument[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(kycDocumentsTable)
      .where(eq(kycDocumentsTable.status, status));

    const items = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(eq(kycDocumentsTable.status, status))
      .orderBy(desc(kycDocumentsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  /**
   * Rows are immutable once submitted — new submissions always insert a fresh
   * row. The unique partial index on (userId, documentType) WHERE status NOT IN
   * ('rejected','expired') prevents duplicate active submissions at the DB level.
   */
  async create(data: KycDocumentInsert): Promise<KycDocument> {
    const [row] = await this.db
      .insert(kycDocumentsTable)
      .values(data)
      .returning();

    return row;
  }

  /**
   * Admin review — transitions status to verified | rejected | under_review.
   * reviewedBy and reviewedAt are set here; rejectionReason is required when
   * status = 'rejected' (enforced by the DB check constraint and schema layer).
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

  /**
   * Marks all active documents of a given type for a user as expired.
   * Called by a background job when a document's expiresAt is reached.
   */
  async expireByUserAndType(
    userId: string,
    documentType: KycDocument["documentType"],
  ): Promise<void> {
    await this.db
      .update(kycDocumentsTable)
      .set({ status: "expired", updatedAt: new Date() })
      .where(
        and(
          eq(kycDocumentsTable.userId, userId),
          eq(kycDocumentsTable.documentType, documentType),
          ne(kycDocumentsTable.status, "rejected"),
          ne(kycDocumentsTable.status, "expired"),
          lt(kycDocumentsTable.expiresAt, new Date()),
        ),
      );
  }

  /**
   * Persists the raw eKYC provider response after verification completes.
   * Called by the eKYC webhook handler.
   */
  async setVerificationResponse(
    id: string,
    provider: string,
    ref: string,
    response: Record<string, unknown>,
  ): Promise<KycDocument | null> {
    const [row] = await this.db
      .update(kycDocumentsTable)
      .set({
        verificationProvider: provider,
        verificationRef: ref,
        verificationResponse: response,
        updatedAt: new Date(),
      })
      .where(eq(kycDocumentsTable.id, id))
      .returning();

    return row ?? null;
  }
}

// =============================================================================
// 5 — ADDRESS REPOSITORY
// =============================================================================

export class AddressRepository {
  constructor(private readonly db: DB) { }

  async findById(id: string): Promise<Address | null> {
    const [row] = await this.db
      .select()
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.id, id),
          isNull(addressesTable.deletedAt),
        ),
      )
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

  async findDefaultByUser(userId: string): Promise<Address | null> {
    const [row] = await this.db
      .select()
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.userId, userId),
          eq(addressesTable.isDefault, true),
          isNull(addressesTable.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listByUser(userId: string): Promise<Address[]> {
    return this.db
      .select()
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.userId, userId),
          isNull(addressesTable.deletedAt),
        ),
      )
      .orderBy(desc(addressesTable.isDefault), desc(addressesTable.createdAt));
  }

  async create(data: AddressInsert): Promise<Address> {
    const [row] = await this.db
      .insert(addressesTable)
      .values(data)
      .returning();

    return row;
  }

  async update(id: string, data: AddressUpdate): Promise<Address | null> {
    const [row] = await this.db
      .update(addressesTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(
        and(
          eq(addressesTable.id, id),
          isNull(addressesTable.deletedAt),
        ),
      )
      .returning();

    return row ?? null;
  }

  /**
   * Sets one address as default and clears the flag on all others for the user
   * within the same scope (personal vs shop). Must be called inside a transaction.
   */
  async setDefault(id: string, userId: string): Promise<Address | null> {
    // Fetch the target to determine scope
    const target = await this.findByIdAndUser(id, userId);
    if (!target) return null;

    // Scope: if target has shopId, clear defaults only for that shop;
    // otherwise clear only personal (shopId IS NULL) defaults.
    const scopeCondition = target.shopId
      ? eq(addressesTable.shopId, target.shopId)
      : isNull(addressesTable.shopId);

    await this.db
      .update(addressesTable)
      .set({ isDefault: false, updatedAt: new Date() })
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
      .set({ isDefault: true, updatedAt: new Date() })
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
   * Persists the geocoded GPS point and pre-computed H3 indexes.
   * Called asynchronously after address creation.
   * Also resolves isServiceable based on the result of a pincode/boundary lookup.
   */
  async setLocation(
    id: string,
    lat: number,
    lng: number,
    isServiceable: boolean,
    h3: { res7: string; res9: string },
  ): Promise<Address | null> {
    const [row] = await this.db
      .update(addressesTable)
      .set({
        location: geoPoint(lat, lng) as unknown as string,
        h3IndexRes7: h3.res7,
        h3IndexRes9: h3.res9,
        isServiceable,
        updatedAt: new Date(),
      })
      .where(
        and(eq(addressesTable.id, id), isNull(addressesTable.deletedAt)),
      )
      .returning();

    return row ?? null;
  }

  async softDelete(id: string, userId: string): Promise<Address | null> {
    const [row] = await this.db
      .update(addressesTable)
      .set({ deletedAt: new Date(), isDefault: false, updatedAt: new Date() })
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
   * Returns addresses within a given radius (metres) of a coordinate.
   * Uses a hybrid approach:
   *   1. H3 k-ring for fast coarse filter via B-tree IN(...)
   *   2. PostGIS ST_DWithin for exact distance ranking
   */
  async listNearby(
    lat: number,
    lng: number,
    radiusMetres: number,
    h3Cells?: string[],
  ): Promise<Address[]> {
    const conditions = [
      isNull(addressesTable.deletedAt),
      isNotNull(addressesTable.location),
      sql`ST_DWithin(
        ${addressesTable.location},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${radiusMetres}
      )`,
    ];

    // If H3 cells provided, add coarse filter for index-assisted scan
    if (h3Cells && h3Cells.length > 0) {
      conditions.push(
        inArray(addressesTable.h3IndexRes9, h3Cells),
      );
    }

    return this.db
      .select()
      .from(addressesTable)
      .where(and(...conditions));
  }
}

// =============================================================================
// 6 — SHOP OWNER PROFILE REPOSITORY
// =============================================================================

export class ShopOwnerProfileRepository {
  constructor(private readonly db: DB) { }

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

  async listByKycStatus(
    status: ShopOwnerProfile["kycStatus"],
    pagination: Pagination,
  ): Promise<{ items: ShopOwnerProfile[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(shopOwnerProfileTable)
      .where(eq(shopOwnerProfileTable.kycStatus, status));

    const items = await this.db
      .select()
      .from(shopOwnerProfileTable)
      .where(eq(shopOwnerProfileTable.kycStatus, status))
      .orderBy(desc(shopOwnerProfileTable.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  /**
   * onConflictDoNothing: the unique constraint on userId means a second insert
   * for the same user returns null. Callers should treat null as "already exists"
   * and fetch the existing row if needed.
   */
  async create(
    data: ShopOwnerProfileInsert,
  ): Promise<ShopOwnerProfile | null> {
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

  /**
   * Called by the background job that aggregates kyc_documents statuses.
   * Denormalises the overall KYC verdict onto the profile row.
   */
  async updateKycStatus(
    userId: string,
    status: ShopOwnerProfile["kycStatus"],
  ): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .update(shopOwnerProfileTable)
      .set({
        kycStatus: status,
        ...(status === "verified" ? { kycVerifiedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
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
// 7 — DELIVERY PARTNER PROFILE REPOSITORY
// =============================================================================

export class DeliveryPartnerProfileRepository {
  constructor(private readonly db: DB) { }

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

  async findByLicenseNumber(
    licenseNumber: string,
  ): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .select()
      .from(deliveryPartnerProfileTable)
      .where(
        eq(
          deliveryPartnerProfileTable.licenseNumber,
          licenseNumber.toUpperCase(),
        ),
      )
      .limit(1);

    return row ?? null;
  }


  async listByKycStatus(
    status: DeliveryPartnerProfile["kycStatus"],
    pagination: Pagination,
  ): Promise<{ items: DeliveryPartnerProfile[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(deliveryPartnerProfileTable)
      .where(eq(deliveryPartnerProfileTable.kycStatus, status));

    const items = await this.db
      .select()
      .from(deliveryPartnerProfileTable)
      .where(eq(deliveryPartnerProfileTable.kycStatus, status))
      .orderBy(desc(deliveryPartnerProfileTable.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }


  /**
   * onConflictDoNothing: unique constraint on userId — returns null if the
   * profile already exists.
   */
  async create(
    data: DeliveryPartnerProfileInsert,
  ): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .insert(deliveryPartnerProfileTable)
      .values({
        ...data,
        licenseNumber: data.licenseNumber.toUpperCase(),
      })
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


  async updateKycStatus(
    userId: string,
    status: DeliveryPartnerProfile["kycStatus"],
  ): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .update(deliveryPartnerProfileTable)
      .set({
        kycStatus: status,
        ...(status === "verified" ? { kycVerifiedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(deliveryPartnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  /**
   * Atomically appends a new rating — no read-modify-write.
   * Average is computed from ratingSum / ratingCount on read.
   * rating must be 1–5; enforced by the service layer.
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

  /**
   * Atomically records a completed delivery and credits earnings.
   * earningsPaise must be non-negative; enforced by the service layer.
   */
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

  async unsuspend(
    userId: string,
  ): Promise<DeliveryPartnerProfile | null> {
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
// 8 — CUSTOMER PROFILE REPOSITORY
// =============================================================================

export class CustomerProfileRepository {
  constructor(private readonly db: DB) { }

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

  /**
   * onConflictDoNothing: returns null if the profile already exists.
   */
  async create(
    data: CustomerProfileInsert,
  ): Promise<CustomerProfile | null> {
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

  /**
   * Atomically records a completed order and updates lifetime aggregates.
   * amountPaise must be non-negative; enforced by the service layer.
   * Called by the order event handler — never by a direct API route.
   */
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
   * Atomically adjusts loyalty points by a signed delta.
   * A negative delta is a debit — the DB check constraint (loyalty_points >= 0)
   * will reject the write if the result would go negative, so callers must
   * verify the current balance before debiting.
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
  ): Promise<CustomerProfile[]> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);

    return this.db
      .select()
      .from(customerProfileTable)
      .where(
        and(
          isNotNull(customerProfileTable.lastOrderAt),
          gte(customerProfileTable.lastOrderAt, after),
        ),
      )
      .orderBy(desc(customerProfileTable.lastOrderAt))
      .limit(limit)
      .offset(offset);
  }
}