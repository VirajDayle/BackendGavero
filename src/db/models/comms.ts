import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userTable } from "./auth";
import { shopsTable } from "./shop";
import { citiesTable } from "./location";
import {
  notificationChannelEnum,
  notificationCategoryEnum,
  notificationStatusEnum,
  templateEngineEnum,
  batchStatusEnum,
  notifInteractionTypeEnum,
  campaignStatusEnum,
  campaignTypeEnum,
  audienceSegmentTypeEnum,
  audienceMemberSendStatusEnum,
  bannerPlacementEnum,
  bannerMediaTypeEnum,
  bannerEventTypeEnum,
  popupTriggerEnum,
  popupEventTypeEnum,
  systemEventLevelEnum,
  systemEventCategoryEnum,
  httpMethodEnum,
  webhookDirectionEnum,
  jobStatusEnum,
  exportStatusEnum,
  auditActorTypeEnum,
  auditOperationEnum,
  consentTypeEnum,
  consentActionEnum,
  dataDeletionStageEnum,
  loginEventTypeEnum,
  loginAuthMethodEnum,
  devicePlatformEnum,
  permissionChangeOperationEnum,
} from "../shared/enums";

// =============================================================================
// COMMUNICATION & NOTIFICATION MODEL
//
// Covers:
//   ── NOTIFICATIONS ──────────────────────────────────────────────────────────
//   1.  Notification Templates   (reusable content with placeholders)
//   2.  Notification Batches     (grouping notifications for bulk sending)
//   3.  Notifications            (the core notification record)
//   4.  Notification Preferences (user settings for what they want to receive)
//   5.  Notification Interactions (clicks, opens, conversions)
//   6.  Notification Devices     (push tokens for iOS/Android/Web)
//
//   ── CAMPAIGNS & PROMOTIONS ────────────────────────────────────────────────
//   7.  Promotion Campaigns      (marketing blasts, AB tests, drips)
//   8.  Campaign Variants        (different content/channels for AB tests)
//   9.  Campaign Audiences       (dynamic/static segments of users)
//   10. Campaign Audience Members (individual users in a campaign)
//   11. Coupon Assignments       (which users have which coupons)
//   12. Referral Logs            (tracking referral signups and rewards)
//
//   ── IN-APP UI (BANNERS & POPUPS) ──────────────────────────────────────────
//   13. Banners                  (static/dynamic images on home/search pages)
//   14. Banner Impressions       (tracking banner visibility and clicks)
//   15. Shop Banner Assignments  (banners specifically for a shop page)
//   16. In-App Popups            (modals triggered by user actions)
//   17. Pop-up Interactions      (tracking popup clicks and dismissals)
//   18. Referral Campaign Config (rules for referral rewards)
//
//   ── LOGS & AUDIT (append-only) ─────────────────────────────────────────────
//   19. System Event Log         (internal server notifications and alerts)
//   20. API Request Log          (incoming requests for audit/troubleshooting)
//   21. Background Job Log       (status of cron/worker tasks)
//   22. Webhook Log              (inbound/outbound webhook activity)
//   23. Error Log                (centralised crash/error reporting)
//   24. Data Export Log          (tracking when users/admins export PII)
//   25. Audit Log                (tracking all create/update/delete actions)
//   26. Admin Action Log         (tracking administrative changes)
//
//   ── COMPLIANCE & PRIVACY ──────────────────────────────────────────────────
//   27. Consent Log              (GDPR/PDPA/DPDP record of user consents)
//   28. Data Deletion Log        (tracking right-to-erasure requests)
//   29. Login Audit              (tracking all authentication events)
//   30. Permission Change Log    (tracking role/permission grants/revocations)
//
// =============================================================================

// =============================================================================
// SECTION 1 — NOTIFICATION TEMPLATES
// Reusable skeletons for messages.
// Placeholders are in Handlebars / Mustache format: {{customer_name}}, {{order_id}}.
// =============================================================================

export const notificationTemplatesTable = table(
  "notification_templates",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    slug: t.varchar("slug", { length: 150 }).notNull(),
    // e.g. "order_confirmed_push", "otp_sms_v2"
    name: t.varchar("name", { length: 255 }).notNull(),
    description: t.text("description"),

    category: notificationCategoryEnum("category").notNull(),
    channel: notificationChannelEnum("channel").notNull(),

    // Content engine
    engine: templateEngineEnum("engine").notNull().default("handlebars"),

    // Subject/Title (can contain placeholders)
    titleTemplate: t.varchar("title_template", { length: 500 }),
    // Body content (plain text or markdown or HTML)
    bodyTemplate: t.text("body_template").notNull(),

    // Action/Deep Link (where the user goes when they click the notification)
    deepLinkTemplate: t.text("deep_link_template"),

    // Image/Icon (if applicable for push/in-app)
    imageUrlTemplate: t.text("image_url_template"),

    // Default priority for messages using this template (0-100)
    defaultPriority: t.integer("default_priority").default(50).notNull(),

    isActive: t.boolean("is_active").default(true).notNull(),

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
    t.uniqueIndex("notif_templates_slug_uq_idx").on(tbl.slug),
    t.index("notif_templates_category_idx").on(tbl.category, tbl.channel),
  ],
);

