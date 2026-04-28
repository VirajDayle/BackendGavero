import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import { rolesTable, userTable } from "./auth";
import { citiesTable } from "./location";
import { geographyPoint } from "../shared/types";
import {
  kycDocumentTypeEnum,
  vehicleTypeEnum,
  addressLabelEnum,
  bankAccountTypeEnum,
  businessTypeEnum,
  kycMethodEnum,
  profileKycStatusEnum,
  docVerificationStatusEnum,
  matchingStatusEnum,
  kycSessionStatusEnum,
  kycReviewStatusEnum,
  userRoleEnum,
} from "../shared/enums";

// =============================================================================
// SECTION 1 — BANK ACCOUNTS
// Shared by shop owners and delivery partners for payouts.
// Account numbers are AES-256-GCM encrypted at rest; only last 4 digits
// are stored in plaintext for display.
// =============================================================================

export const bankAccountsTable = table(
  "bank_accounts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    accountHolderName: t
      .varchar("account_holder_name", { length: 255 })
      .notNull(),

    // AES-256-GCM ciphertext — decrypt only inside the payout service.
    // Never log or expose this column outside the payout service boundary.
    accountNumberEncrypted: t
      .varchar("account_number_encrypted", { length: 512 })
      .notNull(),
    accountNumberLast4: t.char("account_number_last4", { length: 4 }).notNull(),

    // RBI IFSC spec: 4-letter bank code + "0" + 6 alphanumeric = 11 chars
    ifscCode: t.varchar("ifsc_code", { length: 11 }).notNull(),
    bankName: t.varchar("bank_name", { length: 150 }).notNull(),
    branchName: t.varchar("branch_name", { length: 150 }),

    accountType: bankAccountTypeEnum("account_type")
      .default("savings")
      .notNull(),

    // UPI ID for instant payment (optional)
    upiId: t.varchar("upi_id", { length: 100 }),

    isPrimary: t.boolean("is_primary").default(false).notNull(),
    isVerified: t.boolean("is_verified").default(false).notNull(),
    verifiedAt: t.timestamp("verified_at", { withTimezone: true }),

    // Reference from payment gateway penny-drop / NACH mandate verification
    verificationId: t.varchar("verification_id", { length: 100 }).notNull(),

    // Soft delete — preserve history for settled payouts
    deletedAt: t.timestamp("deleted_at", { withTimezone: true }),

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
    t.index("bank_accounts_user_idx").on(tbl.userId),
    t
      .index("bank_accounts_active_idx")
      .on(tbl.userId)
      .where(sql`deleted_at IS NULL`),

    // At most one primary account per user among non-deleted rows
    t
      .uniqueIndex("bank_accounts_primary_uq_idx")
      .on(tbl.userId)
      .where(sql`is_primary = true AND deleted_at IS NULL`),

    // IFSC format: 4 uppercase letters + "0" + 6 alphanumeric
    t.check(
      "bank_accounts_ifsc_format_chk",
      sql`ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'`,
    ),

    // accountNumberLast4 must be exactly 4 digits
    t.check(
      "bank_accounts_last4_chk",
      sql`account_number_last4 ~ '^[0-9]{4}$'`,
    ),

    // verifiedAt must be set iff isVerified is true
    t.check(
      "bank_accounts_verified_at_chk",
      sql`(is_verified = false AND verified_at IS NULL) OR (is_verified = true AND verified_at IS NOT NULL)`,
    ),
  ],
);

export const documentsTable = table("documents", {
  id: t.uuid("id").defaultRandom().primaryKey(),
  name: t.varchar("name", { length: 255 }).notNull(),
  slug: t.varchar("slug", { length: 100 }).unique().notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const roleRequiredDocuments = table(
  "role_required_documents",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),
    roleId: t
      .uuid("role_id")
      .notNull()
      .references(() => rolesTable.id, { onDelete: "cascade" }),
    documentId: t
      .uuid("document_id")
      .notNull()
      .references(() => documentsTable.id, { onDelete: "restrict" }),
    isMandatory: t.boolean("is_mandatory").default(true).notNull(),
    // ← renamed from optional (inverted logic is confusing)
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("role_required_docs_role_doc_uidx")
      .on(tbl.roleId, tbl.documentId),
  ],
);

