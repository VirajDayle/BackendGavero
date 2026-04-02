import { pgTable as table } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userTable } from "./auth";
import { citiesTable, serviceablePincodesTable } from "./location";
import { geographyPoint } from "../shared/types";
import {
  kycStatusEnum,
  kycDocumentTypeEnum,
  vehicleTypeEnum,
  addressLabelEnum,
  bankAccountTypeEnum,
} from "../shared/enums";

// =============================================================================
// SECTION 5 — BANK ACCOUNTS
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
    pennyDropRef: t.varchar("penny_drop_ref", { length: 100 }),

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

// =============================================================================
// SECTION 6 — KYC DOCUMENTS
// One row per submission attempt per document type per user.
// Rows are immutable once submitted — create a new row for re-submissions.
// Personal identity only; shop business documents live in shop_verifications.
// =============================================================================

export const kycDocumentsTable = table(
  "kyc_documents",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    documentType: kycDocumentTypeEnum("document_type").notNull(),

    // Encrypted document number; last 4 kept plaintext for admin display
    documentNumberEncrypted: t.varchar("document_number_encrypted", {
      length: 512,
    }),
    documentNumberLast4: t.char("document_number_last4", { length: 4 }),

    // Object-store keys — generate signed URLs at request time; never store raw URLs
    frontImageKey: t.varchar("front_image_key", { length: 500 }),
    backImageKey: t.varchar("back_image_key", { length: 500 }),
    selfieImageKey: t.varchar("selfie_image_key", { length: 500 }),

    status: kycStatusEnum("status").default("pending").notNull(),

    reviewedBy: t
      .uuid("reviewed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: t.varchar("rejection_reason", { length: 500 }),

    // Document expiry date (e.g. passport valid until)
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
    verifiedAt: t.timestamp("verified_at", { withTimezone: true }),

    // Third-party eKYC provider (Digio / Karza / IDfy / CKYC …)
    verificationProvider: t.varchar("verification_provider", { length: 100 }),
    verificationRef: t.varchar("verification_ref", { length: 255 }),

    // Raw provider payload — kept for dispute resolution; never log this
    verificationResponse: t.jsonb("verification_response"),

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
    t.index("kyc_documents_type_idx").on(tbl.documentType),
    t.index("kyc_documents_user_type_idx").on(tbl.userId, tbl.documentType),

    // Only one active (non-rejected, non-expired) submission per type per user
    t
      .uniqueIndex("kyc_documents_active_type_uq_idx")
      .on(tbl.userId, tbl.documentType)
      .where(sql`status NOT IN ('rejected', 'expired')`),

    // Rejection reason required when status is 'rejected'
    t.check(
      "kyc_documents_rejection_reason_chk",
      sql`status <> 'rejected' OR rejection_reason IS NOT NULL`,
    ),

    // reviewedBy + reviewedAt required when a terminal review decision is made
    t.check(
      "kyc_documents_reviewed_at_chk",
      sql`status NOT IN ('verified', 'rejected') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)`,
    ),

    // verifiedAt required when status is 'verified'
    t.check(
      "kyc_documents_verified_at_chk",
      sql`status <> 'verified' OR verified_at IS NOT NULL`,
    ),
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
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

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
    h3IndexRes7: t.varchar("h3_index_res7", { length: 15 }),
    h3IndexRes9: t.varchar("h3_index_res9", { length: 15 }),

    isDefault: t.boolean("is_default").default(false).notNull(),

    // null = unresolved; populated async post-geocoding
    isServiceable: t.boolean("is_serviceable"),

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
      .where(sql`is_default = true AND deleted_at IS NULL AND shop_id IS NOT NULL`),

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
    t.index("addresses_h3_res7_idx").on(tbl.h3IndexRes7),
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

    // ── Business identity ─────────────────────────────────────────────────
    businessName: t.varchar("business_name", { length: 255 }),
    // sole_proprietorship | llp | pvt_ltd
    businessType: t.varchar("business_type", { length: 100 }),
    tradeName: t.varchar("trade_name", { length: 255 }),

    // ── Denormalised personal KYC aggregate ───────────────────────────────
    kycStatus: kycStatusEnum("kyc_status").default("not_submitted").notNull(),
    kycVerifiedAt: t.timestamp("kyc_verified_at", { withTimezone: true }),

    // ── Payout ───────────────────────────────────────────────────────────
    primaryBankAccountId: t
      .uuid("primary_bank_account_id")
      .references(() => bankAccountsTable.id, { onDelete: "set null" }),

    // ── Status ────────────────────────────────────────────────────────────
    isVerified: t.boolean("is_verified").default(false).notNull(),
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
    t.index("shop_owner_profiles_kyc_status_idx").on(tbl.kycStatus),
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

    // ── Denormalised personal KYC aggregate ───────────────────────────────
    kycStatus: kycStatusEnum("kyc_status").default("not_submitted").notNull(),
    kycVerifiedAt: t.timestamp("kyc_verified_at", { withTimezone: true }),

    // ── Vehicle ───────────────────────────────────────────────────────────
    vehicleType: vehicleTypeEnum("vehicle_type")
      .default("motorcycle")
      .notNull(),

    // Registration plate
    vehicleNumber: t.varchar("vehicle_number", { length: 20 }),
    vehicleNumberVerified: t
      .boolean("vehicle_number_verified")
      .default(false)
      .notNull(),

    // ── Driving licence ───────────────────────────────────────────────────
    licenseNumber: t.varchar("license_number", { length: 20 }).notNull(),
    licenseExpiresAt: t.timestamp("license_expires_at", { withTimezone: true }),
    licenseVerified: t.boolean("license_verified").default(false).notNull(),

    // Object-store key — generate signed URL at request time
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

    lastActiveAt: t.timestamp("last_active_at", { withTimezone: true }),

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
    t.index("dp_profiles_kyc_status_idx").on(tbl.kycStatus),

    // License number globally unique (per RTO requirement)
    t.uniqueIndex("dp_profiles_license_uq_idx").on(tbl.licenseNumber),

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