// =============================================================================
// SECTION 2 — NOTIFICATION BATCHES
// Groups multiple notifications (e.g. for a campaign or a major announcement).
// Allows tracking overall progress of a bulk send.
// =============================================================================

export const notificationBatchesTable = table(
  "notification_batches",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 255 }),
    campaignId: t.uuid("campaign_id"),
    // Forward reference to promotionCampaignsTable

    status: batchStatusEnum("status").notNull().default("preparing"),

    totalCount: t.integer("total_count").default(0).notNull(),
    sentCount: t.integer("sent_count").default(0).notNull(),
    failedCount: t.integer("failed_count").default(0).notNull(),

    startedAt: t.timestamp("started_at", { withTimezone: true }),
    completedAt: t.timestamp("completed_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [t.index("notif_batches_campaign_idx").on(tbl.campaignId)],
);

// =============================================================================
// SECTION 3 — NOTIFICATIONS
// Real-world messages sent to users.
// =============================================================================

export const notificationsTable = table(
  "notifications",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    templateId: t
      .uuid("template_id")
      .references(() => notificationTemplatesTable.id, {
        onDelete: "set null",
      }),

    batchId: t.uuid("batch_id").references(() => notificationBatchesTable.id, {
      onDelete: "set null",
    }),

    category: notificationCategoryEnum("category").notNull(),
    channel: notificationChannelEnum("channel").notNull(),

    // Final rendered content
    title: t.varchar("title", { length: 500 }),
    body: t.text("body").notNull(),
    deepLink: t.text("deep_link"),
    imageUrl: t.text("image_url"),

    // Context (JSON of data used to render the template)
    context: t.jsonb("context").$type<Record<string, unknown>>(),

    status: notificationStatusEnum("status").notNull().default("pending"),

    // Priority — higher is sent faster (0-100)
    priority: t.integer("priority").default(50).notNull(),

    // Timing
    scheduledAt: t
      .timestamp("scheduled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sentAt: t.timestamp("sent_at", { withTimezone: true }),
    deliveredAt: t.timestamp("delivered_at", { withTimezone: true }),
    readAt: t.timestamp("read_at", { withTimezone: true }),
    failedAt: t.timestamp("failed_at", { withTimezone: true }),

    failureReason: t.text("failure_reason"),
    // e.g. "invalid_token" | "service_down"

    // Provider tracking (e.g. Firebase Message ID, SendGrid ID)
    providerMessageId: t.varchar("provider_message_id", { length: 255 }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("notif_user_idx").on(tbl.userId, tbl.status, tbl.scheduledAt),
    t.index("notif_template_idx").on(tbl.templateId, tbl.status),
    t.index("notif_batch_idx").on(tbl.batchId, tbl.status),
    t.index("notif_status_idx").on(tbl.status, tbl.scheduledAt),
    // For expired/clean-up queries
    t.index("notif_created_idx").on(tbl.createdAt),
  ],
);

// =============================================================================
// SECTION 4 — NOTIFICATION PREFERENCES
// User-level controls for opting out of specific notification categories/channels.
// =============================================================================

export const notificationPreferencesTable = table(
  "notification_preferences",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    category: notificationCategoryEnum("category").notNull(),
    channel: notificationChannelEnum("channel").notNull(),

    isEnabled: t.boolean("is_enabled").default(true).notNull(),

    // Last updated for audit/synchronization
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("notif_pref_user_cat_chan_uq_idx").on(
      tbl.userId,
      tbl.category,
      tbl.channel,
    ),
    t.index("notif_pref_user_idx").on(tbl.userId),
  ],
);

// =============================================================================
// SECTION 5 — NOTIFICATION INTERACTIONS (append-only)
// Detailed tracking of how users interact with notifications.
// NEVER UPDATE OR DELETE rows in this table.
// =============================================================================

export const notificationInteractionsTable = table(
  "notification_interactions",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    notificationId: t
      .uuid("notification_id")
      .notNull()
      .references(() => notificationsTable.id, { onDelete: "restrict" }),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    interactionType: notifInteractionTypeEnum("interaction_type").notNull(),

    // Context of the interaction
    platform: devicePlatformEnum("platform"),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),

    // Metadata (e.g. which button was clicked)
    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("notif_interaction_notif_idx").on(tbl.notificationId),
    t.index("notif_interaction_user_idx").on(tbl.userId, tbl.occurredAt),
    t.index("notif_interaction_type_idx").on(tbl.interactionType, tbl.occurredAt),
  ],
);

// =============================================================================
// SECTION 6 — NOTIFICATION DEVICES
// Maps users to their notification-capable devices (FCM tokens).
// =============================================================================

export const notificationDevicesTable = table(
  "notification_devices",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    platform: devicePlatformEnum("platform").notNull(),

    // Unique token for the device (e.g. FCM token)
    deviceToken: t.text("device_token").notNull(),

    // Device details
    deviceName: t.varchar("device_name", { length: 255 }),
    deviceModel: t.varchar("device_model", { length: 255 }),
    osVersion: t.varchar("os_version", { length: 100 }),
    appVersion: t.varchar("app_version", { length: 100 }),

    isActive: t.boolean("is_active").default(true).notNull(),

    // Security/Clean-up
    lastAccessedAt: t.timestamp("last_accessed_at", {
      withTimezone: true,
    }).defaultNow(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("notif_device_token_uq_idx").on(tbl.deviceToken),
    t.index("notif_device_user_idx").on(tbl.userId, tbl.isActive),
  ],
);

