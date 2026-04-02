import { pgEnum } from "drizzle-orm/pg-core";

// =============================================================================
// AUTH ENUMS
// =============================================================================

export const REWARD_STATUSES = [
  "no_reward",
  "coin_hike",
  "free_delivery",
] as const;
export const rewardStatusEnum = pgEnum("reward_status", REWARD_STATUSES);

export const OTP_PURPOSES = [
  "phone_verification",
  "pin_reset",
  "two_factor_auth",
  "enable_2fa",
  "disable_2fa",
  "account_deletion",
] as const;
export const otpPurposeEnum = pgEnum("otp_purpose", OTP_PURPOSES);

export const SESSION_STATUSES = [
  "active",
  "expired",
  "revoked",
  "logged_out",
] as const;
export const sessionStatusEnum = pgEnum("session_status", SESSION_STATUSES);

export const LOGIN_FAILURE_REASONS = [
  "invalid_credentials",
  "account_locked",
  "account_not_found",
  "unverified_phone",
  "too_many_attempts",
  "suspicious_activity",
] as const;
export const loginFailureReasonEnum = pgEnum(
  "login_failure_reason",
  LOGIN_FAILURE_REASONS,
);

export const REFERRAL_STATUSES = [
  "pending",
  "completed",
  "expired",
  "fraudulent",
] as const;
export const referralStatusEnum = pgEnum("referral_status", REFERRAL_STATUSES);

export const ACCOUNT_STATUSES = [
  "active",
  "suspended",
  "deactivated",
  "banned",
] as const;
export const accountStatusEnum = pgEnum("account_status", ACCOUNT_STATUSES);

export const AUTH_METHODS = ["otp", "pin"] as const;
export const authMethodEnum = pgEnum("auth_method", AUTH_METHODS);

export const USER_ROLES = [
  "customer",
  "shopkeeper",
  "delivery_partner",
  "admin",
  "employe",
] as const;
export const userRoleEnum = pgEnum("user_role", USER_ROLES);

// =============================================================================
// PROFILE ENUMS
// =============================================================================

export const kycStatusEnum = pgEnum("kyc_status", [
  "not_submitted",
  "pending",
  "under_review",
  "verified",
  "rejected",
  "suspended",
  "expired",
]);

export const kycDocumentTypeEnum = pgEnum("kyc_document_type", [
  "aadhaar",
  "pan",
  "passport",
  "driving_license",
  "voter_id",
  "gst_certificate",
  "business_registration",
  "bank_statement",
]);

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "bicycle",
  "motorcycle",
  "car",
  "auto_rickshaw",
  "van",
  "truck",
  "other",
]);

export const addressLabelEnum = pgEnum("address_label", [
  "home",
  "work",
  "office",
  "hotel",
  "other",
]);

export const bankAccountTypeEnum = pgEnum("bank_account_type", [
  "savings",
  "current",
  "salary",
]);

// =============================================================================
// PLATFORM ENUMS
// =============================================================================

export const configValueTypeEnum = pgEnum("config_value_type", [
  "string",
  "integer",
  "decimal",
  "boolean",
  "json",
  "paise",
]);

export const configScopeEnum = pgEnum("config_scope", [
  "global",
  "city",
  "shop_type",
]);

export const platformSearchIntentEnum = pgEnum("platform_search_intent", [
  "find_shop",
  "find_product",
  "find_category",
  "browse",
]);

export const onboardingStepEnum = pgEnum("onboarding_step", [
  "basic_info",
  "address_location",
  "operating_hours",
  "bank_account",
  "kyc_personal",
  "kyc_business",
  "first_product",
  "subscription_plan",
  "go_live_review",
]);

export const onboardingStepStatusEnum = pgEnum("onboarding_step_status", [
  "pending",
  "in_progress",
  "completed",
  "skipped",
  "failed",
]);

