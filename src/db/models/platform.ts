import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { geographyPoint } from "../shared/types";
import { shopsTable } from "./shop";
import { masterProductTable } from "./catalog";
import { ordersTable } from "./commerce";
import { citiesTable, serviceablePincodesTable } from "./location";
import {
  configValueTypeEnum,
  configScopeEnum,
  platformSearchIntentEnum,
  onboardingStepEnum,
  onboardingStepStatusEnum,
  shopVerificationQueueStatusEnum,
  supportTicketStatusEnum,
  supportTicketPriorityEnum,
  supportActorTypeEnum,
  platformAnnouncementTargetEnum,
  dpApplicationStatusEnum,
  maintenanceStatusEnum,
  platformAnnouncementTypeEnum,
  staticPageTargetEnum,
  faqTargetEnum,
  dpOnboardingStepEnum,
} from "../shared/enums";
import { userTable } from "./auth";



// =============================================================================
// PLATFORM CONFIG
// =============================================================================

export const platformConfigTable = table(
  "platform_config",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    // Unique dot-namespaced key  e.g. "delivery.max_radius_metres"
    configKey: t.varchar("config_key", { length: 200 }).notNull(),

    // Human label for the admin dashboard
    label: t.varchar("label", { length: 255 }).notNull(),
    description: t.text("description"),

    // Grouping for admin UI  e.g. "delivery" | "commission" | "payment" | "search"
    group: t.varchar("group", { length: 100 }).notNull(),

    valueType: configValueTypeEnum("value_type").notNull(),
    scope: configScopeEnum("scope").notNull().default("global"),

    // Scope anchors
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "cascade" }),
    shopTypeSlug: t.varchar("shop_type_slug", { length: 120 }),

    // The actual value — always stored as text; cast by the app using valueType
    value: t.text("value").notNull(),

    // Validation
    minValue: t.text("min_value"),
    maxValue: t.text("max_value"),
    allowedValues: t.jsonb("allowed_values").$type<string[]>(),
    // null = any valid value is accepted

    isEditable: t.boolean("is_editable").default(true).notNull(),
    // false = read-only (set at seeding time, never changed via UI)

    isSecret: t.boolean("is_secret").default(false).notNull(),
    // true = masked in admin UI, never returned to clients

    lastChangedBy: t
      .uuid("last_changed_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    previousValue: t.text("previous_value"),
    // Last value before the most recent change — single-level undo

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
    // One config per (key, scope, cityId, shopTypeSlug)
    t
      .uniqueIndex("platform_config_key_scope_uq_idx")
      .on(tbl.configKey, tbl.cityId, tbl.shopTypeSlug)
      .where(sql`scope = 'global'`),

    t
      .uniqueIndex("platform_config_key_city_uq_idx")
      .on(tbl.configKey, tbl.cityId)
      .where(sql`scope = 'city' AND city_id IS NOT NULL`),

    t.index("platform_config_group_idx").on(tbl.group, tbl.scope),
    t.index("platform_config_city_idx").on(tbl.cityId),

    t.check(
      "platform_config_scope_anchor_chk",
      sql`
        (${tbl.scope} = 'global'    AND ${tbl.cityId} IS NULL  AND ${tbl.shopTypeSlug} IS NULL) OR
        (${tbl.scope} = 'city'      AND ${tbl.cityId} IS NOT NULL) OR
        (${tbl.scope} = 'shop_type' AND ${tbl.shopTypeSlug} IS NOT NULL)
      `,
    ),
  ],
);