// =============================================================================
// SECTION 7 — PROMOTION CAMPAIGNS
// High-level marketing or communication initiatives.
// =============================================================================

export const promotionCampaignsTable = table(
  "promotion_campaigns",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 255 }).notNull(),
    description: t.text("description"),

    status: campaignStatusEnum("status").notNull().default("draft"),
    type: campaignTypeEnum("type").notNull(),

    // Scheduling
    scheduledStart: t.timestamp("scheduled_start", { withTimezone: true }),
    scheduledEnd: t.timestamp("scheduled_end", { withTimezone: true }),

    // Settings
    isPriority: t.boolean("is_priority").default(false).notNull(),

    // Budget/Tracking
    budgetPaise: t.integer("budget_paise"),
    actualSpendPaise: t.integer("actual_spend_paise").default(0),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

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
    t.index("promotion_campaigns_status_idx").on(tbl.status, tbl.scheduledStart),
    t.index("promotion_campaigns_type_idx").on(tbl.type, tbl.status),
  ],
);

// =============================================================================
// SECTION 8 — CAMPAIGN VARIANTS
// Different content or channel options for testing (A/B) within a campaign.
// =============================================================================

export const campaignVariantsTable = table(
  "campaign_variants",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    campaignId: t
      .uuid("campaign_id")
      .notNull()
      .references(() => promotionCampaignsTable.id, { onDelete: "cascade" }),

    name: t.varchar("name", { length: 100 }).notNull(), // e.g. "Control", "Variant A"
    description: t.text("description"),

    templateId: t
      .uuid("template_id")
      .notNull()
      .references(() => notificationTemplatesTable.id, {
        onDelete: "restrict",
      }),

    // Allocation percentage (e.g. 50.00 for 50%)
    allocationWeight: t
      .decimal("allocation_weight", { precision: 5, scale: 2 })
      .notNull()
      .default("100.00"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [t.index("campaign_variants_campaign_idx").on(tbl.campaignId)],
);

// =============================================================================
// SECTION 9 — CAMPAIGN AUDIENCES (SEGMENTS)
// Logic or static list determining which users receive a campaign.
// =============================================================================

export const campaignAudiencesTable = table(
  "campaign_audiences",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 255 }).notNull(),
    description: t.text("description"),

    type: audienceSegmentTypeEnum("type").notNull(),

    // Filters / Logic (if dynamic)
    filterCriteria: t.jsonb("filter_criteria").$type<Record<string, unknown>>(),

    // Raw SQL (for custom dynamic segments — use with caution)
    customSql: t.text("custom_sql"),

    // Status
    isDynamic: t.boolean("is_dynamic").default(true).notNull(),
    lastRefreshedAt: t.timestamp("last_refreshed_at", { withTimezone: true }),

    // Metadata
    estimatedUserCount: t.integer("estimated_user_count"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [t.index("campaign_audiences_type_idx").on(tbl.type)],
);

// =============================================================================
// SECTION 10 — CAMPAIGN AUDIENCE MEMBERS
// Mapping between audiences and campaigns, including individual send tracking.
// =============================================================================

export const campaignAudienceMembersTable = table(
  "campaign_audience_members",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    campaignId: t
      .uuid("campaign_id")
      .notNull()
      .references(() => promotionCampaignsTable.id, { onDelete: "cascade" }),

    audienceId: t
      .uuid("audience_id")
      .notNull()
      .references(() => campaignAudiencesTable.id, { onDelete: "cascade" }),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    // Which variant of the campaign this user was assigned to
    variantId: t.uuid("variant_id"),
    // Forward reference to campaignVariantsTable

    status: audienceMemberSendStatusEnum("status").notNull().default("pending"),

    notificationId: t
      .uuid("notification_id")
      .references(() => notificationsTable.id, { onDelete: "set null" }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("campaign_audience_user_uq_idx").on(tbl.campaignId, tbl.userId),
    t.index("cam_campaign_idx").on(tbl.campaignId, tbl.status),
    t.index("cam_user_idx").on(tbl.userId),
  ],
);

// =============================================================================
// SECTION 11 — COUPON ASSIGNMENTS
// Tracks which users have been granted specific coupons.
// Coupons themselves are defined in catlog.model.ts.
// =============================================================================

// Assuming couponsTable is in catalog.model.ts (will use a soft reference via UUID if needed)
export const couponAssignmentsTable = table(
  "coupon_assignments",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    couponId: t.uuid("coupon_id").notNull(), // Referred from catalog module
    campaignId: t.uuid("campaign_id").references(() => promotionCampaignsTable.id, {
      onDelete: "set null",
    }),

    // Usage limits for this specific user
    maxUses: t.integer("max_uses").notNull().default(1),
    usedCount: t.integer("used_count").notNull().default(0),

    isRevoked: t.boolean("is_revoked").default(false).notNull(),
    revocationReason: t.text("revocation_reason"),

    // Personalised expiry
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("coupon_assign_user_coupon_uq_idx").on(tbl.userId, tbl.couponId),
    t.index("coupon_assign_user_idx").on(tbl.userId),
    t.index("coupon_assign_coupon_idx").on(tbl.couponId),
  ],
);