export const shopVerificationQueueStatusEnum = pgEnum(
  "shop_verification_queue_status",
  [
    "submitted",
    "queued",
    "assigned",
    "under_review",
    "approved",
    "rejected",
    "requires_changes",
    "escalated",
  ],
);

export const supportTicketStatusEnum = pgEnum("support_ticket_status", [
  "open",
  "waiting_for_customer",
  "waiting_for_shop",
  "in_progress",
  "escalated",
  "resolved",
  "closed",
  "reopened",
]);

export const supportTicketPriorityEnum = pgEnum("support_ticket_priority", [
  "low",
  "medium",
  "high",
  "urgent",
  "critical",
]);

export const supportActorTypeEnum = pgEnum("support_actor_type", [
  "customer",
  "shop_owner",
  "delivery_partner",
  "admin",
  "system",
  "bot",
]);

export const platformAnnouncementTargetEnum = pgEnum(
  "platform_announcement_target",
  [
    "all_users",
    "all_customers",
    "all_shop_owners",
    "all_delivery_partners",
    "city_customers",
    "city_shop_owners",
    "city_delivery_partners",
    "specific_shops",
  ],
);

export const dpApplicationStatusEnum = pgEnum("dp_application_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "requires_changes",
  "on_hold",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "extended",
]);

// =============================================================================
// SHOP ENUMS
// =============================================================================

export const shopStatusEnum = pgEnum("shop_status", [
  "draft",
  "pending_review",
  "under_review",
  "active",
  "temporarily_closed",
  "suspended",
  "permanently_closed",
  "rejected",
]);

export const shopDocumentStatusEnum = pgEnum("shop_document_status", [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "expired",
]);

export const shopDocumentTypeEnum = pgEnum("shop_document_type", [
  "gst_certificate",
  "fssai_license",
  "trade_license",
  "shop_act_license",
  "drug_license",
  "import_export_code",
  "other",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "basic",
  "pro",
  "enterprise",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "expired",
]);

// =============================================================================
// LOGISTIC / DELIVERY ENUMS
// =============================================================================

export const deliveryTaskStatusEnum = pgEnum("delivery_task_status", [
  "pending",
  "broadcast",
  "assigned",
  "partner_enroute_pickup",
  "arrived_pickup",
  "picked_up",
  "partner_enroute_delivery",
  "arrived_delivery",
  "delivered",
  "delivery_failed",
  "returned_to_shop",
  "cancelled",
  "reassigned",
  "expired",
]);

export const deliveryPartnerStatusEnum = pgEnum("delivery_partner_status", [
  "offline",
  "available",
  "on_delivery",
  "break",
  "suspended",
]);

export const deliveryTypeEnum = pgEnum("delivery_type", [
  "instant",
  "scheduled",
  "express",
  "standard",
  "cod",
  "pickup",
  "return_pickup",
  "inter_city",
]);

export const assignmentStrategyEnum = pgEnum("assignment_strategy", [
  "auto_nearest",
  "auto_least_loaded",
  "broadcast_accept",
  "manual",
  "zone_based",
]);

export const deliveryFailureReasonEnum = pgEnum("delivery_failure_reason", [
  "customer_unavailable",
  "wrong_address",
  "address_not_found",
  "customer_refused",
  "access_denied",
  "payment_issue",
  "damaged_in_transit",
  "item_missing",
  "partner_issue",
  "weather",
  "vehicle_breakdown",
  "other",
]);

export const podTypeEnum = pgEnum("pod_type", [
  "photo",
  "signature",
  "otp",
  "qr_scan",
  "left_at_door",
  "handed_to_neighbour",
  "handed_to_security",
]);

export const deliveryIncidentTypeEnum = pgEnum("delivery_incident_type", [
  "damaged_package",
  "missing_item",
  "wrong_item_delivered",
  "theft",
  "accident",
  "partner_misconduct",
  "customer_complaint",
  "fraud_attempt",
  "vehicle_issue",
  "weather_delay",
  "address_issue",
  "other",
]);