// Platform config change history (audit trail for config changes)
export const platformConfigHistoryTable = table(
  "platform_config_history",
  {
    id: t.bigint("id", { mode: "bigint" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),

    configId: t
      .uuid("config_id")
      .notNull()
      .references(() => platformConfigTable.id, { onDelete: "cascade" }),

    configKey: t.varchar("config_key", { length: 200 }).notNull(),
    previousValue: t.text("previous_value"),
    newValue: t.text("new_value").notNull(),

    changedBy: t
      .uuid("changed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    changeReason: t.text("change_reason"),

    changedAt: t
      .timestamp("changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("platform_config_history_config_idx")
      .on(tbl.configId, tbl.changedAt),
  ],
);

// =============================================================================
// FEATURE FLAG OVERRIDES
// =============================================================================

export const featureFlagOverridesTable = table(
  "feature_flag_overrides",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    // The feature flag key  e.g. "cod_enabled" | "surge_pricing" | "live_tracking"
    flagKey: t.varchar("flag_key", { length: 100 }).notNull(),

    // Who this override applies to
    // Exactly one scope column must be non-null
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "cascade" }),
    shopId: t
      .uuid("shop_id")
      .references(() => shopsTable.id, { onDelete: "cascade" }),
    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "cascade" }),

    isEnabled: t.boolean("is_enabled").notNull(),

    reason: t.text("reason"),

    // Auto-expire this override at a given time
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

    createdBy: t
      .uuid("created_by")
      .references(() => userTable.id, { onDelete: "set null" }),

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
      .uniqueIndex("feature_flag_overrides_city_uq_idx")
      .on(tbl.flagKey, tbl.cityId)
      .where(sql`city_id IS NOT NULL`),
    t
      .uniqueIndex("feature_flag_overrides_shop_uq_idx")
      .on(tbl.flagKey, tbl.shopId)
      .where(sql`shop_id IS NOT NULL`),
    t
      .uniqueIndex("feature_flag_overrides_user_uq_idx")
      .on(tbl.flagKey, tbl.userId)
      .where(sql`user_id IS NOT NULL`),

    t.index("feature_flag_overrides_flag_idx").on(tbl.flagKey),
    t
      .index("feature_flag_overrides_expiry_idx")
      .on(tbl.expiresAt)
      .where(sql`expires_at IS NOT NULL`),

    // Exactly one scope anchor must be set
    t.check(
      "feature_flag_overrides_single_scope_chk",
      sql`
        (${tbl.cityId} IS NOT NULL)::int +
        (${tbl.shopId} IS NOT NULL)::int +
        (${tbl.userId} IS NOT NULL)::int = 1
      `,
    ),
  ],
);

// =============================================================================
// MAINTENANCE WINDOWS
// =============================================================================

export const maintenanceWindowsTable = table(
  "maintenance_windows",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    title: t.varchar("title", { length: 255 }).notNull(),
    description: t.text("description"),

    // Affects the entire platform or specific services
    affectedServices: t.jsonb("affected_services").$type<string[]>(),
    // e.g. ["payments", "delivery_dispatch", "search"]

    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "set null" }),
    // null = platform-wide

    scheduledStart: t.timestamp("scheduled_start", {
      withTimezone: true,
    }).notNull(),
    scheduledEnd: t.timestamp("scheduled_end", { withTimezone: true }).notNull(),
    actualStart: t.timestamp("actual_start", { withTimezone: true }),
    actualEnd: t.timestamp("actual_end", { withTimezone: true }),

    status: maintenanceStatusEnum("status")
      .notNull()
      .default("scheduled"),

    // Message shown to users during the window
    customerMessage: t.text("customer_message"),
    shopOwnerMessage: t.text("shop_owner_message"),

    createdBy: t
      .uuid("created_by")
      .references(() => userTable.id, { onDelete: "set null" }),

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
      .index("maintenance_windows_schedule_idx")
      .on(tbl.scheduledStart, tbl.status),
    t
      .index("maintenance_windows_active_idx")
      .on(tbl.status)
      .where(sql`status IN ('scheduled', 'in_progress')`),

    t.check(
      "maintenance_windows_schedule_chk",
      sql`${tbl.scheduledEnd} > ${tbl.scheduledStart}`,
    ),
  ],
);

// =============================================================================
// PLATFORM SEARCH LOG
// =============================================================================