// =============================================================================
// SECTION 12 — REFERRAL LOGS (append-only)
// Tracking of successful referrals between users.
// =============================================================================

export const referralLogsTable = table(
  "referral_logs",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    referrerUserId: t
      .uuid("referrer_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    referredUserId: t
      .uuid("referred_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    // Link/Code used
    referralCodeId: t.uuid("referral_code_id"), // if tracking specific codes

    // Current status of the referral
    status: t
      .varchar("status", { length: 50 })
      .notNull()
      .default("pending"),
    // "pending" | "qualified" | "rewarded" | "cancelled" | "fraud_blocked"

    // Rewards given
    referrerRewardId: t.uuid("referrer_reward_id"),
    referredRewardId: t.uuid("referred_reward_id"),

    // Analytics
    source: t.varchar("source", { length: 100 }), // e.g. "whatsapp", "direct"

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("referral_logs_referred_uq_idx").on(tbl.referredUserId),
    t.index("referral_logs_referrer_idx").on(tbl.referrerUserId, tbl.occurredAt),
  ],
);

// =============================================================================
// SECTION 13 — BANNERS
// Static or interactive promotional banners displayed in common app areas.
// =============================================================================

export const bannersTable = table(
  "banners",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 150 }).notNull(),
    description: t.text("description"),

    placement: bannerPlacementEnum("placement").notNull(),

    // Content
    mediaType: bannerMediaTypeEnum("media_type").notNull().default("image"),
    mediaUrl: t.text("media_url").notNull(),
    mediaUrlDark: t.text("media_url_dark"),

    // Action
    deepLink: t.text("deep_link"),

    // Display rules
    priority: t.integer("priority").default(0).notNull(), // higher number = earlier in carousel

    // Visibility
    isActive: t.boolean("is_active").default(true).notNull(),
    scheduledStart: t.timestamp("scheduled_start", { withTimezone: true }),
    scheduledEnd: t.timestamp("scheduled_end", { withTimezone: true }),

    // Targeting
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "set null" }),
    audienceId: t
      .uuid("audience_id")
      .references(() => campaignAudiencesTable.id, { onDelete: "set null" }),

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
    t.index("banners_placement_idx").on(tbl.placement, tbl.priority),
    t.index("banners_active_idx").on(tbl.isActive, tbl.scheduledStart),
  ],
);

// =============================================================================
// SECTION 14 — BANNER IMPRESSIONS (append-only)
// Detailed tracking of banner performance.
// =============================================================================

export const bannerImpressionsTable = table(
  "banner_impressions",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    bannerId: t
      .uuid("banner_id")
      .notNull()
      .references(() => bannersTable.id, { onDelete: "cascade" }),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),

    type: bannerEventTypeEnum("type").notNull(),

    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),
    sessionId: t.varchar("session_id", { length: 255 }),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("banner_impression_banner_idx").on(tbl.bannerId, tbl.occurredAt),
    t.index("banner_impression_user_idx").on(tbl.userId, tbl.occurredAt),
  ],
);

// =============================================================================
// SECTION 15 — SHOP BANNER ASSIGNMENTS
// Banners created Specifically for individual shop pages.
// =============================================================================

export const shopBannerAssignmentsTable = table(
  "shop_banner_assignments",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    bannerId: t
      .uuid("banner_id")
      .notNull()
      .references(() => bannersTable.id, { onDelete: "cascade" }),

    priority: t.integer("priority").default(0).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("shop_banner_uq_idx").on(tbl.shopId, tbl.bannerId),
    t.index("shop_banner_shop_idx").on(tbl.shopId),
  ],
);

// =============================================================================
// SECTION 16 — IN-APP POPUPS
// Modals triggered by specific user actions or events.
// =============================================================================

export const popupsTable = table(
  "popups",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 150 }).notNull(),
    description: t.text("description"),

    trigger: popupTriggerEnum("trigger").notNull(),
    triggerMetadata: t.jsonb("trigger_metadata").$type<Record<string, unknown>>(),
    // e.g. { page_slug: 'checkout', scroll_percentage: 50 }

    // Content
    title: t.varchar("title", { length: 255 }),
    body: t.text("body"),
    imageUrl: t.text("image_url"),
    lottieUrl: t.text("lottie_url"),

    // CTAs
    primaryCtaLabel: t.varchar("primary_cta_label", { length: 50 }),
    primaryCtaLink: t.text("primary_cta_link"),
    secondaryCtaLabel: t.varchar("secondary_cta_label", { length: 50 }),
    secondaryCtaLink: t.text("secondary_cta_link"),

    // Frequency & Capping
    maxImpressionsPerUser: t.integer("max_impressions_per_user").default(1),
    cooldownPeriodMinutes: t.integer("cooldown_period_minutes").default(1440), // 1 day

    // Visibility
    isActive: t.boolean("is_active").default(true).notNull(),
    scheduledStart: t.timestamp("scheduled_start", { withTimezone: true }),
    scheduledEnd: t.timestamp("scheduled_end", { withTimezone: true }),

    // Targeting
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "set null" }),
    audienceId: t
      .uuid("audience_id")
      .references(() => campaignAudiencesTable.id, { onDelete: "set null" }),

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
    t.index("popups_trigger_idx").on(tbl.trigger, tbl.isActive),
    t.index("popups_scheduled_idx").on(tbl.isActive, tbl.scheduledStart),
  ],
);

