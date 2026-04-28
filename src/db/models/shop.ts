import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userTable } from "./auth";
import { addressesTable } from "./profile";
import { citiesTable } from "./location";
import { geographyPoint } from "../shared/types";
import {
  shopStatusEnum,
  shopDocumentStatusEnum,
  shopDocumentTypeEnum,
  subscriptionPlanEnum,
  subscriptionStatusEnum,
} from "../shared/enums";

// =============================================================================
// Pre-defined Shop Types  — platform-managed seed data
// =============================================================================

export const shopTypeTable = table(
  "shop_types",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 100 }).notNull(),
    slug: t.varchar("slug", { length: 120 }).notNull(),
    description: t.varchar("description", { length: 255 }),

    // Icon key in object store — resolved to signed URL at request time
    iconKey: t.varchar("icon_key", { length: 500 }),

    isActive: t.boolean("is_active").default(true).notNull(),
    sortOrder: t.smallint("sort_order").default(0).notNull(), // display ordering

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
    t.uniqueIndex("shop_types_slug_uq_idx").on(tbl.slug),
    t.uniqueIndex("shop_types_name_uq_idx").on(tbl.name),
    t.index("shop_types_active_idx").on(tbl.isActive),
  ],
);

// =============================================================================
// Pre-defined Categories  — platform-managed taxonomy
// =============================================================================

export const preCategoriesTable = table(
  "pre_categories",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 100 }).notNull(),
    slug: t.varchar("slug", { length: 120 }).notNull(),
    description: t.text("description"),

    // Icon key in object store
    iconKey: t.varchar("icon_key", { length: 500 }),

    isActive: t.boolean("is_active").default(true).notNull(),
    sortOrder: t.smallint("sort_order").default(0).notNull(),

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
    t.uniqueIndex("pre_categories_slug_uq_idx").on(tbl.slug),
    t.index("pre_categories_active_idx").on(tbl.isActive),
  ],
);

// =============================================================================
// Shop-owned Categories  — per-shop hierarchical product taxonomy
// =============================================================================

export const categoriesTable = table(
  "categories",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    // Self-referential FK for sub-categories (level > 1)
    parentId: t.uuid("parent_id"), // FK declared via foreignKey() below

    name: t.varchar("name", { length: 100 }).notNull(),
    slug: t.varchar("slug", { length: 120 }).notNull(),
    description: t.text("description"),

    // Object-store key
    imageKey: t.varchar("image_key", { length: 500 }),

    // 1 = root, 2 = sub, 3 = leaf — enforced by application layer
    level: t.smallint("level").notNull().default(1),

    isActive: t.boolean("is_active").default(true).notNull(),
    sortOrder: t.smallint("sort_order").default(0).notNull(),

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
    // Self-referential FK
    t.foreignKey({
      columns: [tbl.parentId],
      foreignColumns: [tbl.id],
      name: "categories_parent_fk",
    }),
    // Slug must be unique within a shop's category tree
    t.uniqueIndex("categories_shop_slug_uq_idx").on(tbl.shopId, tbl.slug),
    t.index("categories_shop_idx").on(tbl.shopId),
    t.index("categories_parent_idx").on(tbl.parentId),
    t.check("categories_level_chk", sql`level >= 1 AND level <= 3`),
    t.check(
      "categories_parent_level_chk",
      // Root categories must not have a parent
      sql`(level = 1 AND parent_id IS NULL) OR (level > 1 AND parent_id IS NOT NULL)`,
    ),
  ],
);

// =============================================================================
// Shops  — core entity
// =============================================================================