export const platformSearchLogTable = table(
  "platform_search_log",
  {
    id: t.bigint("id", { mode: "bigint" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    sessionId: t.varchar("session_id", { length: 255 }).notNull(),

    // Raw search term as the user typed it
    searchTerm: t.varchar("search_term", { length: 500 }).notNull(),
    normalizedTerm: t.varchar("normalized_term", { length: 500 }),
    // lowercased, trimmed, stop-words removed

    intent: platformSearchIntentEnum("intent").notNull().default("browse"),

    // User's location at search time
    userLocation: geographyPoint("user_location"),
    userLat: t.doublePrecision("user_lat"),
    userLng: t.doublePrecision("user_lng"),
    userPincode: t.varchar("user_pincode", { length: 10 }),
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "set null" }),

    // Search radius applied (metres)
    radiusMetres: t.integer("radius_metres"),

    // Results returned
    shopResultsCount: t.integer("shop_results_count").default(0).notNull(),
    productResultsCount: t.integer("product_results_count").default(0).notNull(),
    hasResults: t.boolean("has_results").notNull(),

    // Applied filters
    filtersApplied: t.jsonb("filters_applied").$type<{
      shopTypeSlug?: string;
      preCategorySlug?: string;
      openNow?: boolean;
      minRating?: number;
      sortBy?: string;
    }>(),

    // User behaviour after search
    // Which result they tapped (if any)
    clickedShopId: t
      .uuid("clicked_shop_id")
      .references(() => shopsTable.id, { onDelete: "set null" }),
    clickedProductId: t
      .uuid("clicked_product_id")
      .references(() => masterProductTable.id, { onDelete: "set null" }),
    clickPosition: t.smallint("click_position"),
    // Position in result list the user tapped (1-based)

    resultedInOrder: t.boolean("resulted_in_order").default(false).notNull(),
    orderId: t
      .uuid("order_id")
      .references(() => ordersTable.id, { onDelete: "set null" }),

    // Device
    deviceType: t.varchar("device_type", { length: 20 }),
    platform: t.varchar("platform", { length: 20 }),
    // android | ios | web

    searchedAt: t
      .timestamp("searched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("platform_search_log_user_idx").on(tbl.userId, tbl.searchedAt),
    t.index("platform_search_log_city_idx").on(tbl.cityId, tbl.searchedAt),
    t
      .index("platform_search_log_term_idx")
      .on(tbl.normalizedTerm, tbl.searchedAt),
    t
      .index("platform_search_log_no_results_idx")
      .on(tbl.cityId, tbl.normalizedTerm)
      .where(sql`has_results = false`),
    t
      .index("platform_search_log_intent_idx")
      .on(tbl.intent, tbl.searchedAt),
  ],
);

// =============================================================================
// PLATFORM SEARCH ANALYTICS (daily roll-up)
// =============================================================================

export const platformSearchAnalyticsTable = table(
  "platform_search_analytics",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    date: t.date("date").notNull(),
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "cascade" }),
    // null = platform-wide

    // Volume
    totalSearches: t.integer("total_searches").default(0).notNull(),
    uniqueSearchers: t.integer("unique_searchers").default(0).notNull(),
    searchesWithResults: t.integer("searches_with_results").default(0).notNull(),
    searchesWithoutResults: t
      .integer("searches_without_results")
      .default(0)
      .notNull(),

    // Intent breakdown
    findShopSearches: t.integer("find_shop_searches").default(0).notNull(),
    findProductSearches: t
      .integer("find_product_searches")
      .default(0)
      .notNull(),

    // Engagement
    searchesToClick: t.integer("searches_to_click").default(0).notNull(),
    searchesToOrder: t.integer("searches_to_order").default(0).notNull(),
    clickThroughRate: t.decimal("click_through_rate", {
      precision: 5,
      scale: 2,
    }),
    searchConversionRate: t.decimal("search_conversion_rate", {
      precision: 5,
      scale: 2,
    }),

    // Top queries with no results (JSON snapshot — top 20)
    topZeroResultQueries: t.jsonb("top_zero_result_queries").$type<
      { term: string; count: number }[]
    >(),

    // Top searched terms (JSON snapshot — top 20)
    topSearchTerms: t.jsonb("top_search_terms").$type<
      { term: string; count: number; conversionRate: number }[]
    >(),

    calculatedAt: t
      .timestamp("calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("platform_search_analytics_date_city_uq_idx")
      .on(tbl.date, tbl.cityId),

    t.index("platform_search_analytics_date_idx").on(tbl.date),
  ],
);

// =============================================================================
// NEARBY SHOP RESULTS CACHE
// =============================================================================

export const nearbyShopCacheTable = table(
  "nearby_shop_cache",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    serviceablePincodeId: t
      .uuid("serviceable_pincode_id")
      .notNull()
      .references(() => serviceablePincodesTable.id, { onDelete: "cascade" }),

    pincode: t.varchar("pincode", { length: 10 }).notNull(),
    // Denormalised for fast lookup

    cityId: t
      .uuid("city_id")
      .notNull()
      .references(() => citiesTable.id, { onDelete: "cascade" }),

    // Ordered list of shops available from this pincode
    // Sorted by: distance ASC, then rating DESC
    shops: t
      .jsonb("shops")
      .$type<
        {
          shopId: string;
          shopName: string;
          shopTypeSlug: string;
          logoKey: string | null;
          distanceMetres: number;
          ratingAvg: number;      // ratingSum / ratingCount
          isOpen: boolean;
          deliveryLeadTimeMins: number | null;
        }[]
      >()
      .notNull(),

    totalShopsCount: t.integer("total_shops_count").notNull(),

    // When this cache was last rebuilt
    generatedAt: t
      .timestamp("generated_at", { withTimezone: true })
      .notNull(),

    // Cache is stale after this time — background job will regenerate
    expiresAt: t
      .timestamp("expires_at", { withTimezone: true })
      .notNull(),

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
    // One cache entry per pincode
    t
      .uniqueIndex("nearby_shop_cache_pincode_uq_idx")
      .on(tbl.serviceablePincodeId),

    t.index("nearby_shop_cache_city_idx").on(tbl.cityId),
    t
      .index("nearby_shop_cache_expired_idx")
      .on(tbl.expiresAt)
      .where(sql`expires_at IS NOT NULL`),
  ],
);