// =============================================================================
// SECTION 17 — POP-UP INTERACTIONS (append-only)
// Tracking modal performance.
// =============================================================================

export const popupInteractionsTable = table(
  "popup_interactions",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    popupId: t
      .uuid("popup_id")
      .notNull()
      .references(() => popupsTable.id, { onDelete: "cascade" }),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),

    type: popupEventTypeEnum("type").notNull(),

    platform: devicePlatformEnum("platform"),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("popup_interaction_popup_idx").on(tbl.popupId, tbl.occurredAt),
    t.index("popup_interaction_user_idx").on(tbl.userId, tbl.occurredAt),
  ],
);

// =============================================================================
// SECTION 18 — REFERRAL CAMPAIGN CONFIG
// Defines the rules and rewards for a referral program.
// =============================================================================

export const referralCampaignConfigsTable = table(
  "referral_campaign_configs",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 150 }).notNull(),
    description: t.text("description"),

    isActive: t.boolean("is_active").default(true).notNull(),

    // Referrer reward rules
    referrerRewardPaise: t.integer("referrer_reward_paise").default(0),
    referrerRewardType: t.varchar("referrer_reward_type", { length: 50 }),
    // "wallet" | "coupon" | "coins"

    // Referred (friend) reward rules
    referredRewardPaise: t.integer("referred_reward_paise").default(0),
    referredRewardType: t.varchar("referred_reward_type", { length: 50 }),

    // Qualification rules (e.g. friend must make an order > 500)
    minFirstOrderAmountPaise: t.integer("min_first_order_amount_paise").default(0),

    maxRewardsPerReferrer: t.integer("max_rewards_per_referrer"),

    scheduledStart: t.timestamp("scheduled_start", { withTimezone: true }),
    scheduledEnd: t.timestamp("scheduled_end", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [t.index("referral_config_active_idx").on(tbl.isActive)],
);

// =============================================================================
// SECTION 19 — SYSTEM EVENT LOG (append-only)
// Internal notifications for admins/devs about system state.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const systemEventLogTable = table(
  "system_event_log",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    level: systemEventLevelEnum("level").notNull(),
    category: systemEventCategoryEnum("category").notNull(),

    message: t.text("message").notNull(),
    detail: t.text("detail"),

    // Contextual references
    userId: t.uuid("user_id"),
    shopId: t.uuid("shop_id"),
    requestId: t.uuid("request_id"),

    // JSON payload of the event data
    payload: t.jsonb("payload").$type<Record<string, unknown>>(),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("system_event_log_level_idx").on(tbl.level, tbl.occurredAt),
    t.index("system_event_log_cat_idx").on(tbl.category, tbl.occurredAt),
    t.index("system_event_log_request_idx").on(tbl.requestId),
  ],
);

// =============================================================================
// SECTION 20 — API REQUEST LOG (append-only, partitioned)
// Raw record of incoming API requests for security and troubleshooting.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const apiRequestLogTable = table(
  "api_request_log",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    userId: t.uuid("user_id"),
    shopId: t.uuid("shop_id"),

    method: httpMethodEnum("method").notNull(),
    path: t.text("path").notNull(),
    query: t.text("query"),

    statusCode: t.integer("status_code"),
    durationMs: t.integer("duration_ms"),

    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),
    deviceFingerprint: t.varchar("device_fingerprint", { length: 255 }),

    requestId: t.uuid("request_id").notNull(),

    // Request/Response bodies (usually disabled or anonymised in prod)
    requestBody: t.jsonb("request_body"),
    responseBody: t.jsonb("response_body"),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("api_request_log_user_idx").on(tbl.userId, tbl.occurredAt),
    t.index("api_request_log_path_idx").on(tbl.path, tbl.occurredAt),
    t.uniqueIndex("api_request_log_request_uq_idx").on(tbl.requestId),
  ],
);

// =============================================================================
// SECTION 21 — BACKGROUND JOB LOG (append-only)
// Tracking the lifecycle of cron jobs and async workers.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const backgroundJobLogTable = table(
  "background_job_log",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    jobName: t.varchar("job_name", { length: 150 }).notNull(),
    // e.g. "order_payout_settlement", "abandoned_cart_cleanup"

    queueName: t.varchar("queue_name", { length: 100 }).default("default"),

    status: jobStatusEnum("status").notNull().default("queued"),

    // Input data for the job
    payload: t.jsonb("payload"),

    // Result or Error details
    result: t.jsonb("result"),
    errorMessage: t.text("error_message"),
    errorStack: t.text("error_stack"),

    // Perf
    durationMs: t.integer("duration_ms"),
    attempts: t.integer("attempts").default(0).notNull(),

    // Timing
    enqueuedAt: t
      .timestamp("enqueued_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    startedAt: t.timestamp("started_at", { withTimezone: true }),
    finishedAt: t.timestamp("finished_at", { withTimezone: true }),
    nextAttemptAt: t.timestamp("next_attempt_at", { withTimezone: true }),

    processedBy: t.varchar("processed_by", { length: 100 }), // Worker hostname/ID
  },
  (tbl) => [
    t.index("bg_job_name_idx").on(tbl.jobName, tbl.status),
    t.index("bg_job_status_idx").on(tbl.status, tbl.enqueuedAt),
  ],
);