export const kycDocumentsTable = table(
  "kyc_documents",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    documentTypeId: t
      .uuid("document_type_id")
      .notNull()
      .references(() => documentsTable.id, { onDelete: "restrict" }),

    documentNumberEncrypted: t.varchar("document_number_encrypted", {
      length: 512,
    }),
    documentNumberLast4: t.char("document_number_last4", { length: 4 }),

    frontImageKey: t.varchar("front_image_key", { length: 500 }),
    backImageKey: t.varchar("back_image_key", { length: 500 }),
    selfieImageKey: t.varchar("selfie_image_key", { length: 500 }),

    name: t.varchar("name", { length: 255 }),
    dob: t.date("dob"),
    gender: t.varchar("gender", { length: 50 }),
    status: docVerificationStatusEnum("status")
      .default("not_submitted")
      .notNull(),

    // if manual verification happen!
    reviewedBy: t
      .uuid("reviewed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: t.varchar("rejection_reason", { length: 500 }),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
    verifiedAt: t.timestamp("verified_at", { withTimezone: true }),

    verificationProvider: t.varchar("verification_provider", { length: 100 }),
    verificationId: t.varchar("verification_id", { length: 255 }),

    kycMethod: kycMethodEnum("kyc_method").default("apiProvider"),
    // verificationResponse: t.jsonb("verification_response"),

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
    t.index("kyc_documents_user_idx").on(tbl.userId),
    t.index("kyc_documents_status_idx").on(tbl.status),
    t.index("kyc_documents_type_idx").on(tbl.documentTypeId),
    t.index("kyc_documents_user_type_idx").on(tbl.userId, tbl.documentTypeId),

    // Only one active submission per status per type per user (e.g., one verified and one under_review)
    t
      .uniqueIndex("kyc_documents_active_type_status_uq_idx")
      .on(tbl.userId, tbl.documentTypeId, tbl.status)
      .where(sql`status NOT IN ('rejected','superseded', 'not_submitted')`),

    // Rejection reason required when status is 'rejected'
    t.check(
      "kyc_documents_rejection_reason_chk",
      sql`status <> 'rejected' OR rejection_reason IS NOT NULL`,
    ),

    // reviewedBy + reviewedAt required when a terminal review decision is made
    t.check(
      "kyc_documents_reviewed_at_chk",
      sql`kyc_method <> 'manual' OR status NOT IN ('verified', 'rejected') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)`,
    ),

    // verifiedAt required when status is 'verified'
    t.check(
      "kyc_documents_verified_at_chk",
      sql`status <> 'verified' OR verified_at IS NOT NULL`,
    ),
  ],
);

export const kycProfileTable = table(
  "kyc_profile",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    status: profileKycStatusEnum("status").default("not_submitted").notNull(),
    roleId: t
      .uuid("role_id")
      .notNull()
      .references(() => rolesTable.id, { onDelete: "restrict" }),
    submittedAt: t.timestamp("submitted_at", { withTimezone: true }),
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
    t.index("kyc_reviews_user_idx").on(tbl.userId),
    t.index("kyc_reviews_status_idx").on(tbl.status),
    t.uniqueIndex("kyc_profiles_user_role_uidx").on(tbl.userId, tbl.roleId),
  ],
);