export const incidentSeverityEnum = pgEnum("incident_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const incidentStatusEnum = pgEnum("incident_status", [
  "open",
  "under_investigation",
  "resolved",
  "closed",
  "escalated",
]);

export const partnerPayoutStatusEnum = pgEnum("partner_payout_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "on_hold",
]);

export const carrierStatusEnum = pgEnum("carrier_status", [
  "active",
  "inactive",
  "suspended",
]);

export const carrierTrackingEventTypeEnum = pgEnum(
  "carrier_tracking_event_type",
  [
    "shipment_created",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivery_attempted",
    "delivered",
    "exception",
    "returned",
    "lost",
    "cancelled",
    "customs_hold",
    "hub_scan",
    "info",
  ],
);

export const routeStatusEnum = pgEnum("route_status", [
  "planned", // not yet started
  "active", // partner is executing
  "completed", // all stops done
  "partially_completed", // some stops done, rest cancelled / reassigned
  "cancelled",
]);

export const routeStopTypeEnum = pgEnum("route_stop_type", [
  "pickup", // collect from shop
  "delivery", // deliver to customer
  "return", // return undeliverable item to shop
]);

export const earningsEntryTypeEnum = pgEnum("earnings_entry_type", [
  "delivery_fee", // base delivery fee for completed task
  "surge_bonus", // surge pricing top-up
  "tip", // customer tip
  "incentive_bonus", // platform incentive (e.g. complete 10 today)
  "referral_bonus", // referred a new partner
  "correction_credit", // manual credit by admin
  "penalty_debit", // policy breach / failed COD
  "cod_shortfall", // COD amount not fully remitted
  "adjustment_debit", // other admin deduction
]);

// =============================================================================
// CATALOG ENUMS
// =============================================================================

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "pending_review",
  "active",
  "discontinued",
  "archived",
]);

export const productConditionEnum = pgEnum("product_condition", [
  "new",
  "refurbished",
  "used_like_new",
  "used_good",
  "used_acceptable",
]);

export const stockStatusEnum = pgEnum("stock_status", [
  "in_stock",
  "low_stock",
  "out_of_stock",
  "pre_order",
  "discontinued",
]);

export const productSourceEnum = pgEnum("product_source", [
  "master",
  "custom",
]);

export const productRecommendationBadgeEnum = pgEnum(
  "product_recommendation_badge",
  ["top_pick", "best_seller", "budget_best"],
);

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed_amount",
]);

export const pricingTierTypeEnum = pgEnum("pricing_tier_type", [
  "price_per_unit",
  "total_price",
  "discount_percent",
  "discount_fixed",
]);

export const collectionTypeEnum = pgEnum("collection_type", [
  "manual",
  "smart",
  "seasonal",
  "trending",
]);

export const bundleTypeEnum = pgEnum("bundle_type", [
  "flexible",
  "fixed",
]);

export const bundlePricingTypeEnum = pgEnum("bundle_pricing_type", [
  "fixed_price",
  "percentage_off",
  "fixed_discount",
  "buy_x_get_y",
]);

export const linkTypeEnum = pgEnum("link_type", [
  "frequently_bought_together",
  "customers_also_bought",
  "alternative",
  "accessory",
  "replacement",
  "upgrade",
  "related",
  "similar",
]);

export const linkSourceEnum = pgEnum("link_source", [
  "manual",
  "auto_purchase",
  "auto_view",
  "auto_cart",
  "ai_suggested",
]);

export const filterTypeEnum = pgEnum("filter_type", [
  "single_select",
  "multi_select",
  "range",
  "boolean",
  "color",
  "size",
]);

export const filterDisplayStyleEnum = pgEnum("filter_display_style", [
  "list",
  "grid",
  "dropdown",
  "slider",
  "color_swatches",
  "size_buttons",
]);

export const filterScopeEnum = pgEnum("filter_scope", [
  "global",
  "category",
  "shop",
]);

export const recQueueStatusEnum = pgEnum("rec_queue_status", [
  "pending",
  "approved",
  "rejected",
]);