// =============================================================================
// SECTION 22 — WEBHOOK LOG (append-only)
// Detailed log of all inbound and outbound webhook traffic.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const webhookLogTable = table(
  "webhook_log",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    direction: webhookDirectionEnum("direction").notNull(),

    // Inbound: provider name (e.g. 'stripe'); Outbound: target name
    provider: t.varchar("provider", { length: 100 }).notNull(),

    url: t.text("url").notNull(),
    method: httpMethodEnum("method").notNull().default("POST"),

    // JSON payload
    payload: t.jsonb("payload"),
    headers: t.jsonb("headers"),

    // Response details
    responseStatus: t.integer("response_status"),
    responseBody: t.text("response_body"),

    durationMs: t.integer("duration_ms"),

    status: t
      .varchar("status", { length: 50 })
      .notNull()
      .default("pending"),
    // "pending" | "success" | "failed" | "retrying"

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("webhook_log_provider_idx").on(tbl.provider, tbl.direction),
    t.index("webhook_log_occurred_idx").on(tbl.occurredAt),
  ],
);

// =============================================================================
// SECTION 23 — ERROR LOG (append-only)
// Centralised tracking of application crashes and caught errors.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const errorLogTable = table(
  "error_log",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    level: t.varchar("level", { length: 20 }).notNull().default("error"),
    // "warning" | "error" | "fatal"

    errorCode: t.varchar("error_code", { length: 100 }), // e.g. "AUTH001"
    message: t.text("message").notNull(),
    stack: t.text("stack"),

    // Context
    userId: t.uuid("user_id"),
    shopId: t.uuid("shop_id"),
    url: t.text("url"),
    params: t.jsonb("params"),
    requestId: t.uuid("request_id"),

    // Environment info
    appVersion: t.varchar("app_version", { length: 50 }),
    environment: t.varchar("environment", { length: 20 }), // "prod" | "staging" | "dev"

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("error_log_code_idx").on(tbl.errorCode, tbl.occurredAt),
    t.index("error_log_user_idx").on(tbl.userId, tbl.occurredAt),
  ],
);

// =============================================================================
// SECTION 24 — DATA EXPORT LOG (append-only)
// Compliance tracking of when and who exported sensitive data.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const dataExportLogTable = table(
  "data_export_log",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    // The user whose data was exported

    exportedBy: t
      .uuid("exported_by")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    // The user who triggered the export (could be an admin or the user themselves)

    exportType: t.varchar("export_type", { length: 100 }).notNull(),
    // "gdpr_sar" | "order_history_csv" | "analytics_report" | "kyc_bundle"

    format: t.varchar("format", { length: 10 }).notNull(), // "json" | "csv" | "pdf" | "zip"

    // Storage/Delivery
    status: exportStatusEnum("status").notNull().default("queued"),
    fileKey: t.text("file_key"), // S3 key
    fileSize: t.bigint("file_size", { mode: "bigint" }),

    // Expiry
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("data_export_log_user_idx").on(tbl.userId, tbl.occurredAt),
    t.index("data_export_log_actor_idx").on(tbl.exportedBy, tbl.occurredAt),
  ],
);

// =============================================================================
// SECTION 25 — AUDIT LOG (append-only)
// Universal record of what changed, by whom, and when.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const commsAuditLogTable = table(
  "comms_audit_log",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    // Who made the change
    actorId: t.uuid("actor_id"),
    actorType: auditActorTypeEnum("actor_type").notNull(),
    // If system-triggered, actorId is null

    operation: auditOperationEnum("operation").notNull(),

    // What was changed
    tableName: t.varchar("table_name", { length: 100 }).notNull(),
    recordId: t.text("record_id").notNull(),

    // State change (JSONB diff)
    oldValues: t.jsonb("old_values"),
    newValues: t.jsonb("new_values"),

    // Context
    requestId: t.uuid("request_id"),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("comms_audit_log_record_idx").on(tbl.tableName, tbl.recordId),
    t.index("comms_audit_log_actor_idx").on(tbl.actorId, tbl.occurredAt),
    t.index("comms_audit_log_request_idx").on(tbl.requestId),
  ],
);