export const shopsTable = table(
  "shops",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    ownerId: t
      .uuid("owner_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    shopTypeId: t
      .uuid("shop_type_id")
      .notNull()
      .references(() => shopTypeTable.id, { onDelete: "restrict" }),

    // Slug is unique per (shop_type, slug) pair — enforced below
    // Allows "groceries/quickmart" and "pharmacy/quickmart" to coexist
    name: t.varchar("name", { length: 150 }).notNull(),
    slug: t.varchar("slug", { length: 180 }).notNull(),
    username: t.varchar("username", { length: 100 }).notNull(), // @handle, globally unique
    tagLine: t.varchar("tag_line", { length: 200 }),
    description: t.varchar("description", { length: 1000 }),

    // Object-store keys — never raw URLs
    logoKey: t.varchar("logo_key", { length: 500 }),
    bannerKey: t.varchar("banner_key", { length: 500 }),

    // Contact — unique constraints use partial indexes to ignore NULL values
    phone: t.varchar("phone", { length: 20 }),
    email: t.varchar("email", { length: 320 }),

    // Primary address — also the default pickup/return location
    primaryAddressId: t
      .uuid("primary_address_id")
      .references(() => addressesTable.id, { onDelete: "set null" }).notNull(),

    // geography(Point, 4326) — shop pin for map view and proximity queries
    // GIST index → migrations/add_spatial_indexes.sql
    location: geographyPoint("location").notNull(),

    // Uber H3 hexagonal indexes — precomputed at write time for fast proximity lookups
    h3IndexRes7: t.varchar("h3_index_res7", { length: 15 }).notNull(),
    h3IndexRes9: t.varchar("h3_index_res9", { length: 15 }).notNull(),

    // Which city this shop services — used for city-level filtering
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "restrict" }),

    // Lifecycle status — NOT personal KYC status
    status: shopStatusEnum("status").default("draft").notNull(),

    // Whether the shop is currently accepting orders (owner-toggled)
    isOpen: t.boolean("is_open").default(false).notNull(),

    // Whether the shop is discoverable in search / maps
    // Computed: status = 'active' AND is_open = true — but stored for query performance
    isPublished: t.boolean("is_published").default(false).notNull(),

    // Subscription
    subscriptionPlan: subscriptionPlanEnum("subscription_plan")
      .default("free")
      .notNull(),
    subscriptionStatus: subscriptionStatusEnum("subscription_status")
      .default("active")
      .notNull(),
    subscriptionExpiresAt: t.timestamp("subscription_expires_at", {
      withTimezone: true,
    }),

    // Operational settings as flexible JSON
    // e.g. { minOrderAmount, deliveryRadius, autoAcceptOrders, notificationPrefs }
    settings: t.jsonb("settings").default(sql`'{}'::jsonb`),

    // Admin notes — never exposed to customers
    internalNotes: t.text("internal_notes"),

    deletedAt: t.timestamp("deleted_at", { withTimezone: true }), // soft delete

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
    t.index("shops_owner_idx").on(tbl.ownerId),
    t.index("shops_status_idx").on(tbl.status),
    t.index("shops_city_idx").on(tbl.cityId),
    t.index("shops_shop_type_idx").on(tbl.shopTypeId),

    // Published shops index — hot path for customer-facing queries
    t
      .index("shops_published_city_idx")
      .on(tbl.cityId, tbl.isPublished)
      .where(sql`is_published = true AND deleted_at IS NULL`),

    // Username is globally unique (like an @handle)
    t
      .uniqueIndex("shops_username_uq_idx")
      .on(tbl.username)
      .where(sql`deleted_at IS NULL`),

    // Slug unique within a shop type — allows same slug across different types
    t
      .uniqueIndex("shops_type_slug_uq_idx")
      .on(tbl.shopTypeId, tbl.slug)
      .where(sql`deleted_at IS NULL`),

    // Phone / email: unique among non-deleted shops, allowing NULL duplicates
    t
      .uniqueIndex("shops_phone_uq_idx")
      .on(tbl.phone)
      .where(sql`phone IS NOT NULL AND deleted_at IS NULL`),
    t
      .uniqueIndex("shops_email_uq_idx")
      .on(tbl.email)
      .where(sql`email IS NOT NULL AND deleted_at IS NULL`),

    t.check(
      "shops_published_requires_active_chk",
      sql`is_published = false OR status = 'active'`,
    ),
    t.check(
      "shops_open_requires_published_chk",
      sql`is_open = false OR is_published = true`,
    ),
    // GIST on location → migrations/add_spatial_indexes.sql

    // B-tree indexes on H3 cells — hot path for customer "shops near me" queries
    t
      .index("shops_h3_res7_idx")
      .on(tbl.h3IndexRes7)
      .where(sql`deleted_at IS NULL`),
    t
      .index("shops_h3_res9_idx")
      .on(tbl.h3IndexRes9)
      .where(sql`deleted_at IS NULL`),
  ],
);

// =============================================================================
// Shop Business Verifications
//
// Business document verification (GST cert, FSSAI, trade licence).
// Entirely separate from personal identity KYC (kyc_documents table).
// Uses shopDocumentStatusEnum ("approved") not kycStatusEnum ("verified").
// =============================================================================