export const interactionTypeEnum = pgEnum("interaction_type", [
  "view",
  "click",
  "add_to_cart",
  "remove_from_cart",
  "add_to_wishlist",
  "remove_from_wishlist",
  "share",
  "review_submitted",
  "question_asked",
  "compare",
  "quick_view",
  "zoom_image",
  "play_video",
]);

export const viewSourceEnum = pgEnum("view_source", [
  "direct",
  "search",
  "category",
  "collection",
  "home",
  "recommendation",
  "related",
  "bundle",
  "daily_pick",
  "notification",
  "email",
  "social",
  "advertisement",
  "external",
]);

export const deviceTypeEnum = pgEnum("device_type", [
  "desktop",
  "mobile",
  "tablet",
  "unknown",
]);

export const comparisonOutcomeEnum = pgEnum("comparison_outcome", [
  "purchased",
  "abandoned",
  "saved_for_later",
  "shared",
  "unclear",
]);

export const analyticsGranularityEnum = pgEnum("analytics_granularity", [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const trendPeriodEnum = pgEnum("trend_period", [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const trendDirectionEnum = pgEnum("trend_direction", [
  "rising",
  "falling",
  "stable",
  "new_entry",
  "re_entry",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "product_feature",
  "availability",
  "shipping",
  "pricing",
  "compatibility",
  "usage",
  "warranty",
  "returns",
  "general",
  "custom",
]);

export const answeredByEnum = pgEnum("answered_by", [
  "shop_owner",
  "support_team",
  "ai_assistant",
  "community",
  "verified_buyer",
]);

export const catalogueAnnouncementTypeEnum = pgEnum("catalogue_announcement_type", [
  "general",
  "promotion",
  "new_arrival",
  "restock",
  "holiday",
  "urgent",
  "maintenance",
  "policy_update",
]);

export const displayLocationEnum = pgEnum("display_location", [
  "shop_header",
  "shop_banner",
  "product_page",
  "cart_page",
  "checkout_page",
  "category_page",
  "homepage",
  "all_pages",
]);

export const stockAlertTypeEnum = pgEnum("stock_alert_type", [
  "low_stock",
  "out_of_stock",
  "critical_stock",
  "overstock",
  "expiring_soon",
  "reorder_point",
]);

export const stockAlertSeverityEnum = pgEnum("stock_alert_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const savedItemSourceEnum = pgEnum("saved_item_source", [
  "cart",
  "wishlist",
  "direct",
  "recommendation",
  "comparison",
]);

export const priceAlertStatusEnum = pgEnum("price_alert_status", [
  "pending",
  "sent",
  "viewed",
  "purchased",
  "expired",
  "cancelled",
]);

export const suggestionStatusEnum = pgEnum("suggestion_status", [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "merged",
  "auto_rejected",
  "requires_changes",
]);

export const matchTypeEnum = pgEnum("match_type", [
  "exact",
  "high_confidence",
  "medium_confidence",
  "low_confidence",
  "manual",
  "user_reported",
]);

export const suggestionSourceEnum = pgEnum("suggestion_source", [
  "ml_model",
  "gtin_match",
  "sku_match",
  "name_similarity",
  "shop_owner",
  "admin_curated",
  "community",
  "bulk_import",
]);

export const reviewActionEnum = pgEnum("review_action", [
  "approve_as_is",
  "approve_with_edits",
  "merge_with_existing",
  "create_new_master",
  "reject_duplicate",
  "reject_low_quality",
  "request_more_info",
]);

export const catalogueRecommendationTypeEnum = pgEnum("catalogue_recommendation_type", [
  "personalized_homepage",
  "similar_products",
  "frequently_bought_together",
  "complementary_items",
  "trending_for_you",
  "complete_the_look",
  "you_may_also_like",
  "recently_viewed",
  "abandoned_cart",
  "seasonal",
  "price_drop_alert",
  "restock_alert",
  "upsell",
  "cross_sell",
  "bundle_suggestion",
]);

export const recommendationStatusEnum = pgEnum("recommendation_status_v2", [
  "generated",
  "shown",
  "clicked",
  "dismissed",
  "purchased",
  "expired",
]);

export const searchIntentEnum = pgEnum("search_intent", [
  "product_search",
  "category_browse",
  "price_comparison",
  "research",
  "unclear",
]);

export const suggestionTypeEnum = pgEnum("suggestion_type", [
  "similar_products",
  "frequently_bought_together",
  "complementary",
  "trending",
  "personalized",
  "recently_viewed",
  "bestsellers",
  "new_arrivals",
  "price_drop",
  "seasonal",
]);

export const searchSuggestionTypeEnum = pgEnum("search_suggestion_type", [
  "product_name",
  "category",
  "brand",
  "trending",
  "popular",
  "personalized",
]);

export const pushSuggestionTypeEnum = pgEnum("push_suggestion_type", [
  "create_new",
  "match_existing",
]);

export const matchingStatusEnum = pgEnum("matching_status", [
  "queued",
  "processing",
  "completed",
  "failed",
  "skipped",
]);

export const detectionMethodEnum = pgEnum("detection_method", [
  "auto_detected",
  "user_reported",
  "admin_flagged",
]);

export const duplicateReportStatusEnum = pgEnum("duplicate_report_status", [
  "pending",
  "confirmed",
  "false_positive",
  "merged",
  "dismissed",
]);

export const couponDiscountTypeEnum = pgEnum("coupon_discount_type", [
  "percentage",
  "fixed_amount",
  "free_shipping",
  "buy_x_get_y",
  "tiered",
]);

export const couponStatusEnum = pgEnum("coupon_status", [
  "active",
  "inactive",
  "expired",
  "depleted",
  "scheduled",
]);

export const couponTargetEnum = pgEnum("coupon_target", [
  "all",
  "specific_products",
  "categories",
  "collections",
  "brands",
  "new_customers",
  "first_purchase",
  "abandoned_cart",
]);

export const couponScopeEnum = pgEnum("coupon_scope", [
  "order_total",
  "shipping",
  "specific_items",
  "subscription",
]);

export const usageRestrictionEnum = pgEnum("usage_restriction", [
  "once_per_customer",
  "once_per_order",
  "unlimited",
  "limited_total",
  "limited_per_user",
]);

export const generationMethodEnum = pgEnum("generation_method", [
  "manual",
  "auto_generated",
  "bulk_generated",
  "api_generated",
]);

export const coinTransactionTypeEnum = pgEnum("coin_transaction_type", [
  "earned",
  "redeemed",
  "expired",
  "refunded",
  "admin_credit",
  "admin_debit",
  "transferred",
  "bonus",
  "revoked",
]);

export const coinEarningSourceEnum = pgEnum("coin_earning_source", [
  "purchase",
  "signup",
  "referral",
  "review",
  "social_share",
  "birthday",
  "milestone",
  "daily_checkin",
  "contest",
  "survey",
  "promotion",
  "admin",
]);

export const coinRedemptionTypeEnum = pgEnum("coin_redemption_type", [
  "order_discount",
  "product_discount",
  "free_shipping",
  "gift_card",
  "prize",
  "donation",
]);

export const coinTransactionStatusEnum = pgEnum("coin_transaction_status", [
  "pending",
  "completed",
  "failed",
  "reversed",
  "cancelled",
]);

export const customerTierEnum = pgEnum("customer_tier", [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
]);

// =============================================================================
// COMMERCE ENUMS
// =============================================================================

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "payment_pending",
  "payment_failed",
  "confirmed",
  "processing",
  "ready_to_ship",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
  "refund_requested",
  "refund_processing",
  "refunded",
  "partially_refunded",
  "return_requested",
  "return_approved",
  "return_rejected",
  "returned",
  "failed",
  "on_hold",
]);

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "unfulfilled",
  "partial",
  "fulfilled",
  "restocked",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "authorized",
  "captured",
  "completed",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
  "expired",
  "requires_action",
  "disputed",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "credit_card",
  "debit_card",
  "wallet",
  "upi",
  "net_banking",
  "cod",
  "paypal",
  "apple_pay",
  "google_pay",
  "bank_transfer",
  "buy_now_pay_later",
  "gift_card",
  "store_credit",
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "pending",
  "processing",
  "approved",
  "rejected",
  "completed",
  "failed",
  "cancelled",
  "partial",
]);