// =============================================================================
// SECTION 26 — ADMIN ACTION LOG (append-only)
// High-priority audit trail for critical administrative actions.
// e.g. Banning a user, overriding a payout, changing global config.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const adminActionLogTable = table(
  "admin_action_log",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    adminId: t
      .uuid("admin_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    action: t.varchar("action", { length: 150 }).notNull(),
    // e.g. "USER_BANNED" | "SHOP_SUSPENDED" | "CONFIG_UPDATED" | "SYSTEM_MAINTENANCE"

    // Detailed description/justification
    reason: t.text("reason"),

    // Context
    targetUserId: t.uuid("target_user_id"),
    targetShopId: t.uuid("target_shop_id"),
    targetRecordId: t.text("target_record_id"),

    metadata: t.jsonb("metadata"),

    // Security
    requestId: t.uuid("request_id"),
    ipAddress: t.varchar("ip_address", { length: 45 }),

    // Support for admin impersonation tracking
    impersonatingUserId: t.uuid("impersonating_user_id"),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("admin_action_log_admin_idx").on(tbl.adminId, tbl.occurredAt),
    t.index("admin_action_log_target_user_idx").on(tbl.targetUserId),
    t.index("admin_action_log_target_shop_idx").on(tbl.targetShopId),
    t
      .index("admin_action_log_impersonation_idx")
      .on(tbl.impersonatingUserId)
      .where(sql`impersonating_user_id IS NOT NULL`),
  ],
);

// =============================================================================
// SECTION 27 — CONSENT LOG (PDPB / GDPR, append-only)
// Every consent grant, revocation, or update is recorded immutably.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const consentLogTable = table(
  "consent_log",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    consentType: consentTypeEnum("consent_type").notNull(),
    action: consentActionEnum("consent_action").notNull(),

    // Document version the user consented to
    documentVersion: t.varchar("document_version", { length: 30 }).notNull(),
    // e.g. "2024-03-01" | "v3.2"
    documentUrl: t.text("document_url"),
    // URL to the specific version they saw

    // Context
    collectionPoint: t.varchar("collection_point", { length: 100 }),
    // e.g. "signup_screen" | "settings_page" | "checkout_gdpr_banner"
    platform: t.varchar("platform", { length: 20 }),
    // android | ios | web

    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),
    sessionId: t.varchar("session_id", { length: 255 }),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("consent_log_user_idx").on(tbl.userId, tbl.occurredAt),
    t.index("consent_log_type_idx").on(tbl.consentType, tbl.occurredAt),
    // Most recent consent state per user per type
    t
      .index("consent_log_latest_idx")
      .on(tbl.userId, tbl.consentType, tbl.occurredAt),
  ],
);

// =============================================================================
// SECTION 28 — DATA DELETION LOG (append-only)
// Tracks user account deletion and right-to-erasure requests end-to-end.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const dataDeletionLogTable = table(
  "data_deletion_log",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    // Keep user row with deleted_at set — do not CASCADE delete this log

    requestType: t.varchar("request_type", { length: 50 }).notNull(),
    // "account_deletion" | "right_to_erasure" | "data_minimisation"

    stage: dataDeletionStageEnum("stage").notNull(),

    // Who initiated the deletion
    requestedBy: t
      .uuid("requested_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    // Could be the user themselves or an admin acting on their behalf
    requestedByType: t.varchar("requested_by_type", { length: 20 }),
    // "self" | "admin" | "automated"

    // What will be / has been erased
    dataCategories: t.jsonb("data_categories").$type<string[]>(),
    // e.g. ["profile", "orders", "addresses", "payment_methods"]

    // Grace period — user can cancel before scheduledAt
    scheduledAt: t.timestamp("scheduled_at", { withTimezone: true }),

    completedAt: t.timestamp("completed_at", { withTimezone: true }),
    failedAt: t.timestamp("failed_at", { withTimezone: true }),
    failureReason: t.text("failure_reason"),

    cancelledAt: t.timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: t
      .uuid("cancelled_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    // GDPR response deadline (30 days from request)
    deadlineAt: t.timestamp("deadline_at", { withTimezone: true }),

    // Confirmation reference sent to user
    confirmationRef: t.varchar("confirmation_ref", { length: 100 }),

    notes: t.text("notes"),

    ipAddress: t.varchar("ip_address", { length: 45 }),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("data_deletion_log_user_idx").on(tbl.userId, tbl.occurredAt),
    t.index("data_deletion_log_stage_idx").on(tbl.stage, tbl.occurredAt),
    t
      .index("data_deletion_log_deadline_idx")
      .on(tbl.deadlineAt)
      .where(
        sql`stage NOT IN ('completed', 'cancelled', 'failed')`,
      ),
  ],
);

// =============================================================================
// SECTION 29 — LOGIN AUDIT (append-only)
// Every login, logout, token refresh, session revocation, and MFA event.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const loginAuditTable = table(
  "login_audit",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    // Null on failed login where user was not found

    phoneAttempted: t.varchar("phone_attempted", { length: 20 }),
    emailAttempted: t.varchar("email_attempted", { length: 255 }),

    eventType: loginEventTypeEnum("event_type").notNull(),

    authMethod: loginAuthMethodEnum("auth_method"),

    // Session created on success
    sessionId: t.uuid("session_id"),
    // Correlates with userSessionTable in auth.model.ts

    // Failure details
    failureReason: t.varchar("failure_reason", { length: 100 }),
    failureDetail: t.text("failure_detail"),

    // Device & network
    ipAddress: t.varchar("ip_address", { length: 45 }),
    ipCountry: t.char("ip_country", { length: 2 }),
    userAgent: t.text("user_agent"),
    deviceFingerprint: t.varchar("device_fingerprint", { length: 255 }),
    platform: devicePlatformEnum("platform"),

    // Was this flagged as suspicious?
    isSuspicious: t.boolean("is_suspicious").default(false).notNull(),
    suspicionReason: t.text("suspicion_reason"),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("login_audit_user_idx").on(tbl.userId, tbl.occurredAt),
    t.index("login_audit_event_idx").on(tbl.eventType, tbl.occurredAt),
    t.index("login_audit_ip_idx").on(tbl.ipAddress, tbl.occurredAt),
    t
      .index("login_audit_suspicious_idx")
      .on(tbl.isSuspicious, tbl.occurredAt)
      .where(sql`is_suspicious = true`),
    t
      .index("login_audit_failed_ip_idx")
      .on(tbl.ipAddress, tbl.occurredAt)
      .where(sql`event_type = 'login_failed'`),
  ],
);