// =============================================================================
// SHOP ONBOARDING CHECKLIST
// =============================================================================

export const shopOnboardingChecklistTable = table(
  "shop_onboarding_checklist",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    step: onboardingStepEnum("step").notNull(),
    status: onboardingStepStatusEnum("status").notNull().default("pending"),

    // When the step was first attempted and when it was completed
    startedAt: t.timestamp("started_at", { withTimezone: true }),
    completedAt: t.timestamp("completed_at", { withTimezone: true }),

    // For steps that can fail — reason and retry count
    failureReason: t.varchar("failure_reason", { length: 500 }),
    retryCount: t.smallint("retry_count").default(0).notNull(),

    // Admin note (e.g. "KYC document was blurry, re-uploaded")
    adminNote: t.text("admin_note"),

    // Which entity was created / verified at this step
    // e.g. for bank_account step → bankAccountId
    referenceId: t.uuid("reference_id"),

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
    // One row per shop per step
    t
      .uniqueIndex("shop_onboarding_checklist_shop_step_uq_idx")
      .on(tbl.shopId, tbl.step),

    t.index("shop_onboarding_checklist_shop_idx").on(tbl.shopId, tbl.status),

    // Admin dashboard: "shops stuck in onboarding"
    t
      .index("shop_onboarding_checklist_incomplete_idx")
      .on(tbl.step, tbl.status)
      .where(sql`status NOT IN ('completed', 'skipped')`),

    t.check(
      "shop_onboarding_checklist_retry_chk",
      sql`${tbl.retryCount} >= 0`,
    ),
  ],
);

// =============================================================================
// SHOP VERIFICATION QUEUE
// =============================================================================

export const shopVerificationQueueTable = table(
  "shop_verification_queue",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    // Which admin is handling this review (null = unassigned)
    assignedTo: t
      .uuid("assigned_to")
      .references(() => userTable.id, { onDelete: "set null" }),
    assignedAt: t.timestamp("assigned_at", { withTimezone: true }),

    status: shopVerificationQueueStatusEnum("status")
      .notNull()
      .default("submitted"),

    // Priority — higher = reviewed first
    priority: t.smallint("priority").default(0).notNull(),

    // Checklist items the reviewer must confirm
    reviewChecklist: t
      .jsonb("review_checklist")
      .$type<
        {
          item: string;         // e.g. "GST certificate matches business name"
          isChecked: boolean;
          checkedBy?: string;   // adminId
          checkedAt?: string;   // ISO timestamp
          note?: string;
        }[]
      >(),

    // Reviewer's overall notes
    reviewerNotes: t.text("reviewer_notes"),

    // Changes requested from the shop owner (if status = requires_changes)
    changesRequested: t.text("changes_requested"),

    // Rejection reason (if status = rejected)
    rejectionReason: t.varchar("rejection_reason", { length: 500 }),

    submittedAt: t
      .timestamp("submitted_at", { withTimezone: true })
      .notNull(),
    reviewStartedAt: t.timestamp("review_started_at", { withTimezone: true }),
    reviewCompletedAt: t.timestamp("review_completed_at", {
      withTimezone: true,
    }),

    // SLA deadline (e.g. 48 hours after submission)
    slaDeadline: t.timestamp("sla_deadline", { withTimezone: true }),
    isSlaBreached: t.boolean("is_sla_breached").default(false).notNull(),

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
    // One active review per shop at a time
    t
      .uniqueIndex("shop_verification_queue_shop_active_uq_idx")
      .on(tbl.shopId)
      .where(
        sql`status NOT IN ('approved', 'rejected')`,
      ),

    t
      .index("shop_verification_queue_status_idx")
      .on(tbl.status, tbl.priority, tbl.submittedAt),
    t
      .index("shop_verification_queue_assigned_idx")
      .on(tbl.assignedTo, tbl.status),
    t
      .index("shop_verification_queue_sla_idx")
      .on(tbl.slaDeadline)
      .where(sql`is_sla_breached = false AND sla_deadline IS NOT NULL`),
  ],
);

// =============================================================================
// SHOP VERIFICATION HISTORY (append-only)
// =============================================================================