export const refundTypeEnum = pgEnum("refund_type", [
  "full",
  "partial",
  "restocking_fee",
  "shipping_refund",
  "tax_refund",
]);

export const refundReasonEnum = pgEnum("refund_reason", [
  "customer_request",
  "product_defect",
  "wrong_item",
  "damaged_in_transit",
  "not_as_described",
  "size_issue",
  "quality_issue",
  "late_delivery",
  "changed_mind",
  "duplicate_order",
  "fraud_prevention",
  "out_of_stock",
  "other",
]);

export const walletTransactionTypeEnum = pgEnum(
  "order_wallet_transaction_type",
  [
    "credit_topup",
    "credit_refund",
    "credit_cashback",
    "credit_reward",
    "credit_reversal",
    "debit_order_payment",
    "debit_withdrawal",
    "debit_adjustment",
    "debit_transfer_out",
    "credit_transfer_in",
  ],
);

export const shippingStatusEnum = pgEnum("shipping_status", [
  "pending",
  "label_created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed_delivery",
  "returned_to_sender",
  "cancelled",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
]);

export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "sale",
  "return",
  "restock",
  "adjustment",
  "transfer_in",
  "transfer_out",
  "damage",
  "expiry",
  "opening_stock",
]);

export const cartStatusEnum = pgEnum("cart_status", [
  "active",
  "checked_out",
  "abandoned",
  "expired",
  "merged",
]);

