/**
 * profile.repository.ts
 *
 * Data-access layer for the profile domain — one repository class per
 * aggregate root, following the same conventions as auth.repository.ts.
 *
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

import type { DB } from "../../db/index";
import {
  addressesTable,
  bankAccountsTable,
  citiesTable,
  customerProfileTable,
  deliveryPartnerProfileTable,
  kycDocumentsTable,
  serviceablePincodesTable,
  shopOwnerProfileTable,
} from "../../db/schema";

import type {
  Address,
  AddressInsert,
  BankAccount,
  BankAccountInsert,
  City,
  CityInsert,
  CustomerProfile,
  CustomerProfileInsert,
  DeliveryPartnerProfile,
  DeliveryPartnerProfileInsert,
  KycDocument,
  KycDocumentInsert,
  ServiceablePincode,
  ServiceablePincodeInsert,
  ShopOwnerProfile,
  ShopOwnerProfileInsert,
} from "../../db/schema";

// ---------------------------------------------------------------------------
import type { Pagination } from "./profile.schema";
import { clean, applyPagination, applyCursorPagination } from "../../shared";

// =============================================================================
// Helpers
// =============================================================================

type BankAccountUpdate = Partial<BankAccountInsert>;
type KycDocumentUpdate = Partial<KycDocumentInsert>;
type AddressUpdate = Partial<AddressInsert>;
type ShopOwnerProfileUpdate = Partial<ShopOwnerProfileInsert>;
type DeliveryPartnerProfileUpdate = Partial<DeliveryPartnerProfileInsert>;
type CustomerProfileUpdate = Partial<CustomerProfileInsert>;


/**
 * Emit a PostGIS geography(Point) write literal.
 * Usage: .set({ currentLocation: geoPoint(lat, lng) })
 *
 * @param lat - Latitude.
 * @param lng - Longitude.
 * @returns SQL template literal for ST_SetSRID.
 */
function geoPoint(lat: number, lng: number) {
  return sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
}

// =============================================================================
// 1 — BANK ACCOUNT REPOSITORY
// =============================================================================

/**
 * Repository for Bank Account information.
 * Handles primary account selection, verification (penny-drop), and soft-deletion.
 */