export const shopVerificationsTable = table(
  "shop_verifications",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    documentType: shopDocumentTypeEnum("document_type").notNull(),

    documentNumber: t.varchar("document_number", { length: 100 }), // GST number, FSSAI number etc.

    // Object-store key — resolve to signed URL at request time; never store raw URLs
    documentKey: t.varchar("document_key", { length: 500 }).notNull(),

    status: shopDocumentStatusEnum("status").default("pending").notNull(),

    reviewedBy: t
      .uuid("reviewed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: t.text("rejection_reason"),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }), // document validity expiry
    approvedAt: t.timestamp("approved_at", { withTimezone: true }),

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
    t.index("shop_verifications_shop_idx").on(tbl.shopId),
    t.index("shop_verifications_status_idx").on(tbl.status),
    t.index("shop_verifications_type_idx").on(tbl.documentType),
    // One active submission per document type per shop
    t
      .uniqueIndex("shop_verifications_active_type_uq_idx")
      .on(tbl.shopId, tbl.documentType)
      .where(sql`status NOT IN ('rejected', 'expired')`),
    t.check(
      "shop_verifications_rejection_reason_chk",
      sql`status <> 'rejected' OR rejection_reason IS NOT NULL`,
    ),
  ],
);

// =============================================================================
// Shop Branches  — physical locations belonging to a single shop
// =============================================================================

export const shopBranchesTable = table(
  "shop_branches",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    name: t.varchar("name", { length: 150 }).notNull(),
    phone: t.varchar("phone", { length: 20 }),

    addressId: t
      .uuid("address_id")
      .references(() => addressesTable.id, { onDelete: "set null" }),

    // geography(Point, 4326) — branch pin, independent of address.location
    // GIST index → migrations/add_spatial_indexes.sql
    location: geographyPoint("location"),

    // Uber H3 hexagonal indexes
    h3IndexRes7: t.varchar("h3_index_res7", { length: 15 }),
    h3IndexRes9: t.varchar("h3_index_res9", { length: 15 }),

    isOpen: t.boolean("is_open").default(false).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),

    // Branch-level settings override shop-level settings where present
    settings: t.jsonb("settings").default(sql`'{}'::jsonb`),
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
    t.index("shop_branches_shop_idx").on(tbl.shopId),
    // Branch name must be unique within a shop
    t.uniqueIndex("shop_branches_name_uq_idx").on(tbl.shopId, tbl.name),
    t
      .index("shop_branches_active_idx")
      .on(tbl.shopId)
      .where(sql`is_active = true`),
    // GIST on location → migrations/add_spatial_indexes.sql

    // H3 index for branch proximity queries
    t
      .index("shop_branches_h3_res9_idx")
      .on(tbl.h3IndexRes9)
      .where(sql`is_active = true`),
  ],
);

// =============================================================================
// Shop Operating Hours  — regular weekly schedule
// =============================================================================

export const shopHoursTable = table(
  "shop_hours",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    // 0 = Sunday … 6 = Saturday (ISO 8601 weekday - 1)
    dayOfWeek: t.smallint("day_of_week").notNull(),

    openTime: t.time("open_time").notNull(),
    closeTime: t.time("close_time").notNull(),

    // Overnight slots: open_time > close_time means closes next day (e.g. 22:00 → 02:00)
    isOvernight: t.boolean("is_overnight").default(false).notNull(),

    // Optional mid-day break (stored as TIME, not TIMESTAMP — date-agnostic)
    breakStartTime: t.time("break_start_time"),
    breakEndTime: t.time("break_end_time"),

    // True when shop is closed all day (weekly off, etc.)
    isClosed: t.boolean("is_closed").default(false).notNull(),

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
    t.index("shop_hours_shop_idx").on(tbl.shopId),
    // One row per shop per day
    t.uniqueIndex("shop_hours_shop_day_uq_idx").on(tbl.shopId, tbl.dayOfWeek),
    t.check(
      "shop_hours_day_range_chk",
      sql`day_of_week >= 0 AND day_of_week <= 6`,
    ),
    // Time logic: normal hours must have open < close; overnight allows open > close
    t.check(
      "shop_hours_time_logic_chk",
      sql`is_closed = true
          OR (is_overnight = false AND open_time < close_time)
          OR (is_overnight = true  AND open_time > close_time)`,
    ),
    // Break window must be within the open window
    t.check(
      "shop_hours_break_pair_chk",
      sql`(break_start_time IS NULL AND break_end_time IS NULL)
          OR (break_start_time IS NOT NULL AND break_end_time IS NOT NULL
              AND break_start_time < break_end_time)`,
    ),
  ],
);

// =============================================================================
// Shop Holidays  — date-range overrides that close the shop
// =============================================================================

export const shopHolidaysTable = table(
  "shop_holidays",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    holidayName: t.varchar("holiday_name", { length: 255 }),
    message: t.text("message"), // shown to customers during this period

    // Inclusive date range — single-day holiday: start_date = end_date
    startDate: t.date("start_date").notNull(),
    endDate: t.date("end_date").notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("shop_holidays_shop_date_idx").on(tbl.shopId, tbl.startDate),
    t.check("shop_holidays_date_range_chk", sql`end_date >= start_date`),
  ],
);