// =============================================================================
// SECTION 30 — PERMISSION CHANGE LOG (append-only)
// Every role/permission grant and revoke event.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const permissionChangeLogTable = table(
  "permission_change_log",
  {
    id: t.bigserial("id", { mode: "bigint" }).primaryKey(),

    // Who was affected
    targetUserId: t
      .uuid("target_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    // Who made the change
    changedBy: t
      .uuid("changed_by")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    changedByType: auditActorTypeEnum("changed_by_type").notNull(),

    operation: permissionChangeOperationEnum("operation").notNull(),

    // Role / permission changed
    roleId: t.uuid("role_id"),
    roleName: t.varchar("role_name", { length: 100 }),
    permissionId: t.uuid("permission_id"),
    permissionName: t.varchar("permission_name", { length: 200 }),

    // Scope (if shop-scoped role)
    shopId: t
      .uuid("shop_id")
      .references(() => shopsTable.id, { onDelete: "set null" }),

    // Expiry (if time-limited grant)
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

    reason: t.text("reason"),
    // Mandatory justification

    requestId: t.uuid("request_id"),
    ipAddress: t.varchar("ip_address", { length: 45 }),

    occurredAt: t
      .timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("perm_change_log_target_idx")
      .on(tbl.targetUserId, tbl.occurredAt),
    t
      .index("perm_change_log_changed_by_idx")
      .on(tbl.changedBy, tbl.occurredAt),
    t
      .index("perm_change_log_operation_idx")
      .on(tbl.operation, tbl.occurredAt),
    t
      .index("perm_change_log_shop_idx")
      .on(tbl.shopId, tbl.occurredAt)
      .where(sql`shop_id IS NOT NULL`),
  ],
);

// =============================================================================
// FORWARD-REFERENCE FK MIGRATION NOTES
// Run these after every `drizzle-kit migrate` or `push`:
//
// 1. notificationsTable.batchId → notificationBatchesTable
//
//    ALTER TABLE notifications
//      ADD CONSTRAINT notifications_batch_id_fk
//      FOREIGN KEY (batch_id) REFERENCES notification_batches(id)
//      ON DELETE SET NULL;
//
// 2. notificationBatchesTable.campaignId → promotionCampaignsTable
//
//    ALTER TABLE notification_batches
//      ADD CONSTRAINT notification_batches_campaign_id_fk
//      FOREIGN KEY (campaign_id) REFERENCES promotion_campaigns(id)
//      ON DELETE SET NULL;
//
// 3. campaignAudienceMembersTable.variantId → campaignVariantsTable
//
//    ALTER TABLE campaign_audience_members
//      ADD CONSTRAINT campaign_audience_members_variant_id_fk
//      FOREIGN KEY (variant_id) REFERENCES campaign_variants(id)
//      ON DELETE SET NULL;
//
// PARTITIONING NOTES
//
// 4. api_request_log — partition by created_at (monthly) before first load:
//
//    ALTER TABLE api_request_log PARTITION BY RANGE (created_at);
//    CREATE TABLE api_request_log_2026_04
//      PARTITION OF api_request_log
//      FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
//
// 5. notification_interactions — same pattern as api_request_log:
//
//    ALTER TABLE notification_interactions PARTITION BY RANGE (created_at);
//
// RETENTION POLICY
//
// 6. api_request_log, notification_interactions:
//    Archive to cold storage after 90 days via pg_cron:
//
//    CREATE EXTENSION IF NOT EXISTS pg_cron;
//    SELECT cron.schedule('archive-old-api-logs', '0 3 * * *',
//      $$DELETE FROM api_request_log
//        WHERE created_at < NOW() - INTERVAL '90 days'$$);
//
// 7. system_event_log debug/info rows:
//    Auto-delete after 30 days, keep warning and above indefinitely.
//
// GDPR
//
// 8. Before deleting a user account, the application layer must:
//    a. Insert a data_deletion_log row with stage = 'requested'.
//    b. Anonymise PII columns in: notifications, api_request_log,
//       login_audit, audit_log (actorIp, actorUserAgent).
//    c. Set userTable.deleted_at and nullify personally identifying fields.
//    d. Update data_deletion_log stage to 'completed'.
//    Audit log rows themselves must NOT be deleted — anonymise only.
// =============================================================================