export const shopVerificationHistoryTable = table(
  "shop_verification_history",
  {
    id: t.bigint("id", { mode: "bigint" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),

    queueId: t
      .uuid("queue_id")
      .notNull()
      .references(() => shopVerificationQueueTable.id, { onDelete: "cascade" }),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    previousStatus: shopVerificationQueueStatusEnum("previous_status"),
    newStatus: shopVerificationQueueStatusEnum("new_status").notNull(),

    changedBy: t
      .uuid("changed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    note: t.text("note"),

    changedAt: t
      .timestamp("changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("shop_verification_history_queue_idx")
      .on(tbl.queueId, tbl.changedAt),
    t.index("shop_verification_history_shop_idx").on(tbl.shopId, tbl.changedAt),
  ],
);

// =============================================================================
// SUPPORT CATEGORIES
// =============================================================================

export const supportCategoriesTable = table(
  "support_categories",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 150 }).notNull(),
    slug: t.varchar("slug", { length: 180 }).notNull(),
    description: t.text("description"),

    // Self-referential — sub-categories
    parentId: t.uuid("parent_id"),

    // Who can raise a ticket in this category
    applicableTo: t.jsonb("applicable_to").$type<string[]>().notNull(),
    // e.g. ["customer", "shop_owner", "delivery_partner"]

    // Default assignee team
    defaultAssigneeTeam: t.varchar("default_assignee_team", { length: 100 }),
    // e.g. "payments_team" | "kyc_team" | "delivery_ops"

    defaultPriority: supportTicketPriorityEnum("default_priority")
      .notNull()
      .default("medium"),

    // SLA in hours for first response and resolution
    firstResponseSlaHours: t.smallint("first_response_sla_hours")
      .default(4)
      .notNull(),
    resolutionSlaHours: t.smallint("resolution_sla_hours")
      .default(48)
      .notNull(),

    isActive: t.boolean("is_active").default(true).notNull(),
    displayOrder: t.smallint("display_order").default(0).notNull(),

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
    t.foreignKey({
      name: "support_categories_parent_fk",
      columns: [tbl.parentId],
      foreignColumns: [tbl.id],
    }),

    t.uniqueIndex("support_categories_slug_uq_idx").on(tbl.slug),
    t.index("support_categories_parent_idx").on(tbl.parentId, tbl.isActive),
  ],
);

// =============================================================================
// SUPPORT TICKETS
// =============================================================================

export const supportTicketsTable = table(
  "support_tickets",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    // Human-readable reference  e.g. "TKT-2024-009871"
    ticketNumber: t.varchar("ticket_number", { length: 50 }).notNull(),

    // Who raised the ticket
    raisedById: t
      .uuid("raised_by_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    raisedByType: supportActorTypeEnum("raised_by_type").notNull(),

    // Context
    categoryId: t
      .uuid("category_id")
      .references(() => supportCategoriesTable.id, { onDelete: "set null" }),

    shopId: t
      .uuid("shop_id")
      .references(() => shopsTable.id, { onDelete: "set null" }),
    // Set when the ticket is about a specific shop

    // Related entity  (polymorphic)
    contextType: t.varchar("context_type", { length: 50 }),
    // "order" | "delivery_task" | "payment" | "kyc" | "refund" | "payout"
    contextId: t.uuid("context_id"),

    // Ticket content
    subject: t.varchar("subject", { length: 500 }).notNull(),
    description: t.text("description").notNull(),

    // Classification
    status: supportTicketStatusEnum("status").notNull().default("open"),
    priority: supportTicketPriorityEnum("priority").notNull().default("medium"),

    // Assignment
    assignedTo: t
      .uuid("assigned_to")
      .references(() => userTable.id, { onDelete: "set null" }),
    assignedTeam: t.varchar("assigned_team", { length: 100 }),
    assignedAt: t.timestamp("assigned_at", { withTimezone: true }),

    // SLA
    firstResponseSlaAt: t.timestamp("first_response_sla_at", {
      withTimezone: true,
    }),
    resolutionSlaAt: t.timestamp("resolution_sla_at", { withTimezone: true }),
    firstResponseAt: t.timestamp("first_response_at", { withTimezone: true }),
    resolvedAt: t.timestamp("resolved_at", { withTimezone: true }),
    closedAt: t.timestamp("closed_at", { withTimezone: true }),

    isFirstResponseBreached: t
      .boolean("is_first_response_breached")
      .default(false)
      .notNull(),
    isResolutionBreached: t
      .boolean("is_resolution_breached")
      .default(false)
      .notNull(),

    // Resolution
    resolutionSummary: t.text("resolution_summary"),
    internalNotes: t.text("internal_notes"),

    // Customer satisfaction
    csatScore: t.smallint("csat_score"),
    // 1–5, filled by customer after resolution
    csatComment: t.text("csat_comment"),
    csatSubmittedAt: t.timestamp("csat_submitted_at", { withTimezone: true }),

    // Reopen tracking
    reopenCount: t.smallint("reopen_count").default(0).notNull(),
    lastReopenedAt: t.timestamp("last_reopened_at", { withTimezone: true }),

    tags: t.jsonb("tags").$type<string[]>(),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

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
    t.uniqueIndex("support_tickets_number_uq_idx").on(tbl.ticketNumber),

    t.index("support_tickets_raised_by_idx").on(tbl.raisedById, tbl.createdAt),
    t.index("support_tickets_status_idx").on(tbl.status, tbl.priority),
    t.index("support_tickets_assigned_idx").on(tbl.assignedTo, tbl.status),
    t.index("support_tickets_shop_idx").on(tbl.shopId, tbl.createdAt),
    t.index("support_tickets_context_idx").on(tbl.contextType, tbl.contextId),

    t
      .index("support_tickets_sla_breach_idx")
      .on(tbl.resolutionSlaAt, tbl.status)
      .where(
        sql`status NOT IN ('resolved', 'closed') AND resolution_sla_at IS NOT NULL`,
      ),

    t.check(
      "support_tickets_csat_chk",
      sql`${tbl.csatScore} IS NULL OR (${tbl.csatScore} >= 1 AND ${tbl.csatScore} <= 5)`,
    ),
    t.check(
      "support_tickets_reopen_chk",
      sql`${tbl.reopenCount} >= 0`,
    ),
  ],
);