export const subscriptionStatusEnumV2 = pgEnum("subscription_status_v2", [
  "trialing",
  "active",
  "paused",
  "past_due", // payment failed, in grace period
  "cancelled",
  "expired",
  "incomplete", // initial payment not yet captured
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "warning_needs_response",
  "warning_under_review",
  "needs_response",
  "under_review",
  "charge_refunded",
  "won",
  "lost",
  "accepted",
]);

export const giftCardTransactionTypeEnum = pgEnum("gift_card_transaction_type", [
  "redemption",
  "refund",
  "adjustment",
  "activation",
]);

// =============================================================================
// COMMS & SYSTEM ENUMS
// =============================================================================

export const notificationChannelEnum = pgEnum("notif_channel", [
  "push",
  "email",
  "sms",
  "whatsapp",
  "in_app",
  "web_push",
]);

export const notificationCategoryEnum = pgEnum("notif_category", [
  "order_update",
  "payment_update",
  "delivery_update",
  "account_security",
  "kyc_update",
  "payout_update",
  "promotional",
  "offer_alert",
  "restock_alert",
  "price_drop_alert",
  "abandoned_cart",
  "campaign",
  "shop_update",
  "dispatch_update",
  "system_alert",
  "recommendation",
  "reminder",
  "survey",
]);

export const notificationStatusEnum = pgEnum("notif_status", [
  "pending",
  "scheduled",
  "processing",
  "sent",
  "delivered",
  "failed",
  "cancelled",
  "skipped",
]);

export const templateEngineEnum = pgEnum("template_engine", [
  "handlebars",
  "mjml",
  "liquid",
  "plain",
]);

export const devicePlatformEnum = pgEnum("device_platform", [
  "android",
  "ios",
  "web",
  "unknown",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "running",
  "paused",
  "completed",
  "cancelled",
  "archived",
]);

export const campaignTypeEnum = pgEnum("campaign_type", [
  "push_blast",
  "email_blast",
  "sms_blast",
  "whatsapp_blast",
  "multi_channel",
  "drip",
  "triggered",
  "ab_test",
  "transactional_promo",
]);