export const kycReviewsTable = table(
  "kyc_reviews",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    // HUMAN READABLE ID: e.g. "REV-2024-001"
    reviewRequestId: t
      .varchar("review_request_id", { length: 50 })
      .notNull()
      .unique(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    name: t.varchar("name", { length: 255 }),
    roleId: t
      .uuid("role_id")
      .notNull()
      .references(() => rolesTable.id, { onDelete: "restrict" }),
    status: kycReviewStatusEnum("status").default("pending").notNull(),

    // Admin who performed the review
    reviewedBy: t
      .uuid("reviewed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),

    rejectionReason: t.varchar("rejection_reason", { length: 500 }),

    // Notes from the admin/system
    notes: t.text("notes"),

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
    t.index("kyc_reviews_user_idx").on(tbl.userId),
    t.index("kyc_reviews_status_idx").on(tbl.status),

    // Only one pending review per user
    t
      .uniqueIndex("kyc_reviews_pending_user_uq_idx")
      .on(tbl.userId)
      .where(sql`status IN ('pending', 'under_review')`),
  ],
);

// =============================================================================
// SECTION 7 — ADDRESSES
// Customer / partner delivery addresses with PostGIS location points.
// =============================================================================

export const addressesTable = table(
  "addresses",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "cascade" }),

    formatedAddress: t.varchar("formatted_address", { length: 255 }),

    label: addressLabelEnum("label").default("home").notNull(),

    // Required when label = 'other'
    customLabel: t.varchar("custom_label", { length: 50 }),

    // Flat / house / building number
    line1: t.varchar("line1", { length: 255 }).notNull(),

    // Street / area / locality
    line2: t.varchar("line2", { length: 255 }),

    landmark: t.varchar("landmark", { length: 150 }),

    cityId: t
      .uuid("city_id")
      .notNull()
      .references(() => citiesTable.id, { onDelete: "restrict" }),

    pincode: t.varchar("pincode", { length: 10 }).notNull(),
    state: t.varchar("state", { length: 100 }).notNull(),
    country: t.varchar("country", { length: 100 }).default("India").notNull(),

    // Optional shop association — NULL for personal addresses, set for shop/branch addresses
    // FK to shops(id) ON DELETE CASCADE — declared in migration to avoid circular import
    shopId: t.uuid("shop_id"),

    // geography(Point, 4326) — address GPS pin
    location: geographyPoint("location"),

    // Uber H3 hexagonal indexes — precomputed at write time for fast proximity lookups
    h3IndexRes8: t.varchar("h3_index_res8", { length: 15 }),
    h3IndexRes9: t.varchar("h3_index_res9", { length: 15 }),

    isCurrent: t.boolean("is_current").default(false).notNull(),

    // null = unresolved; populated async post-geocoding
    // isServiceable: t.boolean("is_serviceable"),
    receiverName: t.varchar("receiver_name", { length: 255 }),
    receiverPhone: t.varchar("receiver_phone", { length: 15 }),

    deletedAt: t.timestamp("deleted_at", { withTimezone: true }),

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
    t.index("addresses_user_idx").on(tbl.userId),
    t.index("addresses_city_idx").on(tbl.cityId),
    t.index("addresses_pincode_idx").on(tbl.pincode),
    t.index("addresses_shop_idx").on(tbl.shopId),
    t.index("addresses_formatted_idx").on(tbl.formatedAddress),
    t
      .index("addresses_active_idx")
      .on(tbl.userId)
      .where(sql`deleted_at IS NULL`),

    // Only one default address per user among non-deleted personal rows
    t
      .uniqueIndex("addresses_default_uq_idx")
      .on(tbl.userId)
      .where(sql`is_default = true AND deleted_at IS NULL AND shop_id IS NULL`),

    // Only one default address per shop among non-deleted rows
    t
      .uniqueIndex("addresses_shop_default_uq_idx")
      .on(tbl.shopId)
      .where(
        sql`is_current = true AND deleted_at IS NULL AND shop_id IS NOT NULL`,
      ),

    // customLabel is required when label is 'other'
    t.check(
      "addresses_custom_label_chk",
      sql`label <> 'other' OR custom_label IS NOT NULL`,
    ),

    // Pincode must be non-empty
    t.check("addresses_pincode_nonempty_chk", sql`length(trim(pincode)) > 0`),

    // GIST index on geography(Point) for ST_DWithin proximity queries
    t.index("addresses_location_gist_idx").using("gist", tbl.location),

    // B-tree indexes on H3 cells for fast IN(...) proximity lookups
    t.index("addresses_h3_res8_idx").on(tbl.h3IndexRes8),
    t.index("addresses_h3_res9_idx").on(tbl.h3IndexRes9),
  ],
);