// =============================================================================
// SUPPORT TICKET MESSAGES (append-only)
// =============================================================================

export const supportTicketMessagesTable = table(
  "support_ticket_messages",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    ticketId: t
      .uuid("ticket_id")
      .notNull()
      .references(() => supportTicketsTable.id, { onDelete: "cascade" }),

    authorId: t
      .uuid("author_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    authorType: supportActorTypeEnum("author_type").notNull(),
    authorName: t.varchar("author_name", { length: 255 }),
    // Snapshotted in case account is deleted

    body: t.text("body").notNull(),

    // Internal note — not visible to the customer
    isInternal: t.boolean("is_internal").default(false).notNull(),

    // Attachments (object-store keys)
    attachmentKeys: t.jsonb("attachment_keys").$type<
      { key: string; filename: string; mimeType: string; sizeBytes: number }[]
    >(),

    // Was this message from an automated bot / AI?
    isAutomated: t.boolean("is_automated").default(false).notNull(),

    // Status change that happened with this message (if any)
    statusChangedTo: supportTicketStatusEnum("status_changed_to"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("support_ticket_messages_ticket_idx")
      .on(tbl.ticketId, tbl.createdAt),
    t.index("support_ticket_messages_author_idx").on(tbl.authorId),
  ],
);

// =============================================================================
// PLATFORM ANNOUNCEMENTS
// =============================================================================

export const platformAnnouncementsTable = table(
  "platform_announcements",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    title: t.varchar("title", { length: 255 }).notNull(),
    message: t.text("message").notNull(),

    target: platformAnnouncementTargetEnum("target").notNull(),

    // City scope (for city_* targets)
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "cascade" }),

    // Specific shops (for specific_shops target)
    targetShopIds: t.jsonb("target_shop_ids").$type<string[]>(),

    // Rich content
    imageKey: t.varchar("image_key", { length: 500 }),
    ctaText: t.varchar("cta_text", { length: 100 }),
    ctaUrl: t.varchar("cta_url", { length: 500 }),

    announcementType: platformAnnouncementTypeEnum("announcement_type")
      .notNull()
      .default("general"),

    priority: t.smallint("priority").default(0).notNull(),

    isPublished: t.boolean("is_published").default(false).notNull(),
    publishedAt: t.timestamp("published_at", { withTimezone: true }),
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

    // Trigger a push notification to the target audience?
    sendPushNotification: t
      .boolean("send_push_notification")
      .default(false)
      .notNull(),
    pushSentAt: t.timestamp("push_sent_at", { withTimezone: true }),

    // Engagement counters
    viewCount: t.integer("view_count").default(0).notNull(),
    clickCount: t.integer("click_count").default(0).notNull(),

    createdBy: t
      .uuid("created_by")
      .references(() => userTable.id, { onDelete: "set null" }),

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
      .index("platform_announcements_target_idx")
      .on(tbl.target, tbl.isPublished),
    t
      .index("platform_announcements_city_idx")
      .on(tbl.cityId, tbl.isPublished),
    t
      .index("platform_announcements_active_idx")
      .on(tbl.isPublished, tbl.expiresAt)
      .where(sql`is_published = true`),

    t.check(
      "platform_announcements_city_scope_chk",
      sql`${tbl.target}::text NOT LIKE 'city_%' OR ${tbl.cityId} IS NOT NULL`,
    ),
    t.check(
      "platform_announcements_expiry_chk",
      sql`
        ${tbl.expiresAt} IS NULL OR
        ${tbl.publishedAt} IS NULL OR
        ${tbl.expiresAt} > ${tbl.publishedAt}
      `,
    ),
  ],
);