export const audienceSegmentTypeEnum = pgEnum("audience_segment_type", [
  "all_users",
  "all_customers",
  "all_shop_owners",
  "all_delivery_partners",
  "city",
  "tier",
  "last_active_days",
  "inactive_days",
  "order_count_range",
  "spend_range",
  "custom_sql",
  "manual_upload",
  "tag",
]);

export const bannerPlacementEnum = pgEnum("banner_placement", [
  "home_top",
  "home_middle",
  "category_top",
  "search_top",
  "cart_bottom",
  "checkout_top",
  "order_confirmation",
  "post_delivery",
  "shop_page_top",
  "product_page_middle",
]);

export const bannerMediaTypeEnum = pgEnum("banner_media_type", [
  "image",
  "gif",
  "video",
  "lottie",
  "html",
]);

export const popupTriggerEnum = pgEnum("popup_trigger", [
  "app_open",
  "session_start",
  "page_view",
  "add_to_cart",
  "checkout_start",
  "order_placed",
  "post_delivery",
  "inactivity",
  "exit_intent",
  "scroll_depth",
  "time_on_page",
  "first_visit",
  "nth_visit",
  "custom_event",
]);

export const systemEventLevelEnum = pgEnum("system_event_level", [
  "debug",
  "info",
  "notice",
  "warning",
  "error",
  "critical",
  "alert",
  "emergency",
]);

export const systemEventCategoryEnum = pgEnum("system_event_category", [
  "auth",
  "order",
  "payment",
  "delivery",
  "catalogue",
  "notification",
  "promotion",
  "user_account",
  "shop_account",
  "kyc",
  "payout",
  "system",
  "integration",
  "scheduled_job",
  "data_export",
  "security",
]);

export const httpMethodEnum = pgEnum("http_method", [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
]);

export const webhookDirectionEnum = pgEnum("webhook_direction", [
  "inbound",
  "outbound",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "retrying",
  "cancelled",
  "stale",
]);

export const auditActorTypeEnum = pgEnum("audit_actor_type", [
  "customer",
  "shop_owner",
  "delivery_partner",
  "admin",
  "super_admin",
  "system",
  "api_client",
  "webhook",
]);

export const auditOperationEnum = pgEnum("audit_operation", [
  "create",
  "read",
  "update",
  "delete",
  "soft_delete",
  "restore",
  "export",
  "login",
  "logout",
  "password_change",
  "pin_change",
  "permission_grant",
  "permission_revoke",
  "status_change",
  "approve",
  "reject",
  "bulk_update",
  "impersonate",
]);

export const consentTypeEnum = pgEnum("consent_type", [
  "terms_of_service",
  "privacy_policy",
  "marketing_communications",
  "location_tracking",
  "data_analytics",
  "third_party_sharing",
  "push_notifications",
  "sms_notifications",
  "whatsapp_notifications",
  "cookie_analytics",
  "cookie_marketing",
]);

export const consentActionEnum = pgEnum("consent_action", [
  "granted",
  "revoked",
  "updated",
  "expired",
]);

export const dataDeletionStageEnum = pgEnum("data_deletion_stage", [
  "requested",
  "identity_verified",
  "scheduled",
  "anonymising",
  "completed",
  "failed",
  "cancelled",
]);

// =============================================================================
// FINANCE ENUMS
// =============================================================================

export const splitStatusEnum = pgEnum("split_status", [
  "pending",
  "calculated",
  "settled",
  "adjusted",
  "cancelled",
]);

export const shopEarningsEntryTypeEnum = pgEnum("shop_earnings_entry_type", [
  "order_earning",
  "tip_earning",
  "correction_credit",
  "penalty_debit",
  "refund_debit",
  "adjustment_debit",
  "adjustment_credit",
]);

export const shopPayoutStatusEnum = pgEnum("shop_payout_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "on_hold",
]);