export class BankAccountRepository {
  /**
   * Initializes the BankAccountRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a bank account by its unique UUID.
   *
   * @param opts - Query options.
   * @param opts.includeDeleted - If true, include soft-deleted accounts.
   * @returns The record if found, otherwise null.
   */
  async findById(
    id: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<BankAccount | null> {
    const conditions = [eq(bankAccountsTable.id, id)];
    if (!opts.includeDeleted) {
      conditions.push(isNull(bankAccountsTable.deletedAt));
    }

    const [row] = await this.db
      .select()
      .from(bankAccountsTable)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a bank account by ID and user association.
   * Matches the user_id column to ensure the caller owns the account.
   *
   * @param id - The UUID of the account.
   * @param userId - The UUID of the owner.
   * @param opts - Query options.
   * @returns The record if found, or null.
   */
  async findByIdAndUser(
    id: string,
    userId: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<BankAccount | null> {
    const conditions = [
      eq(bankAccountsTable.id, id),
      eq(bankAccountsTable.userId, userId),
    ];
    if (!opts.includeDeleted) {
      conditions.push(isNull(bankAccountsTable.deletedAt));
    }

    const [row] = await this.db
      .select()
      .from(bankAccountsTable)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds the primary bank account for a given user.
   *
   * @param userId - The UUID of the user.
   * @returns The primary account record, or null.
   */
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

  /**
   * Retrieves a paginated list of all non-deleted bank accounts for a user.
   * Ordered by primary status then creation date.
   *
   * @param userId - The UUID of the user.
   * @param pagination - Pagination parameters.
   * @returns Items and total count.
   */
  async listByUser(
    userId: string,
    pagination: Pagination,
  ): Promise<{ items: BankAccount[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseWhere = and(
      eq(bankAccountsTable.userId, userId),
      isNull(bankAccountsTable.deletedAt),
    );

    const where = applyCursorPagination(
      bankAccountsTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(bankAccountsTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(bankAccountsTable)
      .where(where)
      .orderBy(
        desc(bankAccountsTable.isPrimary),
        pagination.order === "asc"
          ? bankAccountsTable.createdAt
          : desc(bankAccountsTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  /**
   * Creates a new bank account record.
   *
   * @param data - The data to insert.
   * @returns The created record.
   */
  async create(data: BankAccountInsert): Promise<BankAccount> {
    const [row] = await this.db
      .insert(bankAccountsTable)
      .values(data)
      .returning();

    return row;
  }

  /**
   * Updates an existing bank account record.
   *
   * @param id - The UUID of the account.
   * @param data - The partial data to update.
   * @returns The updated record, or null.
   */
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
   * Atomically sets one account as primary and clears the flag on all others
   * for the same user. Must be called inside a transaction.
   *
   * @param id - The UUID of the account to make primary.
   * @param userId - The UUID of the owner.
   * @returns The updated account record.
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

  /**
   * Marks an account as verified following a successful penny-drop check.
   *
   * @param id - The UUID of the account.
   * @param pennyDropRef - The reference ID from the payment provider.
   * @returns The updated record.
   */
  async markVerified(
    id: string,
    pennyDropRef: string,
  ): Promise<BankAccount | null> {
    const [row] = await this.db
      .update(bankAccountsTable)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        pennyDropRef,
        updatedAt: new Date(),
      })
      .where(
        and(eq(bankAccountsTable.id, id), isNull(bankAccountsTable.deletedAt)),
      )
      .returning();

    return row ?? null;
  }

  /**
   * Performs a soft-delete on a bank account.
   * Hard-delete is intentionally omitted — accounts must be preserved for
   * settled payout audit trails and dispute resolution.
   *
   * @param id - The UUID of the account.
   * @param userId - The UUID of the owner (to ensure ownership).
   * @returns The updated record.
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
// 2 — KYC DOCUMENT REPOSITORY
// =============================================================================

/**
 * Repository for KYC (Know Your Customer) documents.
 * Handles immutable submission logs, third-party verification (IDfy/Karza),
 * and admin review workflows.
 */
export class KycDocumentRepository {
  /**
   * Initializes the KycDocumentRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a document record by its unique UUID.
   *
   * @param id - The UUID of the record.
   * @returns The record if found, or null.
   */
  async findById(id: string): Promise<KycDocument | null> {
    const [row] = await this.db
      .select()
      .from(kycDocumentsTable)
      .where(eq(kycDocumentsTable.id, id))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a document by ID and user, ensuring authorization.
   *
   * @param id - The UUID of the document.
   * @param userId - The UUID of the user.
   * @returns The record if found, or null.
   */
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
   * "Active" means not rejected and not expired, matching the unique index
   * constraint on the model.
   *
   * @param userId - The UUID of the user.
   * @param documentType - The type (aadhaar, pan, etc.).
   * @returns The active record if found, or null.
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

  /**
   * Retrieves a paginated list of all KYC documents submitted by a user.
   *
   * @param userId - The UUID of the user.
   * @param pagination - Pagination parameters.
   * @returns Items and total count.
   */
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
   * Retrieves a paginated list of KYC documents filtered by status.
   * Used primarily by admins for verification queues.
   *
   * @param status - The target status (pending, verified, etc.).
   * @param pagination - Pagination parameters.
   * @returns Items and total count.
   */
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

  /**
   * Creates a new KYC document submission.
   * Rows are immutable once submitted — new submissions always insert a fresh
   * row. The unique partial index on (userId, documentType) WHERE status NOT IN
   * ('rejected','expired') prevents duplicate active submissions at the DB level.
   *
   * @param data - The data to insert.
   * @returns The created record.
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
   *
   * @param id - The UUID of the document.
   * @param reviewedBy - The UUID of the admin.
   * @param status - The terminal status.
   * @param rejectionReason - Required if status is rejected.
   * @returns The updated record, or null.
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
   *
   * @param userId - The UUID of the user.
   * @param documentType - The type of document.
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
   *
   * @param id - The UUID of the document.
   * @param provider - e.g., 'Karza', 'IDfy'.
   * @param ref - Provider reference transition ID.
   * @param response - Raw JSON payload.
   * @returns The updated record.
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
// 3 — ADDRESS REPOSITORY
// =============================================================================

/**
 * Repository for Physical Addresses.
 * Handles geocoding-derived PostGIS location points, H3 indexing,
 * and proximity-based nearby searches.
 */
export class AddressRepository {
  /**
   * Initializes the AddressRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds an address by its unique UUID.
   *
   * @param id - The UUID of the address.
   * @returns The record if found, or null.
   */
  async findById(id: string): Promise<Address | null> {
    const [row] = await this.db
      .select()
      .from(addressesTable)
      .where(and(eq(addressesTable.id, id), isNull(addressesTable.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds an address by ID and user, ensuring authorization.
   *
   * @param id - The UUID of the address.
   * @param userId - The UUID of the owner.
   * @returns The record if found, or null.
   */
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

  /**
   * Finds the user's default personal address.
   *
   * @param userId - The UUID of the user.
   * @returns The default record, or null.
   */
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

  /**
   * Retrieves a paginated list of all active addresses for a user.
   *
   * @param userId - The UUID of the user.
   * @param pagination - Pagination parameters.
   * @returns Items and total count.
   */
  async listByUser(
    userId: string,
    pagination: Pagination,
  ): Promise<{ items: Address[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseWhere = and(
      eq(addressesTable.userId, userId),
      isNull(addressesTable.deletedAt),
    );

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
        desc(addressesTable.isDefault),
        pagination.order === "asc"
          ? addressesTable.createdAt
          : desc(addressesTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  /**
   * Creates a new address record.
   *
   * @param data - The address data to insert.
   * @returns The created record.
   */
  async create(data: AddressInsert): Promise<Address> {
    const [row] = await this.db.insert(addressesTable).values(data).returning();

    return row;
  }

  /**
   * Updates an existing address record.
   *
   * @param id - The UUID of the address.
   * @param data - The partial data to update.
   * @returns The updated record, or null.
   */
  async update(id: string, data: AddressUpdate): Promise<Address | null> {
    const [row] = await this.db
      .update(addressesTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(and(eq(addressesTable.id, id), isNull(addressesTable.deletedAt)))
      .returning();

    return row ?? null;
  }

  /**
   * Sets one address as default and clears the flag on all others for the user
   * within the same scope (personal vs shop). Must be called inside a transaction.
   *
   * @param id - The UUID of the address to make default.
   * @param userId - The UUID of the owner.
   * @returns The updated record, or null.
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
   *
   * @param id - The UUID of the address.
   * @param lat - Latitude.
   * @param lng - Longitude.
   * @param isServiceable - Serviceability verdict.
   * @param h3 - Res-7 and Res-9 H3 index strings.
   * @returns The updated record.
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
      .where(and(eq(addressesTable.id, id), isNull(addressesTable.deletedAt)))
      .returning();

    return row ?? null;
  }

  /**
   * Performs a soft-delete on an address.
   *
   * @param id - The UUID of the address.
   * @param userId - The UUID of the owner.
   * @returns The updated record.
   */
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
   *
   * @param lat - Search Origin Latitude.
   * @param lng - Search Origin Longitude.
   * @param radiusMetres - Scan radius.
   * @param pagination - Pagination parameters.
   * @param h3Cells - Optional list of H3 cells for course filtering.
   * @returns Items and total count.
   */
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

    if (h3Cells && h3Cells.length > 0) {
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
// 4 — SHOP OWNER PROFILE REPOSITORY
// =============================================================================

/**
 * Repository for Shop Owner Profiles.
 * Bridges User identity with Business/Shop metadata and denormalized KYC.
 */
export class ShopOwnerProfileRepository {
  /**
   * Initializes the ShopOwnerProfileRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a shop owner profile by its unique internal UUID.
   *
   * @param id - The UUID of the profile.
   * @returns The record if found, or null.
   */
  async findById(id: string): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .select()
      .from(shopOwnerProfileTable)
      .where(eq(shopOwnerProfileTable.id, id))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a shop owner profile by the associated User ID.
   * Fundamental lookup for the authenticated session owner.
   *
   * @param userId - The UUID of the User.
   * @returns The record if found, or null.
   */
  async findByUserId(userId: string): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .select()
      .from(shopOwnerProfileTable)
      .where(eq(shopOwnerProfileTable.userId, userId))
      .limit(1);

    return row ?? null;
  }

  /**
   * Retrieves a paginated list of profiles filtered by KYC status.
   *
   * @param status - The target KYC status.
   * @param pagination - Pagination parameters.
   * @returns Items and total count.
   */
  async listByKycStatus(
    status: ShopOwnerProfile["kycStatus"],
    pagination: Pagination,
  ): Promise<{ items: ShopOwnerProfile[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseWhere = eq(shopOwnerProfileTable.kycStatus, status);
    const where = applyCursorPagination(
      shopOwnerProfileTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(shopOwnerProfileTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(shopOwnerProfileTable)
      .where(where)
      .orderBy(
        pagination.order === "asc"
          ? shopOwnerProfileTable.createdAt
          : desc(shopOwnerProfileTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  /**
   * Creates a new shop owner profile record.
   * uses onConflictDoNothing: the unique constraint on userId means a second insert
   * for the same user returns null.
   *
   * @param data - The data to insert.
   * @returns The created record, or null if it already exists.
   */
  async create(data: ShopOwnerProfileInsert): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .insert(shopOwnerProfileTable)
      .values(data)
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  /**
   * Updates an existing shop owner profile.
   *
   * @param userId - The UUID of the User.
   * @param data - The partial data to update.
   * @returns The updated record, or null.
   */
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
   *
   * @param userId - The UUID of the User.
   * @param status - The new aggregate KYC status.
   * @returns The updated record, or null.
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

  /**
   * Toggles the top-level isVerified flag for a shop owner.
   *
   * @param userId - The UUID of the User.
   * @returns The updated record, or null.
   */
  async markVerified(userId: string): Promise<ShopOwnerProfile | null> {
    const [row] = await this.db
      .update(shopOwnerProfileTable)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(shopOwnerProfileTable.userId, userId))
      .returning();

    return row ?? null;
  }

  /**
   * Suspends a shop owner account with a specified reason.
   *
   * @param userId - The UUID of the User.
   * @param reason - Detailed reason for suspension.
   * @returns The updated record, or null.
   */
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

  /**
   * Unsuspends a shop owner account.
   *
   * @param userId - The UUID of the User.
   * @returns The updated record, or null.
   */
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

  /**
   * Updates the primary bank account associated with the shop owner.
   *
   * @param userId - The UUID of the User.
   * @param bankAccountId - The UUID of the BankAccount record.
   * @returns The updated record.
   */
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
// 5 — DELIVERY PARTNER PROFILE REPOSITORY
// =============================================================================

/**
 * Repository for Delivery Partner Profiles.
 * Manages vehicle details, license verification, ratings, and earnings.
 */
export class DeliveryPartnerProfileRepository {
  /**
   * Initializes the DeliveryPartnerProfileRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a delivery partner profile by its unique internal UUID.
   *
   * @param id - The UUID of the profile.
   * @returns The record if found, or null.
   */
  async findById(id: string): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .select()
      .from(deliveryPartnerProfileTable)
      .where(eq(deliveryPartnerProfileTable.id, id))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a delivery partner profile by the associated User ID.
   *
   * @param userId - The UUID of the User.
   * @returns The record if found, or null.
   */
  async findByUserId(userId: string): Promise<DeliveryPartnerProfile | null> {
    const [row] = await this.db
      .select()
      .from(deliveryPartnerProfileTable)
      .where(eq(deliveryPartnerProfileTable.userId, userId))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a delivery partner by their unique license number.
   *
   * @param licenseNumber - The RTO license number string.
   * @returns The record if found, or null.
   */
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

  /**
   * Retrieves a paginated list of delivery partners filtered by KYC status.
   *
   * @param status - The target KYC status.
   * @param pagination - Pagination parameters.
   * @returns Items and total count.
   */
  async listByKycStatus(
    status: DeliveryPartnerProfile["kycStatus"],
    pagination: Pagination,
  ): Promise<{ items: DeliveryPartnerProfile[]; total: number }> {
    const { limit, offset } = applyPagination(
      pagination.limit,
      pagination.page,
    );

    const baseWhere = eq(deliveryPartnerProfileTable.kycStatus, status);
    const where = applyCursorPagination(
      deliveryPartnerProfileTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(deliveryPartnerProfileTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(deliveryPartnerProfileTable)
      .where(where)
      .orderBy(desc(deliveryPartnerProfileTable.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  /**
   * Creates a new delivery partner profile.
   * uses onConflictDoNothing: unique constraint on userId — returns null if the
   * profile already exists.
   *
   * @param data - The data to insert.
   * @returns The created record, or null.
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

  /**
   * Updates an existing delivery partner profile.
   *
   * @param userId - The UUID of the User.
   * @param data - The partial data to update.
   * @returns The updated record, or null.
   */
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
   * Called by the background job that aggregates kyc_documents statuses.
   * Denormalises the overall KYC verdict onto the profile row.
   *
   * @param userId - The UUID of the User.
   * @param status - The new aggregate KYC status.
   * @returns The updated record, or null.
   */
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
   *
   * @param userId - The UUID of the User.
   * @param rating - Numeric rating (1-5).
   * @returns The updated record, or null.
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
   *
   * @param userId - The UUID of the User.
   * @param earningsPaise - Amount earned in paise.
   * @returns The updated record, or null.
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

  /**
   * Suspends a delivery partner account with a reason.
   *
   * @param userId - The UUID of the User.
   * @param reason - Detailed reason for suspension.
   * @returns The updated record, or null.
   */
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

  /**
   * Unsuspends a delivery partner account.
   *
   * @param userId - The UUID of the User.
   * @returns The updated record, or null.
   */
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

  /**
   * Updates the primary bank account associated with the delivery partner.
   *
   * @param userId - The UUID of the User.
   * @param bankAccountId - The UUID of the BankAccount record.
   * @returns The updated record.
   */
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
// 6 — CUSTOMER PROFILE REPOSITORY
// =============================================================================

/**
 * Repository for Customer Profiles.
 * Manages loyalty points, lifetime aggregates, and preferences.
 */
export class CustomerProfileRepository {
  /**
   * Initializes the CustomerProfileRepository with a database connection.
   * @param db - The Drizzle ORM database instance.
   */
  constructor(private readonly db: DB) { }

  /**
   * Finds a customer profile by its unique internal UUID.
   *
   * @param id - The UUID of the profile.
   * @returns The record if found, or null.
   */
  async findById(id: string): Promise<CustomerProfile | null> {
    const [row] = await this.db
      .select()
      .from(customerProfileTable)
      .where(eq(customerProfileTable.id, id))
      .limit(1);

    return row ?? null;
  }

  /**
   * Finds a customer profile by the associated User ID.
   *
   * @param userId - The UUID of the User.
   * @returns The record if found, or null.
   */
  async findByUserId(userId: string): Promise<CustomerProfile | null> {
    const [row] = await this.db
      .select()
      .from(customerProfileTable)
      .where(eq(customerProfileTable.userId, userId))
      .limit(1);

    return row ?? null;
  }

  /**
   * Creates a new customer profile.
   * uses onConflictDoNothing: returns null if the profile already exists.
   *
   * @param data - The data to insert.
   * @returns The created record, or null.
   */
  async create(data: CustomerProfileInsert): Promise<CustomerProfile | null> {
    const [row] = await this.db
      .insert(customerProfileTable)
      .values(data)
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  /**
   * Updates an existing customer profile.
   *
   * @param userId - The UUID of the User.
   * @param data - The partial data to update.
   * @returns The updated record, or null.
   */
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
   *
   * @param userId - The UUID of the User.
   * @param amountPaise - Order value in paise.
   * @returns The updated record, or null.
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
   *
   * @param userId - The UUID of the User.
   * @param delta - Signed integer delta.
   * @returns The updated record, or null.
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

  /**
   * Retrieves a paginated list of customers who have ordered after a certain date.
   * Used for re-engagement campagins by marketing.
   *
   * @param after - Start timestamp.
   * @param pagination - Pagination parameters.
   * @returns Items and total count.
   */
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