// =============================================================================
// STATIC PAGES
// =============================================================================

export const staticPagesTable = table(
  "static_pages",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    slug: t.varchar("slug", { length: 200 }).notNull(),
    // e.g. "terms-of-service" | "privacy-policy" | "how-it-works"

    title: t.varchar("title", { length: 255 }).notNull(),
    metaDescription: t.varchar("meta_description", { length: 500 }),

    // Content stored as Markdown (rendered to HTML by the client)
    contentMarkdown: t.text("content_markdown").notNull(),

    // Versioning
    version: t.integer("version").default(1).notNull(),
    publishedVersion: t.integer("published_version"),

    // Audience
    target: staticPageTargetEnum("target")
      .notNull()
      .default("all"),

    isPublished: t.boolean("is_published").default(false).notNull(),
    publishedAt: t.timestamp("published_at", { withTimezone: true }),

    lastUpdatedBy: t
      .uuid("last_updated_by")
      .references(() => userTable.id, { onDelete: "set null" }),

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
    t.uniqueIndex("static_pages_slug_uq_idx").on(tbl.slug),
    t.index("static_pages_published_idx").on(tbl.isPublished, tbl.target),

    t.check(
      "static_pages_version_chk",
      sql`${tbl.version} > 0`,
    ),
  ],
);

// =============================================================================
// FAQs
// =============================================================================

export const faqsTable = table(
  "faqs",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    categorySlug: t.varchar("category_slug", { length: 100 }).notNull(),
    // e.g. "ordering" | "payments" | "delivery" | "shop_setup" | "kyc"

    question: t.text("question").notNull(),
    answer: t.text("answer").notNull(),

    // Who this FAQ is for
    target: faqTargetEnum("target")
      .notNull()
      .default("all"),

    displayOrder: t.smallint("display_order").default(0).notNull(),
    isPublished: t.boolean("is_published").default(true).notNull(),
    isFeatured: t.boolean("is_featured").default(false).notNull(),

    // Helpfulness votes
    helpfulCount: t.integer("helpful_count").default(0).notNull(),
    notHelpfulCount: t.integer("not_helpful_count").default(0).notNull(),

    viewCount: t.integer("view_count").default(0).notNull(),

    createdBy: t
      .uuid("created_by")
      .references(() => userTable.id, { onDelete: "set null" }),

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
    t.index("faqs_category_target_idx").on(
      tbl.categorySlug,
      tbl.target,
      tbl.isPublished,
    ),
    t.index("faqs_featured_idx").on(tbl.isFeatured, tbl.target),
  ],
);

// =============================================================================
// DELIVERY PARTNER ONBOARDING CHECKLIST
// =============================================================================

export const dpOnboardingChecklistTable = table(
  "dp_onboarding_checklist",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    // FK to deliveryPartnerProfileTable.userId
    partnerUserId: t
      .uuid("partner_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    step: dpOnboardingStepEnum("step").notNull(),

    status: onboardingStepStatusEnum("status").notNull().default("pending"),

    startedAt: t.timestamp("started_at", { withTimezone: true }),
    completedAt: t.timestamp("completed_at", { withTimezone: true }),

    failureReason: t.varchar("failure_reason", { length: 500 }),
    retryCount: t.smallint("retry_count").default(0).notNull(),
    adminNote: t.text("admin_note"),
    referenceId: t.uuid("reference_id"),

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
      .uniqueIndex("dp_onboarding_checklist_partner_step_uq_idx")
      .on(tbl.partnerUserId, tbl.step),

    t.index("dp_onboarding_checklist_partner_idx").on(
      tbl.partnerUserId,
      tbl.status,
    ),
  ],
);

// =============================================================================
// DELIVERY PARTNER APPLICATION
// =============================================================================