// =============================================================================
// SECTION 8 — SHOP OWNER PROFILES
// =============================================================================

export const shopOwnerProfileTable = table(
  "shop_owner_profiles",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .unique()
      .references(() => userTable.id, { onDelete: "cascade" }),

    // ── Payout ───────────────────────────────────────────────────────────
    primaryBankAccountId: t
      .uuid("primary_bank_account_id")
      .references(() => bankAccountsTable.id, { onDelete: "set null" }),

    profilePhotoKey: t.varchar("profile_photo_key", { length: 500 }),

    // ── Status ────────────────────────────────────────────────────────────
    isVerified: t.boolean("is_verified").default(false).notNull(),
    verifiedAt: t.timestamp("suspended_at", { withTimezone: true }),
    isSuspended: t.boolean("is_suspended").default(false).notNull(),
    suspendedAt: t.timestamp("suspended_at", { withTimezone: true }),
    suspensionReason: t.varchar("suspension_reason", { length: 500 }),
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
    t.index("shop_owner_profiles_is_verified_idx").on(tbl.isVerified),

    // Suspension reason required when suspended
    t.check(
      "shop_owner_profiles_suspension_chk",
      sql`is_suspended = false OR suspension_reason IS NOT NULL`,
    ),

    // suspendedAt must be set when suspended
    t.check(
      "shop_owner_profiles_suspended_at_chk",
      sql`is_suspended = false OR suspended_at IS NOT NULL`,
    ),

    // kycVerifiedAt must be set when KYC is verified
    t.check(
      "shop_owner_profiles_kyc_verified_at_chk",
      sql`kyc_status <> 'verified' OR kyc_verified_at IS NOT NULL`,
    ),
  ],
);

// =============================================================================
// SECTION 9 — DELIVERY PARTNER PROFILES
// =============================================================================

export const deliveryPartnerProfileTable = table(
  "delivery_partner_profiles",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .unique()
      .references(() => userTable.id, { onDelete: "cascade" }),

    // ── Vehicle & License ───────────────────────────────────────────────────
    vehicleType: vehicleTypeEnum("vehicle_type")
      .default("motorcycle")
      .notNull(),

    profilePhotoKey: t.varchar("profile_photo_key", { length: 500 }),

    // ── Payout ────────────────────────────────────────────────────────────
    primaryBankAccountId: t
      .uuid("primary_bank_account_id")
      .references(() => bankAccountsTable.id, { onDelete: "set null" }),

    // Home city — used for zone assignment and nearest-partner dispatch queries
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "set null" }),

    // ── Rating (sum / count pattern) ─────────────────────────────────────
    // Computed average = ratingSum / ratingCount — O(1) update on new rating
    ratingSum: t.doublePrecision("rating_sum").default(0).notNull(),
    ratingCount: t.integer("rating_count").default(0).notNull(),

    // ── Lifetime performance stats ────────────────────────────────────────
    totalDeliveries: t.integer("total_deliveries").default(0).notNull(),

    // paise (₹ × 100)
    totalEarnings: t
      .bigint("total_earnings", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    isVerified: t.boolean("is_verified").default(false).notNull(),
    verifiedAt: t.timestamp("suspended_at", { withTimezone: true }),

    // ── Suspension ───────────────────────────────────────────────────────
    isSuspended: t.boolean("is_suspended").default(false).notNull(),
    suspendedAt: t.timestamp("suspended_at", { withTimezone: true }),
    suspensionReason: t.varchar("suspension_reason", { length: 500 }),

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
    // License number globally unique (per RTO requirement)
    t.check(
      "dp_profiles_rating_chk",
      sql`rating_count >= 0 AND rating_sum >= 0`,
    ),
    t.check(
      "dp_profiles_stats_chk",
      sql`total_deliveries >= 0 AND total_earnings >= 0`,
    ),

    // Suspension reason required when suspended
    t.check(
      "dp_profiles_suspension_chk",
      sql`is_suspended = false OR suspension_reason IS NOT NULL`,
    ),

    // suspendedAt must be set when suspended
    t.check(
      "dp_profiles_suspended_at_chk",
      sql`is_suspended = false OR suspended_at IS NOT NULL`,
    ),

    // kycVerifiedAt required when KYC is verified
    t.check(
      "dp_profiles_kyc_verified_at_chk",
      sql`kyc_status <> 'verified' OR kyc_verified_at IS NOT NULL`,
    ),

    // ratingSum / ratingCount consistency: count = 0 implies sum = 0
    t.check(
      "dp_profiles_rating_consistency_chk",
      sql`rating_count > 0 OR rating_sum = 0`,
    ),
  ],
);