// =============================================================================
// Shop Stats  — denormalised aggregates, updated asynchronously
// =============================================================================

export const shopStatsTable = table(
  "shop_stats",
  {
    // 1:1 with shops — use shopId as PK to prevent accidental duplicates
    shopId: t
      .uuid("shop_id")
      .primaryKey()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    // Rating: sum/count pattern — avg = rating_sum / rating_count
    ratingSum: t.doublePrecision("rating_sum").default(0).notNull(),
    ratingCount: t.integer("rating_count").default(0).notNull(),

    totalOrders: t.integer("total_orders").default(0).notNull(),
    totalReviews: t.integer("total_reviews").default(0).notNull(),

    // Revenue in paise — bigint prevents overflow for high-volume shops
    totalRevenue: t
      .bigint("total_revenue", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    // Fulfilment quality metrics
    avgPreparationTimeMins: t.doublePrecision("avg_preparation_time_mins"),
    cancellationRate: t
      .doublePrecision("cancellation_rate")
      .default(0)
      .notNull(), // 0–1

    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    // Covering indexes for leaderboard / sort queries
    t.index("shop_stats_rating_idx").on(tbl.ratingSum, tbl.ratingCount),
    t.index("shop_stats_orders_idx").on(tbl.totalOrders),
    t.check(
      "shop_stats_rating_chk",
      sql`rating_count >= 0 AND rating_sum >= 0`,
    ),
    t.check("shop_stats_revenue_chk", sql`total_revenue >= 0`),
    t.check(
      "shop_stats_cancellation_chk",
      sql`cancellation_rate >= 0 AND cancellation_rate <= 1`,
    ),
  ],
);

// =============================================================================
// Shop Reviews
// =============================================================================

export const shopReviewsTable = table(
  "shop_reviews",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    // orderId FK intentionally omitted here — wired in the orders schema
    // to keep this schema self-contained; app layer enforces one-review-per-order
    orderId: t.uuid("order_id"),

    rating: t.smallint("rating").notNull(), // 1–5, enforced by check below
    comment: t.varchar("comment", { length: 1000 }),

    // Moderation
    isHidden: t.boolean("is_hidden").default(false).notNull(),
    hiddenReason: t.varchar("hidden_reason", { length: 255 }),
    hiddenBy: t
      .uuid("hidden_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    // Anti-abuse fingerprinting — never used for targeting, only fraud detection
    ipAddress: t.inet("ip_address"),
    deviceId: t.varchar("device_id", { length: 100 }),

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
    t.index("shop_reviews_shop_idx").on(tbl.shopId),
    t.index("shop_reviews_user_idx").on(tbl.userId),
    t.index("shop_reviews_shop_created_idx").on(tbl.shopId, tbl.createdAt),
    // One review per customer per shop
    t.uniqueIndex("shop_reviews_shop_user_uq_idx").on(tbl.shopId, tbl.userId),
    t
      .index("shop_reviews_visible_idx")
      .on(tbl.shopId, tbl.rating)
      .where(sql`is_hidden = false`),
    t.check("shop_reviews_rating_chk", sql`rating >= 1 AND rating <= 5`),
    t.check(
      "shop_reviews_hidden_reason_chk",
      sql`is_hidden = false OR hidden_reason IS NOT NULL`,
    ),
  ],
);

// =============================================================================
// AI Recommendations
// =============================================================================

export const shopAiRecommendationsTable = table(
  "shop_ai_recommendations",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    // Context — what triggered this recommendation
    recommendationType: t
      .varchar("recommendation_type", { length: 50 })
      .notNull(),
    // e.g. 'similar_shops' | 'reorder_suggestion' | 'trending_near_you'

    shopId: t
      .uuid("shop_id")
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),

    // Raw input fed to the model (query, user context, location, etc.)
    inputContext: t.jsonb("input_context"),

    // Ordered list of recommended entity IDs + metadata
    recommendedItems: t.jsonb("recommended_items"),

    // Model provenance
    modelVersion: t.varchar("model_version", { length: 50 }),
    confidenceScore: t.numeric("confidence_score", { precision: 5, scale: 4 }), // 0.0000–1.0000

    // TTL — recommendations are stale after this point
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("shop_ai_recommendations_shop_idx").on(tbl.shopId),
    t.index("shop_ai_recommendations_user_idx").on(tbl.userId),
    t.index("shop_ai_recommendations_type_idx").on(tbl.recommendationType),
    t.index("shop_ai_recommendations_expires_idx").on(tbl.expiresAt),
    t.check(
      "ai_recommendations_confidence_chk",
      sql`confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)`,
    ),
  ],
);