export const deliveryPartnerApplicationsTable = table(
  "delivery_partner_applications",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    // The user account that was created at the start of the application
    applicantUserId: t
      .uuid("applicant_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "set null" }),

    status: dpApplicationStatusEnum("status").notNull().default("draft"),

    // Personal details collected during the application flow
    vehicleType: t.varchar("vehicle_type", { length: 50 }),
    vehicleNumber: t.varchar("vehicle_number", { length: 20 }),
    licenseNumber: t.varchar("license_number", { length: 20 }),
    licenseExpiryDate: t.date("license_expiry_date"),

    // Referral (if the applicant was referred by another partner)
    referredByPartnerId: t.uuid("referred_by_partner_id"),

    // Review
    assignedTo: t
      .uuid("assigned_to")
      .references(() => userTable.id, { onDelete: "set null" }),
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: t.text("review_notes"),
    rejectionReason: t.varchar("rejection_reason", { length: 500 }),
    changesRequested: t.text("changes_requested"),

    submittedAt: t.timestamp("submitted_at", { withTimezone: true }),
    approvedAt: t.timestamp("approved_at", { withTimezone: true }),
    rejectedAt: t.timestamp("rejected_at", { withTimezone: true }),

    // After approval the delivery partner profile is created
    // deliveryPartnerProfileId will be set here when the profile is created
    deliveryPartnerProfileId: t.uuid("delivery_partner_profile_id"),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

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
      .index("dp_applications_applicant_idx")
      .on(tbl.applicantUserId, tbl.createdAt),
    t.index("dp_applications_status_idx").on(tbl.status, tbl.createdAt),
    t.index("dp_applications_city_idx").on(tbl.cityId, tbl.status),

    // Only one active application per user at a time
    t
      .uniqueIndex("dp_applications_applicant_active_uq_idx")
      .on(tbl.applicantUserId)
      .where(
        sql`status NOT IN ('approved', 'rejected')`,
      ),
  ],
);

// =============================================================================
// PLATFORM HEALTH METRICS (daily roll-up)
// =============================================================================

export const platformHealthMetricsTable = table(
  "platform_health_metrics",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    date: t.date("date").notNull(),
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "cascade" }),
    // null = platform-wide

    // ── Supply ────────────────────────────────────────────────────────────
    activeShopsCount: t.integer("active_shops_count").default(0).notNull(),
    // Shops that received at least one order today

    onlinePartnersCount: t.integer("online_partners_count").default(0).notNull(),
    // Peak concurrent delivery partners online

    avgPartnerOnlineHours: t.decimal("avg_partner_online_hours", {
      precision: 6,
      scale: 2,
    }),

    // ── Demand ────────────────────────────────────────────────────────────
    dailyActiveUsers: t.integer("daily_active_users").default(0).notNull(),
    newUsersToday: t.integer("new_users_today").default(0).notNull(),
    newShopsApprovedToday: t
      .integer("new_shops_approved_today")
      .default(0)
      .notNull(),
    newPartnersApprovedToday: t
      .integer("new_partners_approved_today")
      .default(0)
      .notNull(),

    // ── Order health ──────────────────────────────────────────────────────
    ordersPlaced: t.integer("orders_placed").default(0).notNull(),
    ordersDelivered: t.integer("orders_delivered").default(0).notNull(),
    ordersCancelled: t.integer("orders_cancelled").default(0).notNull(),
    ordersFailedPayment: t.integer("orders_failed_payment").default(0).notNull(),

    deliverySuccessRate: t.decimal("delivery_success_rate", {
      precision: 5,
      scale: 2,
    }),
    avgDeliveryTimeMins: t.decimal("avg_delivery_time_mins", {
      precision: 8,
      scale: 2,
    }),

    // ── SLA health ────────────────────────────────────────────────────────
    slaBreachCount: t.integer("sla_breach_count").default(0).notNull(),
    onTimeDeliveryRate: t.decimal("on_time_delivery_rate", {
      precision: 5,
      scale: 2,
    }),

    // ── Platform revenue (paise) ──────────────────────────────────────────
    gmvPaise: t.bigint("gmv_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    netPlatformRevenuePaise: t
      .bigint("net_platform_revenue_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    // ── Support health ────────────────────────────────────────────────────
    openTicketsCount: t.integer("open_tickets_count").default(0).notNull(),
    ticketsOpenedToday: t.integer("tickets_opened_today").default(0).notNull(),
    ticketsResolvedToday: t
      .integer("tickets_resolved_today")
      .default(0)
      .notNull(),
    avgFirstResponseMins: t.decimal("avg_first_response_mins", {
      precision: 8,
      scale: 2,
    }),

    // ── Search health ─────────────────────────────────────────────────────
    platformSearchCount: t.integer("platform_search_count").default(0).notNull(),
    searchNoResultRate: t.decimal("search_no_result_rate", {
      precision: 5,
      scale: 2,
    }),

    // ── Infrastructure ────────────────────────────────────────────────────
    apiP99LatencyMs: t.integer("api_p99_latency_ms"),
    apiErrorRate: t.decimal("api_error_rate", { precision: 5, scale: 2 }),
    // As a fraction 0.00–1.00

    calculatedAt: t
      .timestamp("calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("platform_health_metrics_date_city_uq_idx")
      .on(tbl.date, tbl.cityId),

    t.index("platform_health_metrics_date_idx").on(tbl.date),
  ],
);