// =============================================================================
// SECTION 10 — CUSTOMER PROFILES
// =============================================================================

export const customerProfileTable = table(
  "customer_profiles",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .unique()
      .references(() => userTable.id, { onDelete: "cascade" }),

    loyaltyPoints: t.integer("loyalty_points").default(0).notNull(),

    // Structured preferences: dietary restrictions, notification opt-ins, etc.
    preferences: t.jsonb("preferences").default(sql`'{}'::jsonb`),

    // Soft FK — referral schema owns the referral_codes table
    referralCodeId: t.uuid("referral_code_id"),

    // ── Lifetime aggregates ──────────────────────────────────────────────
    totalOrders: t.integer("total_orders").default(0).notNull(),

    // paise
    totalSpend: t
      .bigint("total_spend", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    lastOrderAt: t.timestamp("last_order_at", { withTimezone: true }),

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
    t.index("customer_profiles_last_order_idx").on(tbl.lastOrderAt),

    t.check("customer_profiles_loyalty_chk", sql`loyalty_points >= 0`),
    t.check(
      "customer_profiles_orders_chk",
      sql`total_orders >= 0 AND total_spend >= 0`,
    ),

    // lastOrderAt must be set iff totalOrders > 0
    t.check(
      "customer_profiles_last_order_at_chk",
      sql`(total_orders = 0 AND last_order_at IS NULL) OR (total_orders > 0 AND last_order_at IS NOT NULL)`,
    ),
  ],
);

// =============================================================================
// Model Types
// =============================================================================

export type BankAccount = typeof bankAccountsTable.$inferSelect;
export type BankAccountInsert = typeof bankAccountsTable.$inferInsert;
export type BankAccountUpdate = Partial<BankAccountInsert>;

export type KycDocument = typeof kycDocumentsTable.$inferSelect;
export type KycDocumentInsert = typeof kycDocumentsTable.$inferInsert;
export type KycDocumentUpdate = Partial<KycDocumentInsert>;

export type KycProfile = typeof kycProfileTable.$inferSelect;
export type KycProfileInsert = typeof kycProfileTable.$inferInsert;
export type kycProfileUpdate = Partial<KycProfileInsert>;

export type KycReview = typeof kycReviewsTable.$inferSelect;
export type KycReviewInsert = typeof kycReviewsTable.$inferInsert;
export type KycReviewUpdate = Partial<KycReviewInsert>;

export type Address = typeof addressesTable.$inferSelect;
export type AddressInsert = InferInsertModel<typeof addressesTable>;

export type ShopOwnerProfile = InferSelectModel<typeof shopOwnerProfileTable>;
export type ShopOwnerProfileInsert = InferInsertModel<
  typeof shopOwnerProfileTable
>;

export type DeliveryPartnerProfile = InferSelectModel<
  typeof deliveryPartnerProfileTable
>;
export type DeliveryPartnerProfileInsert = InferInsertModel<
  typeof deliveryPartnerProfileTable
>;

export type CustomerProfile = InferSelectModel<typeof customerProfileTable>;
export type CustomerProfileInsert = InferInsertModel<
  typeof customerProfileTable
>;