export const taxTypeEnum = pgEnum("tax_type", [
  "cgst",
  "sgst",
  "igst",
  "utgst",
  "cess",
  "exempt",
  "nil_rated",
]);

export const gstTransactionTypeEnum = pgEnum("gst_transaction_type", [
  "intra_state",
  "inter_state",
  "export",
]);

export const platformFeePaymentStatusEnum = pgEnum(
  "platform_fee_payment_status",
  [
    "pending",
    "paid",
    "overdue",
    "waived",
    "failed",
    "refunded",
  ],
);

export const commissionScopeEnum = pgEnum("commission_scope", [
  "global",
  "city",
  "shop_type",
  "shop",
]);


export const platformAnnouncementTypeEnum = pgEnum(
  "platform_announcement_type",
  ["general", "feature_launch", "policy_update", "maintenance", "promotion", "urgent"],
);

export const staticPageTargetEnum = pgEnum("static_page_target", [
  "all",
  "customers",
  "shop_owners",
  "delivery_partners",
]);

export const faqTargetEnum = pgEnum("faq_target", [
  "customer",
  "shop_owner",
  "delivery_partner",
  "all",
]);

export const dpOnboardingStepEnum = pgEnum("dp_onboarding_step", [
  "personal_info",
  "vehicle_details",
  "driving_licence",
  "aadhaar_kyc",
  "pan_kyc",
  "profile_photo",
  "bank_account",
  "city_zone_selection",
  "orientation",
  "background_check",
  "final_approval",
]);

// =============================================================================
// NEW COMMERCE & COMMS ENUMS (Centralized Migration)
// =============================================================================

export const batchStatusEnum = pgEnum("batch_status", [
  "preparing",
  "sending",
  "completed",
  "partially_failed",
  "failed",
  "cancelled",
]);

export const notifInteractionTypeEnum = pgEnum("notif_interaction_type", [
  "delivered",
  "opened",
  "clicked",
  "dismissed",
  "converted",
  "unsubscribed",
]);

export const audienceMemberSendStatusEnum = pgEnum(
  "audience_member_send_status",
  ["pending", "sent", "skipped", "failed"],
);

export const bannerEventTypeEnum = pgEnum("banner_event_type", [
  "impression",
  "click",
  "dismiss",
  "conversion",
]);

export const popupEventTypeEnum = pgEnum("popup_event_type", [
  "shown",
  "primary_cta_clicked",
  "secondary_cta_clicked",
  "dismissed",
  "converted",
]);

export const exportStatusEnum = pgEnum("export_status", [
  "queued",
  "processing",
  "ready",
  "downloaded",
  "expired",
  "failed",
]);

export const loginEventTypeEnum = pgEnum("login_event_type", [
  "login_success",
  "login_failed",
  "logout",
  "session_expired",
  "session_revoked",
  "token_refreshed",
  "mfa_challenge_sent",
  "mfa_success",
  "mfa_failed",
  "password_reset_requested",
  "pin_reset_requested",
  "account_locked",
  "account_unlocked",
  "suspicious_activity_flagged",
]);

export const loginAuthMethodEnum = pgEnum("login_auth_method", [
  "otp",
  "pin",
  "google_oauth",
  "apple_oauth",
  "admin_impersonation",
]);

export const permissionChangeOperationEnum = pgEnum(
  "permission_change_operation",
  [
    "role_granted",
    "role_revoked",
    "permission_granted",
    "permission_revoked",
    "shop_access_granted",
    "shop_access_revoked",
  ],
);

export const shopSubscriptionBillingStatusEnum = pgEnum(
  "shop_subscription_billing_status",
  ["trialing", "active", "past_due", "suspended", "cancelled", "expired"],
);

export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "annual"]);

export const feeDeductionMethodEnum = pgEnum("fee_deduction_method", [
  "separate_invoice",
  "deduct_from_payout",
]);

export const commissionAppliedOnEnum = pgEnum("commission_applied_on", [
  "gross_subtotal",
  "net_subtotal",
]);
