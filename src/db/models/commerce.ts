import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { shopsTable } from "./shop";
import { userTable } from "./auth";
import { shopProductTable, shopProductVariantTable } from "./catalog";
import {
  orderStatusEnum,
  fulfillmentStatusEnum,
  paymentStatusEnum,
  paymentMethodEnum,
  refundStatusEnum,
  refundTypeEnum,
  refundReasonEnum,
  walletTransactionTypeEnum,
  shippingStatusEnum,
  invoiceStatusEnum,
  inventoryMovementTypeEnum,
  cartStatusEnum,
  subscriptionStatusEnumV2,
  disputeStatusEnum,
  giftCardTransactionTypeEnum,
} from "../shared/enums";

// =============================================================================
// SECTION 2 — CARTS (active shopping session)
// =============================================================================

export const cartsTable = table(
  "carts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    // Authenticated customer or anonymous session
    customerId: t
      .uuid("customer_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    sessionId: t.varchar("session_id", { length: 255 }).notNull(),

    // Cart state
    status: cartStatusEnum("status").default("active").notNull(),

    // Amounts
    currency: t.varchar("currency", { length: 3 }).default("INR").notNull(),
    subtotal: t.integer("subtotal").default(0).notNull(), // paise
    discountTotal: t.integer("discount_total").default(0).notNull(),
    shippingEstimate: t.integer("shipping_estimate"),
    taxEstimate: t.integer("tax_estimate"),
    totalEstimate: t.integer("total_estimate").default(0).notNull(),

    // Applied coupon
    couponCode: t.varchar("coupon_code", { length: 50 }),
    couponDiscountAmount: t.integer("coupon_discount_amount"),

    // Checkout progress
    checkoutStep: t.varchar("checkout_step", { length: 50 }),

    // Addresses
    shippingAddressId: t.uuid("shipping_address_id"),
    billingAddressId: t.uuid("billing_address_id"),

    // Converted to order
    orderId: t.uuid("order_id"),
    checkedOutAt: t.timestamp("checked_out_at", { withTimezone: true }),

    // Recovery
    recoveryToken: t.varchar("recovery_token", { length: 255 }),
    recoveryTokenExpiresAt: t.timestamp("recovery_token_expires_at", {
      withTimezone: true,
    }),

    // Device & geo
    deviceType: t.varchar("device_type", { length: 20 }),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

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
    t.index("carts_shop_status_idx").on(tbl.shopId, tbl.status),
    t.index("carts_customer_idx").on(tbl.customerId, tbl.status),
    t.index("carts_session_idx").on(tbl.sessionId),
    t
      .index("carts_recovery_token_idx")
      .on(tbl.recoveryToken)
      .where(sql`recovery_token IS NOT NULL`),

    t.check("carts_subtotal_chk", sql`${tbl.subtotal} >= 0`),
    t.check("carts_total_chk", sql`${tbl.totalEstimate} >= 0`),
  ],
);

export const cartItemsTable = table(
  "cart_items",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    cartId: t
      .uuid("cart_id")
      .notNull()
      .references(() => cartsTable.id, { onDelete: "cascade" }),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    shopProductVariantId: t
      .uuid("shop_product_variant_id")
      .references(() => shopProductVariantTable.id, { onDelete: "set null" }),

    quantity: t.integer("quantity").notNull(),

    // Price snapshot at the time the item was added
    unitPriceSnapshot: t.integer("unit_price_snapshot").notNull(), // paise
    mrpSnapshot: t.integer("mrp_snapshot").notNull(),
    discountSnapshot: t.integer("discount_snapshot").default(0).notNull(),

    // Customisations
    customization: t.jsonb("customization").$type<{
      text?: string;
      engraving?: string;
      [key: string]: string | undefined;
    }>(),

    isGiftWrap: t.boolean("is_gift_wrap").default(false).notNull(),
    giftMessage: t.text("gift_message"),

    addedAt: t
      .timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    // One row per product/variant per cart
    t
      .uniqueIndex("cart_items_cart_product_variant_uq_idx")
      .on(tbl.cartId, tbl.shopProductId, tbl.shopProductVariantId),

    t.index("cart_items_cart_idx").on(tbl.cartId),
    t.index("cart_items_product_idx").on(tbl.shopProductId),

    t.check("cart_items_qty_chk", sql`${tbl.quantity} > 0`),
    t.check("cart_items_price_chk", sql`${tbl.unitPriceSnapshot} >= 0`),
  ],
);

// =============================================================================
// SECTION 3 — ORDERS & ORDER ITEMS
// =============================================================================

export const ordersTable = table(
  "orders",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    // Human-readable order reference
    orderNumber: t.varchar("order_number", { length: 50 }).notNull(),

    customerId: t
      .uuid("customer_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    customerEmail: t.varchar("customer_email", { length: 255 }).notNull(),
    customerPhone: t.varchar("customer_phone", { length: 20 }),
    isGuestCheckout: t.boolean("is_guest_checkout").default(false).notNull(),

    // Originating cart
    cartId: t.uuid("cart_id"),

    // Financials (all paise)
    currency: t.varchar("currency", { length: 3 }).default("INR").notNull(),
    exchangeRate: t.decimal("exchange_rate", { precision: 10, scale: 4 }),

    subtotal: t.integer("subtotal").notNull(),
    discountTotal: t.integer("discount_total").default(0).notNull(),
    shippingTotal: t.integer("shipping_total").default(0).notNull(),
    taxTotal: t.integer("tax_total").default(0).notNull(),
    tipAmount: t.integer("tip_amount").default(0).notNull(),
    giftWrapCharge: t.integer("gift_wrap_charge").default(0).notNull(),
    totalAmount: t.integer("total_amount").notNull(),

    itemsCount: t.integer("items_count").notNull(),

    // Status
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status")
      .notNull()
      .default("unfulfilled"),

    // Payment
    paymentMethod: paymentMethodEnum("payment_method"),
    isPaid: t.boolean("is_paid").default(false).notNull(),
    paidAt: t.timestamp("paid_at", { withTimezone: true }),

    // Shipping
    shippingMethod: t.varchar("shipping_method", { length: 100 }),
    shippingRateId: t.uuid("shipping_rate_id"),
    estimatedDeliveryDate: t.date("estimated_delivery_date"),
    actualDeliveryDate: t.date("actual_delivery_date"),

    // Addresses
    shippingAddress: t
      .jsonb("shipping_address")
      .$type<{
        recipientName: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string;
        deliveryInstructions?: string;
      }>()
      .notNull(),

    billingAddress: t
      .jsonb("billing_address")
      .$type<{
        name: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string;
      }>()
      .notNull(),

    // Discounts applied
    appliedDiscounts: t.jsonb("applied_discounts").$type<
      {
        couponId?: string;
        couponCode?: string;
        discountAmount: number;
        discountType: string;
        description: string;
      }[]
    >(),

    // GST / tax breakdown
    taxBreakdown: t.jsonb("tax_breakdown").$type<
      {
        name: string;
        rate: number;
        amount: number;
        jurisdiction?: string;
      }[]
    >(),

    // Channel/attribution
    source: t.varchar("source", { length: 50 }).default("web").notNull(),
    channel: t.varchar("channel", { length: 50 }),
    utmSource: t.varchar("utm_source", { length: 100 }),
    utmMedium: t.varchar("utm_medium", { length: 100 }),
    utmCampaign: t.varchar("utm_campaign", { length: 100 }),

    // Device & geo
    deviceType: t.varchar("device_type", { length: 20 }),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),

    // Notes
    customerNote: t.text("customer_note"),
    internalNote: t.text("internal_note"),

    // Gift
    isGift: t.boolean("is_gift").default(false).notNull(),
    giftMessage: t.text("gift_message"),

    // Risk & fraud
    riskLevel: t.varchar("risk_level", { length: 20 }),
    isFraudulent: t.boolean("is_fraudulent").default(false).notNull(),
    fraudScore: t.decimal("fraud_score", { precision: 5, scale: 2 }),
    fraudCheckData: t.jsonb("fraud_check_data").$type<{
      avsCheck?: string;
      cvcCheck?: string;
      threeDSecure?: boolean;
      ipCountry?: string;
      deviceFingerprint?: string;
    }>(),

    // Cancellation
    cancelledAt: t.timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: t.text("cancellation_reason"),
    cancelledBy: t.uuid("cancelled_by"),

    // Timestamps
    confirmedAt: t.timestamp("confirmed_at", { withTimezone: true }),
    processedAt: t.timestamp("processed_at", { withTimezone: true }),
    shippedAt: t.timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: t.timestamp("delivered_at", { withTimezone: true }),
    completedAt: t.timestamp("completed_at", { withTimezone: true }),

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
    t.uniqueIndex("orders_number_shop_uq_idx").on(tbl.shopId, tbl.orderNumber),

    t.index("orders_shop_created_idx").on(tbl.shopId, tbl.createdAt),
    t.index("orders_customer_idx").on(tbl.customerId, tbl.createdAt),
    t.index("orders_email_idx").on(tbl.customerEmail, tbl.shopId),
    t.index("orders_status_idx").on(tbl.status, tbl.shopId),
    t.index("orders_payment_status_idx").on(tbl.paymentStatus, tbl.shopId),
    t.index("orders_paid_idx").on(tbl.isPaid, tbl.shopId, tbl.createdAt),
    t
      .index("orders_active_idx")
      .on(tbl.shopId, tbl.status)
      .where(
        sql`status NOT IN ('completed', 'cancelled', 'refunded', 'failed')`,
      ),

    t.check(
      "orders_amounts_chk",
      sql`
        ${tbl.subtotal}      >= 0 AND
        ${tbl.discountTotal} >= 0 AND
        ${tbl.shippingTotal} >= 0 AND
        ${tbl.taxTotal}      >= 0 AND
        ${tbl.totalAmount}   >= 0
      `,
    ),
    t.check("orders_items_count_chk", sql`${tbl.itemsCount} > 0`),
    t.check(
      "orders_fraud_score_chk",
      sql`${tbl.fraudScore} IS NULL OR (${tbl.fraudScore} >= 0 AND ${tbl.fraudScore} <= 100)`,
    ),
  ],
);

export const orderItemsTable = table(
  "order_items",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    orderId: t
      .uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),

    shopProductId: t
      .uuid("shop_product_id")
      .references(() => shopProductTable.id, { onDelete: "set null" }),

    shopProductVariantId: t
      .uuid("shop_product_variant_id")
      .references(() => shopProductVariantTable.id, { onDelete: "set null" }),

    // Snapshot of product data
    productName: t.varchar("product_name", { length: 500 }).notNull(),
    variantName: t.varchar("variant_name", { length: 255 }),
    sku: t.varchar("sku", { length: 100 }),
    barcode: t.varchar("barcode", { length: 100 }),
    productImageUrl: t.varchar("product_image_url", { length: 500 }),
    attributes: t
      .jsonb("attributes")
      .$type<Record<string, string | undefined>>(),

    // Pricing
    quantity: t.integer("quantity").notNull(),
    unitPrice: t.integer("unit_price").notNull(),
    mrp: t.integer("mrp").notNull(),
    discountAmount: t.integer("discount_amount").default(0).notNull(),
    taxAmount: t.integer("tax_amount").default(0).notNull(),
    taxRate: t.decimal("tax_rate", { precision: 5, scale: 2 }),
    taxable: t.boolean("taxable").default(true).notNull(),
    lineSubtotal: t.integer("line_subtotal").notNull(),
    lineTotal: t.integer("line_total").notNull(),

    weightGrams: t.integer("weight_grams"),

    // Fulfilment
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status")
      .default("unfulfilled")
      .notNull(),
    fulfillableQuantity: t.integer("fulfillable_quantity").notNull(),
    fulfilledQuantity: t.integer("fulfilled_quantity").default(0).notNull(),

    // Returns & Refunds
    refundableQuantity: t.integer("refundable_quantity").notNull(),
    refundedQuantity: t.integer("refunded_quantity").default(0).notNull(),

    isGiftWrap: t.boolean("is_gift_wrap").default(false).notNull(),
    giftMessage: t.text("gift_message"),

    customization: t
      .jsonb("customization")
      .$type<Record<string, string | undefined>>(),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("order_items_order_idx").on(tbl.orderId),
    t.index("order_items_product_idx").on(tbl.shopProductId),
    t.index("order_items_sku_idx").on(tbl.sku),

    t.check("order_items_qty_chk", sql`${tbl.quantity} > 0`),
    t.check(
      "order_items_pricing_chk",
      sql`
        ${tbl.unitPrice}    >= 0 AND
        ${tbl.lineSubtotal} >= 0 AND
        ${tbl.lineTotal}    >= 0
      `,
    ),
    t.check(
      "order_items_fulfillment_chk",
      sql`
        ${tbl.fulfilledQuantity}  <= ${tbl.quantity} AND
        ${tbl.fulfillableQuantity} >= 0
      `,
    ),
    t.check(
      "order_items_refund_chk",
      sql`${tbl.refundedQuantity} <= ${tbl.quantity}`,
    ),
  ],
);

// =============================================================================
// SECTION 4 — ORDER STATUS HISTORY (append-only)
// =============================================================================

export const orderStatusHistoryTable = table(
  "order_status_history",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    orderId: t
      .uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),

    previousStatus: orderStatusEnum("previous_status"),
    newStatus: orderStatusEnum("new_status").notNull(),

    comment: t.text("comment"),
    notifyCustomer: t.boolean("notify_customer").default(false).notNull(),

    changedBy: t.uuid("changed_by"),
    changedByType: t.varchar("changed_by_type", { length: 20 }),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("order_status_history_order_idx").on(tbl.orderId, tbl.createdAt),
  ],
);

// =============================================================================
// SECTION 5 — PAYMENT TRANSACTIONS & SAVED PAYMENT METHODS
// =============================================================================

export const paymentTransactionsTable = table(
  "payment_transactions",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    orderId: t
      .uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "restrict" }),

    customerId: t
      .uuid("customer_id")
      .references(() => userTable.id, { onDelete: "set null" }),

    internalTransactionId: t
      .varchar("internal_transaction_id", { length: 255 })
      .notNull(),

    externalTransactionId: t.varchar("external_transaction_id", {
      length: 255,
    }),

    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentProvider: t.varchar("payment_provider", { length: 100 }),

    amount: t.integer("amount").notNull(),
    currency: t.varchar("currency", { length: 3 }).notNull(),
    processingFee: t.integer("processing_fee").default(0).notNull(),
    platformFee: t.integer("platform_fee").default(0).notNull(),
    netAmount: t.integer("net_amount"),

    status: paymentStatusEnum("status").notNull().default("pending"),

    cardLast4: t.char("card_last4", { length: 4 }),
    cardBrand: t.varchar("card_brand", { length: 20 }),
    cardExpMonth: t.smallint("card_exp_month"),
    cardExpYear: t.smallint("card_exp_year"),
    cardFingerprint: t.varchar("card_fingerprint", { length: 255 }),

    upiVpa: t.varchar("upi_vpa", { length: 100 }),

    bankAccountLast4: t.char("bank_account_last4", { length: 4 }),
    bankName: t.varchar("bank_name", { length: 100 }),

    authorizationCode: t.varchar("authorization_code", { length: 100 }),
    authorizedAt: t.timestamp("authorized_at", { withTimezone: true }),
    capturedAt: t.timestamp("captured_at", { withTimezone: true }),

    riskScore: t.decimal("risk_score", { precision: 5, scale: 2 }),
    riskLevel: t.varchar("risk_level", { length: 20 }),
    fraudCheckData: t.jsonb("fraud_check_data").$type<{
      avsCheck?: string;
      cvcCheck?: string;
      threeDSecure?: boolean;
      ipCountry?: string;
    }>(),

    requires3DSecure: t.boolean("requires_3d_secure").default(false).notNull(),
    threeDSecureStatus: t.varchar("three_d_secure_status", { length: 50 }),

    failureCode: t.varchar("failure_code", { length: 100 }),
    failureMessage: t.text("failure_message"),

    refundedAmount: t.integer("refunded_amount").default(0).notNull(),
    isFullyRefunded: t.boolean("is_fully_refunded").default(false).notNull(),

    isDisputed: t.boolean("is_disputed").default(false).notNull(),
    disputedAt: t.timestamp("disputed_at", { withTimezone: true }),

    isReconciled: t.boolean("is_reconciled").default(false).notNull(),
    reconciledAt: t.timestamp("reconciled_at", { withTimezone: true }),

    webhookData: t.jsonb("webhook_data").$type<Record<string, unknown>>(),

    description: t.text("description"),
    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    initiatedAt: t
      .timestamp("initiated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: t.timestamp("completed_at", { withTimezone: true }),
    failedAt: t.timestamp("failed_at", { withTimezone: true }),
    expiredAt: t.timestamp("expired_at", { withTimezone: true }),

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
      .uniqueIndex("payment_txns_internal_id_uq_idx")
      .on(tbl.internalTransactionId),
    t
      .uniqueIndex("payment_txns_external_id_uq_idx")
      .on(tbl.externalTransactionId)
      .where(sql`external_transaction_id IS NOT NULL`),

    t.index("payment_txns_order_idx").on(tbl.orderId),
    t.index("payment_txns_customer_idx").on(tbl.customerId),
    t.index("payment_txns_shop_idx").on(tbl.shopId, tbl.createdAt),
    t.index("payment_txns_status_idx").on(tbl.status, tbl.shopId),

    t.check("payment_txns_amount_chk", sql`${tbl.amount} > 0`),
    t.check(
      "payment_txns_refunded_chk",
      sql`${tbl.refundedAmount} >= 0 AND ${tbl.refundedAmount} <= ${tbl.amount}`,
    ),
    t.check(
      "payment_txns_risk_score_chk",
      sql`${tbl.riskScore} IS NULL OR (${tbl.riskScore} >= 0 AND ${tbl.riskScore} <= 100)`,
    ),
  ],
);

export const savedPaymentMethodsTable = table(
  "saved_payment_methods",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    customerId: t
      .uuid("customer_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    type: paymentMethodEnum("type").notNull(),

    cardLast4: t.char("card_last4", { length: 4 }),
    cardBrand: t.varchar("card_brand", { length: 20 }),
    cardExpMonth: t.smallint("card_exp_month"),
    cardExpYear: t.smallint("card_exp_year"),
    cardFingerprint: t.varchar("card_fingerprint", { length: 255 }),

    upiVpa: t.varchar("upi_vpa", { length: 100 }),

    billingAddress: t.jsonb("billing_address").$type<{
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }>(),

    providerToken: t.text("provider_token"),
    providerCustomerId: t.varchar("provider_customer_id", { length: 255 }),
    paymentProvider: t.varchar("payment_provider", { length: 100 }),

    isDefault: t.boolean("is_default").default(false).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),
    isVerified: t.boolean("is_verified").default(false).notNull(),
    verifiedAt: t.timestamp("verified_at", { withTimezone: true }),

    lastUsedAt: t.timestamp("last_used_at", { withTimezone: true }),
    usageCount: t.integer("usage_count").default(0).notNull(),

    nickname: t.varchar("nickname", { length: 100 }),
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
    t.index("saved_payment_methods_customer_idx").on(tbl.customerId),
    t
      .uniqueIndex("saved_payment_methods_default_uq_idx")
      .on(tbl.customerId, tbl.shopId)
      .where(sql`is_default = true AND is_active = true`),

    // Same card stored once per customer per shop
    t
      .uniqueIndex("saved_payment_methods_card_fingerprint_uq_idx")
      .on(tbl.customerId, tbl.shopId, tbl.cardFingerprint)
      .where(sql`card_fingerprint IS NOT NULL AND is_active = true`),
  ],
);

// =============================================================================
// SECTION 6 — REFUNDS & REFUND LINE ITEMS
// =============================================================================

export const refundsTable = table(
  "refunds",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    orderId: t
      .uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "restrict" }),

    paymentTransactionId: t
      .uuid("payment_transaction_id")
      .references(() => paymentTransactionsTable.id, { onDelete: "set null" }),

    // Human-readable reference
    refundNumber: t.varchar("refund_number", { length: 50 }).notNull(),

    refundType: refundTypeEnum("refund_type").notNull(),
    refundReason: refundReasonEnum("refund_reason").notNull(),
    customerReason: t.text("customer_reason"),
    internalNote: t.text("internal_note"),

    // Amounts (paise)
    refundAmount: t.integer("refund_amount").notNull(),
    shippingRefund: t.integer("shipping_refund").default(0).notNull(),
    taxRefund: t.integer("tax_refund").default(0).notNull(),
    restockingFee: t.integer("restocking_fee").default(0).notNull(),
    adjustmentAmount: t.integer("adjustment_amount").default(0).notNull(),

    currency: t.varchar("currency", { length: 3 }).notNull(),

    // Destination
    refundMethod: paymentMethodEnum("refund_method"),
    refundToWallet: t.boolean("refund_to_wallet").default(false).notNull(),
    refundToOriginalMethod: t
      .boolean("refund_to_original_method")
      .default(true)
      .notNull(),

    // Status
    status: refundStatusEnum("status").notNull().default("pending"),

    // Workflow actors
    requestedBy: t
      .uuid("requested_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    requestedAt: t
      .timestamp("requested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    approvedBy: t
      .uuid("approved_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    approvedAt: t.timestamp("approved_at", { withTimezone: true }),

    processedBy: t
      .uuid("processed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    processedAt: t.timestamp("processed_at", { withTimezone: true }),

    completedAt: t.timestamp("completed_at", { withTimezone: true }),
    failedAt: t.timestamp("failed_at", { withTimezone: true }),

    rejectedBy: t
      .uuid("rejected_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    rejectedAt: t.timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: t.text("rejection_reason"),

    // Return logistics
    requiresReturn: t.boolean("requires_return").default(false).notNull(),
    returnShippingLabelUrl: t.text("return_shipping_label_url"),
    returnTrackingNumber: t.varchar("return_tracking_number", { length: 100 }),
    returnReceivedAt: t.timestamp("return_received_at", {
      withTimezone: true,
    }),

    // Gateway
    externalRefundId: t.varchar("external_refund_id", { length: 255 }),
    processingError: t.text("processing_error"),

    // Inventory
    restockItems: t.boolean("restock_items").default(true).notNull(),
    restockedAt: t.timestamp("restocked_at", { withTimezone: true }),

    notifyCustomer: t.boolean("notify_customer").default(true).notNull(),
    customerNotifiedAt: t.timestamp("customer_notified_at", {
      withTimezone: true,
    }),

    attachments: t
      .jsonb("attachments")
      .$type<{ url: string; type: string; name: string }[]>(),

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
      .uniqueIndex("refunds_number_shop_uq_idx")
      .on(tbl.shopId, tbl.refundNumber),

    t.index("refunds_order_idx").on(tbl.orderId),
    t.index("refunds_shop_idx").on(tbl.shopId, tbl.createdAt),
    t.index("refunds_status_idx").on(tbl.status, tbl.shopId),

    t.check("refunds_amount_chk", sql`${tbl.refundAmount} > 0`),
    t.check(
      "refunds_rejection_reason_chk",
      sql`${tbl.status} <> 'rejected' OR ${tbl.rejectionReason} IS NOT NULL`,
    ),
  ],
);

export const refundLineItemsTable = table(
  "refund_line_items",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    refundId: t
      .uuid("refund_id")
      .notNull()
      .references(() => refundsTable.id, { onDelete: "cascade" }),

    orderItemId: t
      .uuid("order_item_id")
      .notNull()
      .references(() => orderItemsTable.id, { onDelete: "restrict" }),

    quantity: t.integer("quantity").notNull(),
    unitRefundAmount: t.integer("unit_refund_amount").notNull(), // paise
    lineSubtotal: t.integer("line_subtotal").notNull(),
    taxRefund: t.integer("tax_refund").default(0).notNull(),
    lineTotal: t.integer("line_total").notNull(),

    returnCondition: t.varchar("return_condition", { length: 50 }),
    conditionNotes: t.text("condition_notes"),

    restockQuantity: t.integer("restock_quantity").default(0).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("refund_line_items_refund_idx").on(tbl.refundId),
    t.index("refund_line_items_order_item_idx").on(tbl.orderItemId),

    t.check("refund_line_items_qty_chk", sql`${tbl.quantity} > 0`),
    t.check(
      "refund_line_items_amounts_chk",
      sql`${tbl.unitRefundAmount} >= 0 AND ${tbl.lineTotal} >= 0`,
    ),
    t.check(
      "refund_line_items_restock_chk",
      sql`${tbl.restockQuantity} <= ${tbl.quantity}`,
    ),
  ],
);

// =============================================================================
// SECTION 7 — CUSTOMER WALLETS & WALLET TRANSACTIONS
// =============================================================================

export const customerWalletsTable = table(
  "customer_wallets",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    customerId: t
      .uuid("customer_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    // Balances (paise)
    currentBalance: t.integer("current_balance").default(0).notNull(),
    pendingBalance: t.integer("pending_balance").default(0).notNull(),
    blockedBalance: t.integer("blocked_balance").default(0).notNull(),

    currency: t.varchar("currency", { length: 3 }).default("INR").notNull(),

    // Lifetime stats
    totalCredited: t
      .bigint("total_credited", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    totalDebited: t
      .bigint("total_debited", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    totalWithdrawn: t
      .bigint("total_withdrawn", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    // Spend limits
    dailySpendLimit: t.integer("daily_spend_limit"),
    dailySpentToday: t.integer("daily_spent_today").default(0).notNull(),
    lastSpendResetDate: t.date("last_spend_reset_date"),
    maxBalance: t.integer("max_balance"),

    // Status
    isActive: t.boolean("is_active").default(true).notNull(),
    isFrozen: t.boolean("is_frozen").default(false).notNull(),
    frozenReason: t.text("frozen_reason"),
    frozenAt: t.timestamp("frozen_at", { withTimezone: true }),

    // Withdrawal
    canWithdraw: t.boolean("can_withdraw").default(true).notNull(),

    // Auto top-up
    autoTopUpEnabled: t.boolean("auto_top_up_enabled").default(false).notNull(),
    autoTopUpThreshold: t.integer("auto_top_up_threshold"),
    autoTopUpAmount: t.integer("auto_top_up_amount"),
    autoTopUpPaymentMethodId: t
      .uuid("auto_top_up_payment_method_id")
      .references(() => savedPaymentMethodsTable.id, {
        onDelete: "set null",
      }),

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
      .uniqueIndex("customer_wallets_shop_customer_uq_idx")
      .on(tbl.shopId, tbl.customerId),

    t.index("customer_wallets_shop_idx").on(tbl.shopId),
    t.index("customer_wallets_customer_idx").on(tbl.customerId),

    t.check("customer_wallets_balance_chk", sql`${tbl.currentBalance} >= 0`),
    t.check("customer_wallets_pending_chk", sql`${tbl.pendingBalance} >= 0`),
    t.check("customer_wallets_blocked_chk", sql`${tbl.blockedBalance} >= 0`),
    t.check(
      "customer_wallets_frozen_reason_chk",
      sql`${tbl.isFrozen} = false OR ${tbl.frozenReason} IS NOT NULL`,
    ),
  ],
);

// Append-only wallet ledger
export const walletTransactionsTable = table(
  "wallet_transactions",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    walletId: t
      .uuid("wallet_id")
      .notNull()
      .references(() => customerWalletsTable.id, { onDelete: "restrict" }),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    customerId: t
      .uuid("customer_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    transactionType: walletTransactionTypeEnum("transaction_type").notNull(),

    // Positive = credit, negative = debit
    amount: t.integer("amount").notNull(),
    balanceBefore: t.integer("balance_before").notNull(),
    balanceAfter: t.integer("balance_after").notNull(),

    // Related entities
    orderId: t.uuid("order_id"),
    refundId: t.uuid("refund_id"),
    paymentTransactionId: t.uuid("payment_transaction_id"),

    idempotencyKey: t.varchar("idempotency_key", { length: 255 }),

    description: t.text("description").notNull(),
    internalNote: t.text("internal_note"),

    processedBy: t
      .uuid("processed_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    reversedTransactionId: t.uuid("reversed_transaction_id"),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("wallet_txns_idempotency_uq_idx")
      .on(tbl.idempotencyKey)
      .where(sql`idempotency_key IS NOT NULL`),

    t.index("wallet_txns_wallet_idx").on(tbl.walletId, tbl.createdAt),
    t.index("wallet_txns_customer_idx").on(tbl.customerId, tbl.createdAt),
    t.index("wallet_txns_type_idx").on(tbl.transactionType, tbl.shopId),
    t
      .index("wallet_txns_order_idx")
      .on(tbl.orderId)
      .where(sql`order_id IS NOT NULL`),

    t.check("wallet_txns_balance_after_chk", sql`${tbl.balanceAfter} >= 0`),
  ],
);

// =============================================================================
// SECTION 8 — SHIPMENTS, SHIPMENT ITEMS & SHIPPING RATES
// =============================================================================

export const shipmentsTable = table(
  "shipments",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    orderId: t
      .uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "restrict" }),

    // Human-readable reference
    shipmentNumber: t.varchar("shipment_number", { length: 50 }).notNull(),

    // Carrier
    carrier: t.varchar("carrier", { length: 100 }),
    carrierService: t.varchar("carrier_service", { length: 100 }),
    trackingNumber: t.varchar("tracking_number", { length: 100 }),
    trackingUrl: t.text("tracking_url"),

    shippingMethod: t.varchar("shipping_method", { length: 100 }),
    shippingCost: t.integer("shipping_cost").notNull(), // paise
    insuranceAmount: t.integer("insurance_amount").default(0).notNull(),

    // Package
    packageCount: t.integer("package_count").default(1).notNull(),
    totalWeightGrams: t.integer("total_weight_grams"),
    dimensions: t.jsonb("dimensions").$type<{
      lengthCm: number;
      widthCm: number;
      heightCm: number;
    }>(),

    // Addresses
    fromAddress: t
      .jsonb("from_address")
      .$type<{
        name: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string;
      }>()
      .notNull(),

    toAddress: t
      .jsonb("to_address")
      .$type<{
        name: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string;
      }>()
      .notNull(),

    status: shippingStatusEnum("status").notNull().default("pending"),

    estimatedDeliveryDate: t.date("estimated_delivery_date"),
    actualDeliveryDate: t.date("actual_delivery_date"),
    shippedAt: t.timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: t.timestamp("delivered_at", { withTimezone: true }),

    // POD
    signatureRequired: t.boolean("signature_required").default(false).notNull(),
    signatureObtained: t.boolean("signature_obtained").default(false).notNull(),
    signedBy: t.varchar("signed_by", { length: 255 }),
    deliveryProofKey: t.varchar("delivery_proof_key", { length: 500 }),
    deliveryNotes: t.text("delivery_notes"),

    // Shipping label
    labelKey: t.varchar("label_key", { length: 500 }),
    labelPurchasedAt: t.timestamp("label_purchased_at", {
      withTimezone: true,
    }),
    labelCostPaise: t.integer("label_cost_paise"),

    // International customs
    customsDeclaration: t.jsonb("customs_declaration").$type<{
      contentType: string;
      contentDescription: string;
      customsValue: number;
      currency: string;
      harmonizedCode?: string;
      originCountry: string;
    }>(),

    // Failed delivery
    deliveryAttempts: t.integer("delivery_attempts").default(0).notNull(),
    lastDeliveryAttemptAt: t.timestamp("last_delivery_attempt_at", {
      withTimezone: true,
    }),
    deliveryFailureReason: t.text("delivery_failure_reason"),

    // Return to sender
    returnedToSender: t.boolean("returned_to_sender").default(false).notNull(),
    returnReason: t.text("return_reason"),
    returnedAt: t.timestamp("returned_at", { withTimezone: true }),

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
      .uniqueIndex("shipments_number_shop_uq_idx")
      .on(tbl.shopId, tbl.shipmentNumber),

    t.index("shipments_order_idx").on(tbl.orderId),
    t
      .index("shipments_tracking_idx")
      .on(tbl.trackingNumber)
      .where(sql`tracking_number IS NOT NULL`),
    t.index("shipments_shop_idx").on(tbl.shopId, tbl.createdAt),
    t.index("shipments_status_idx").on(tbl.status, tbl.shopId),

    t.check("shipments_cost_chk", sql`${tbl.shippingCost} >= 0`),
  ],
);

export const shipmentItemsTable = table(
  "shipment_items",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shipmentId: t
      .uuid("shipment_id")
      .notNull()
      .references(() => shipmentsTable.id, { onDelete: "cascade" }),

    orderItemId: t
      .uuid("order_item_id")
      .notNull()
      .references(() => orderItemsTable.id, { onDelete: "restrict" }),

    quantity: t.integer("quantity").notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("shipment_items_uq_idx").on(tbl.shipmentId, tbl.orderItemId),

    t.index("shipment_items_shipment_idx").on(tbl.shipmentId),
    t.index("shipment_items_order_item_idx").on(tbl.orderItemId),

    t.check("shipment_items_qty_chk", sql`${tbl.quantity} > 0`),
  ],
);

export const shippingRatesTable = table(
  "shipping_rates",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    name: t.varchar("name", { length: 255 }).notNull(),
    displayName: t.varchar("display_name", { length: 255 }).notNull(),
    description: t.text("description"),

    carrier: t.varchar("carrier", { length: 100 }),
    serviceCode: t.varchar("service_code", { length: 100 }),

    // Pricing (paise)
    baseRate: t.integer("base_rate").notNull(),
    additionalItemRate: t.integer("additional_item_rate").default(0).notNull(),
    freeShippingThreshold: t.integer("free_shipping_threshold"),

    // Weight-based pricing bands
    weightBasedPricing: t
      .jsonb("weight_based_pricing")
      .$type<{ minGrams: number; maxGrams: number; paise: number }[]>(),

    // Delivery time
    minDeliveryDays: t.smallint("min_delivery_days"),
    maxDeliveryDays: t.smallint("max_delivery_days"),

    // Geographic restrictions
    allowedPincodes: t.jsonb("allowed_pincodes").$type<string[]>(),
    excludedPincodes: t.jsonb("excluded_pincodes").$type<string[]>(),
    allowedStates: t.jsonb("allowed_states").$type<string[]>(),

    // Order amount restrictions
    minOrderAmount: t.integer("min_order_amount"),
    maxOrderAmount: t.integer("max_order_amount"),

    isActive: t.boolean("is_active").default(true).notNull(),
    displayOrder: t.smallint("display_order").default(0).notNull(),

    availableFrom: t.timestamp("available_from", { withTimezone: true }),
    availableUntil: t.timestamp("available_until", { withTimezone: true }),

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
    t.index("shipping_rates_shop_idx").on(tbl.shopId, tbl.isActive),

    t.check("shipping_rates_base_rate_chk", sql`${tbl.baseRate} >= 0`),
    t.check(
      "shipping_rates_delivery_days_chk",
      sql`
        ${tbl.minDeliveryDays} IS NULL OR
        ${tbl.maxDeliveryDays} IS NULL OR
        ${tbl.maxDeliveryDays} >= ${tbl.minDeliveryDays}
      `,
    ),
  ],
);

// =============================================================================
// SECTION 9 — INVENTORY ITEMS & MOVEMENTS
// =============================================================================

export const inventoryItemsTable = table(
  "inventory_items",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    shopProductVariantId: t
      .uuid("shop_product_variant_id")
      .references(() => shopProductVariantTable.id, { onDelete: "cascade" }),

    sku: t.varchar("sku", { length: 100 }).notNull(),

    // Location
    warehouseId: t.uuid("warehouse_id"),
    binLocation: t.varchar("bin_location", { length: 100 }),

    // Stock levels
    quantityOnHand: t.integer("quantity_on_hand").default(0).notNull(),
    quantityReserved: t.integer("quantity_reserved").default(0).notNull(),
    quantityAvailable: t.integer("quantity_available").default(0).notNull(),
    quantityOnOrder: t.integer("quantity_on_order").default(0).notNull(),
    quantityDamaged: t.integer("quantity_damaged").default(0).notNull(),
    quantityInTransit: t.integer("quantity_in_transit").default(0).notNull(),

    // Thresholds
    lowStockThreshold: t.integer("low_stock_threshold").default(10).notNull(),
    reorderPoint: t.integer("reorder_point"),
    reorderQuantity: t.integer("reorder_quantity"),

    // Cost (paise)
    unitCostPaise: t.integer("unit_cost_paise"),

    // Policy
    trackInventory: t.boolean("track_inventory").default(true).notNull(),
    allowBackorder: t.boolean("allow_backorder").default(false).notNull(),

    // Computed status flags
    isLowStock: t.boolean("is_low_stock").default(false).notNull(),
    isOutOfStock: t.boolean("is_out_of_stock").default(false).notNull(),

    lastStockCheckAt: t.timestamp("last_stock_check_at", {
      withTimezone: true,
    }),
    lastRestockedAt: t.timestamp("last_restocked_at", { withTimezone: true }),

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
    // One inventory record per product/variant/warehouse
    t
      .uniqueIndex("inventory_items_product_location_uq_idx")
      .on(tbl.shopProductId, tbl.shopProductVariantId, tbl.warehouseId),

    t.index("inventory_items_shop_idx").on(tbl.shopId),
    t.index("inventory_items_product_idx").on(tbl.shopProductId),
    t.index("inventory_items_sku_idx").on(tbl.sku),
    t
      .index("inventory_items_low_stock_idx")
      .on(tbl.isLowStock, tbl.shopId)
      .where(sql`is_low_stock = true`),
    t
      .index("inventory_items_out_of_stock_idx")
      .on(tbl.isOutOfStock, tbl.shopId)
      .where(sql`is_out_of_stock = true`),

    t.check(
      "inventory_items_quantities_chk",
      sql`
        ${tbl.quantityOnHand}    >= 0 AND
        ${tbl.quantityReserved}  >= 0 AND
        ${tbl.quantityAvailable} >= 0 AND
        ${tbl.quantityOnOrder}   >= 0 AND
        ${tbl.quantityDamaged}   >= 0
      `,
    ),
    t.check(
      "inventory_items_available_chk",
      sql`
        ${tbl.quantityAvailable} = ${tbl.quantityOnHand} - ${tbl.quantityReserved}
      `,
    ),
  ],
);

// Append-only inventory audit trail
export const inventoryMovementsTable = table(
  "inventory_movements",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    inventoryItemId: t
      .uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItemsTable.id, { onDelete: "cascade" }),

    movementType: inventoryMovementTypeEnum("movement_type").notNull(),

    quantity: t.integer("quantity").notNull(),

    quantityBefore: t.integer("quantity_before").notNull(),
    quantityAfter: t.integer("quantity_after").notNull(),

    // Related entities
    orderId: t.uuid("order_id"),
    orderItemId: t.uuid("order_item_id"),
    refundId: t.uuid("refund_id"),
    purchaseOrderId: t.uuid("purchase_order_id"),

    // Transfer between locations
    fromLocationId: t.uuid("from_location_id"),
    toLocationId: t.uuid("to_location_id"),

    // Cost (paise)
    unitCostPaise: t.integer("unit_cost_paise"),

    reason: t.varchar("reason", { length: 200 }),
    notes: t.text("notes"),

    processedBy: t
      .uuid("processed_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("inventory_movements_item_idx")
      .on(tbl.inventoryItemId, tbl.createdAt),
    t.index("inventory_movements_type_idx").on(tbl.movementType),
    t
      .index("inventory_movements_order_idx")
      .on(tbl.orderId)
      .where(sql`order_id IS NOT NULL`),
  ],
);

// =============================================================================
// SECTION 10 — INVOICES
// =============================================================================

export const invoicesTable = table(
  "invoices",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    orderId: t
      .uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "restrict" }),

    // Human-readable reference
    invoiceNumber: t.varchar("invoice_number", { length: 50 }).notNull(),

    // Amounts (paise)
    subtotal: t.integer("subtotal").notNull(),
    taxTotal: t.integer("tax_total").notNull(),
    discountTotal: t.integer("discount_total").default(0).notNull(),
    shippingTotal: t.integer("shipping_total").default(0).notNull(),
    totalAmount: t.integer("total_amount").notNull(),
    amountPaid: t.integer("amount_paid").default(0).notNull(),
    amountDue: t.integer("amount_due").notNull(),

    currency: t.varchar("currency", { length: 3 }).notNull(),

    status: invoiceStatusEnum("status").notNull().default("draft"),

    // Dates
    invoiceDate: t.date("invoice_date").notNull(),
    dueDate: t.date("due_date"),
    paidDate: t.date("paid_date"),

    // Parties
    billedTo: t
      .jsonb("billed_to")
      .$type<{
        name: string;
        email: string;
        company?: string;
        gstin?: string;
        address: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
      }>()
      .notNull(),

    billedFrom: t
      .jsonb("billed_from")
      .$type<{
        name: string;
        company: string;
        email: string;
        phone: string;
        gstin: string;
        address: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
      }>()
      .notNull(),

    taxBreakdown: t
      .jsonb("tax_breakdown")
      .$type<{ name: string; rate: number; amount: number }[]>(),

    paymentTerms: t.varchar("payment_terms", { length: 100 }),
    notes: t.text("notes"),
    termsAndConditions: t.text("terms_and_conditions"),

    // PDF stored in object store
    pdfKey: t.varchar("pdf_key", { length: 500 }),
    pdfGeneratedAt: t.timestamp("pdf_generated_at", { withTimezone: true }),

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
    // One invoice per order
    t.uniqueIndex("invoices_order_uq_idx").on(tbl.orderId),
    t
      .uniqueIndex("invoices_number_shop_uq_idx")
      .on(tbl.shopId, tbl.invoiceNumber),

    t.index("invoices_shop_idx").on(tbl.shopId, tbl.invoiceDate),
    t.index("invoices_status_idx").on(tbl.status, tbl.shopId),

    t.check(
      "invoices_amounts_chk",
      sql`
        ${tbl.subtotal}      >= 0 AND
        ${tbl.totalAmount}   >= 0 AND
        ${tbl.amountPaid}    >= 0 AND
        ${tbl.amountDue}     >= 0
      `,
    ),
    t.check(
      "invoices_amount_due_chk",
      sql`${tbl.amountDue} = ${tbl.totalAmount} - ${tbl.amountPaid}`,
    ),
  ],
);

// =============================================================================
// SECTION 11 — SUBSCRIPTION PLANS & SUBSCRIPTIONS
// =============================================================================

export const subscriptionPlansTable = table(
  "subscription_plans",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    name: t.varchar("name", { length: 255 }).notNull(),
    slug: t.varchar("slug", { length: 280 }).notNull(),
    description: t.text("description"),

    // Pricing (paise)
    amount: t.integer("amount").notNull(),
    currency: t.varchar("currency", { length: 3 }).default("INR").notNull(),

    // Billing cycle
    billingInterval: t.varchar("billing_interval", { length: 20 }).notNull(),
    // day | week | month | year
    billingIntervalCount: t
      .integer("billing_interval_count")
      .default(1)
      .notNull(),
    // "every X intervals" — e.g. 2 months = interval=month, count=2

    trialPeriodDays: t.integer("trial_period_days"),
    minimumTermMonths: t.integer("minimum_term_months"),

    // Products included in the subscription
    productIds: t.jsonb("product_ids").$type<string[]>(),
    features: t.jsonb("features").$type<string[]>(),

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
    t
      .uniqueIndex("subscription_plans_shop_slug_uq_idx")
      .on(tbl.shopId, tbl.slug),

    t.index("subscription_plans_shop_idx").on(tbl.shopId, tbl.isActive),

    t.check("subscription_plans_amount_chk", sql`${tbl.amount} > 0`),
    t.check(
      "subscription_plans_interval_count_chk",
      sql`${tbl.billingIntervalCount} > 0`,
    ),
  ],
);

export const subscriptionsTable = table(
  "subscriptions",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    customerId: t
      .uuid("customer_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    planId: t
      .uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlansTable.id, { onDelete: "restrict" }),

    status: subscriptionStatusEnumV2("status").notNull(),

    // Billing snapshot
    amount: t.integer("amount").notNull(),
    currency: t.varchar("currency", { length: 3 }).notNull(),
    billingInterval: t.varchar("billing_interval", { length: 20 }).notNull(),
    billingIntervalCount: t.integer("billing_interval_count").notNull(),

    currentPeriodStart: t
      .timestamp("current_period_start", {
        withTimezone: true,
      })
      .notNull(),
    currentPeriodEnd: t
      .timestamp("current_period_end", {
        withTimezone: true,
      })
      .notNull(),

    paymentMethodId: t
      .uuid("payment_method_id")
      .references(() => savedPaymentMethodsTable.id, {
        onDelete: "set null",
      }),

    // Trial
    trialStart: t.timestamp("trial_start", { withTimezone: true }),
    trialEnd: t.timestamp("trial_end", { withTimezone: true }),

    // Cancellation
    cancelAtPeriodEnd: t
      .boolean("cancel_at_period_end")
      .default(false)
      .notNull(),
    cancelledAt: t.timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: t.text("cancellation_reason"),

    // Billing tracking
    nextBillingDate: t.timestamp("next_billing_date", { withTimezone: true }),
    lastBillingDate: t.timestamp("last_billing_date", { withTimezone: true }),
    billingFailureCount: t
      .integer("billing_failure_count")
      .default(0)
      .notNull(),
    lastBillingError: t.text("last_billing_error"),

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
    t.index("subscriptions_customer_idx").on(tbl.customerId),
    t.index("subscriptions_shop_status_idx").on(tbl.shopId, tbl.status),
    t
      .index("subscriptions_next_billing_idx")
      .on(tbl.nextBillingDate)
      .where(sql`status = 'active'`),

    t.check("subscriptions_amount_chk", sql`${tbl.amount} > 0`),
    t.check(
      "subscriptions_period_chk",
      sql`${tbl.currentPeriodEnd} > ${tbl.currentPeriodStart}`,
    ),
    t.check(
      "subscriptions_billing_failure_chk",
      sql`${tbl.billingFailureCount} >= 0`,
    ),
  ],
);

// =============================================================================
// SECTION 12 — ABANDONED CARTS
// =============================================================================

export const abandonedCartsTable = table(
  "abandoned_carts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    // Source cart
    cartId: t
      .uuid("cart_id")
      .references(() => cartsTable.id, { onDelete: "set null" }),

    customerId: t
      .uuid("customer_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    customerEmail: t.varchar("customer_email", { length: 255 }),
    customerPhone: t.varchar("customer_phone", { length: 20 }),

    sessionId: t.varchar("session_id", { length: 255 }).notNull(),

    // Snapshot of cart items at abandonment time
    items: t
      .jsonb("items")
      .$type<
        {
          shopProductId: string;
          shopProductVariantId?: string;
          quantity: number;
          unitPrice: number; // paise
          name: string;
          imageUrl?: string;
        }[]
      >()
      .notNull(),

    // Amounts (paise)
    subtotal: t.integer("subtotal").notNull(),
    estimatedTotal: t.integer("estimated_total").notNull(),
    currency: t.varchar("currency", { length: 3 }).default("INR").notNull(),

    // Recovery
    isRecovered: t.boolean("is_recovered").default(false).notNull(),
    recoveredOrderId: t
      .uuid("recovered_order_id")
      .references(() => ordersTable.id, { onDelete: "set null" }),
    recoveredAt: t.timestamp("recovered_at", { withTimezone: true }),

    // Recovery emails
    recoveryEmailsSent: t.integer("recovery_emails_sent").default(0).notNull(),
    lastEmailSentAt: t.timestamp("last_email_sent_at", { withTimezone: true }),
    emailOpenedAt: t.timestamp("email_opened_at", { withTimezone: true }),
    emailClickedAt: t.timestamp("email_clicked_at", { withTimezone: true }),

    // Checkout progress
    checkoutStep: t.varchar("checkout_step", { length: 50 }),

    // Device & geo
    deviceType: t.varchar("device_type", { length: 20 }),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    abandonedAt: t
      .timestamp("abandoned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
  },
  (tbl) => [
    t.index("abandoned_carts_shop_idx").on(tbl.shopId, tbl.abandonedAt),
    t
      .index("abandoned_carts_email_idx")
      .on(tbl.customerEmail, tbl.shopId)
      .where(sql`customer_email IS NOT NULL`),
    t
      .index("abandoned_carts_recovery_idx")
      .on(tbl.isRecovered, tbl.shopId)
      .where(sql`is_recovered = false`),
    t
      .index("abandoned_carts_next_email_idx")
      .on(tbl.lastEmailSentAt, tbl.recoveryEmailsSent)
      .where(sql`is_recovered = false AND expires_at IS NOT NULL`),

    t.check("abandoned_carts_subtotal_chk", sql`${tbl.subtotal} >= 0`),
  ],
);

// =============================================================================
// SECTION 13 — PAYMENT DISPUTES / CHARGEBACKS
// =============================================================================

export const paymentDisputesTable = table(
  "payment_disputes",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    orderId: t
      .uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "restrict" }),

    paymentTransactionId: t
      .uuid("payment_transaction_id")
      .notNull()
      .references(() => paymentTransactionsTable.id, { onDelete: "restrict" }),

    // Gateway-issued dispute reference
    externalDisputeId: t
      .varchar("external_dispute_id", { length: 255 })
      .notNull(),

    // Amounts (paise)
    amount: t.integer("amount").notNull(),
    currency: t.varchar("currency", { length: 3 }).notNull(),

    reason: t.varchar("reason", { length: 100 }).notNull(),

    status: disputeStatusEnum("status").notNull(),

    disputedAt: t.timestamp("disputed_at", { withTimezone: true }).notNull(),
    respondByDate: t.timestamp("respond_by_date", { withTimezone: true }),
    resolvedAt: t.timestamp("resolved_at", { withTimezone: true }),

    // Evidence
    evidenceSubmitted: t.boolean("evidence_submitted").default(false).notNull(),
    evidenceSubmittedAt: t.timestamp("evidence_submitted_at", {
      withTimezone: true,
    }),
    evidenceDocuments: t
      .jsonb("evidence_documents")
      .$type<{ type: string; key: string; uploadedAt: string }[]>(),
    merchantResponse: t.text("merchant_response"),
    networkReasonCode: t.varchar("network_reason_code", { length: 100 }),

    // Outcome
    outcome: t.varchar("outcome", { length: 50 }),
    outcomeReason: t.text("outcome_reason"),

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
      .uniqueIndex("payment_disputes_external_id_uq_idx")
      .on(tbl.externalDisputeId),

    t.index("payment_disputes_shop_idx").on(tbl.shopId, tbl.status),
    t.index("payment_disputes_order_idx").on(tbl.orderId),
    t
      .index("payment_disputes_respond_by_idx")
      .on(tbl.respondByDate)
      .where(sql`status IN ('needs_response', 'warning_needs_response')`),

    t.check("payment_disputes_amount_chk", sql`${tbl.amount} > 0`),
  ],
);

// =============================================================================
// SECTION 14 — ORDER ANALYTICS (daily roll-up)
// =============================================================================

export const orderAnalyticsTable = table(
  "order_analytics",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    date: t.date("date").notNull(),
    dayOfWeek: t.smallint("day_of_week").notNull(), // 0=Sunday … 6=Saturday

    // Order counts
    totalOrders: t.integer("total_orders").default(0).notNull(),
    paidOrders: t.integer("paid_orders").default(0).notNull(),
    cancelledOrders: t.integer("cancelled_orders").default(0).notNull(),
    refundedOrders: t.integer("refunded_orders").default(0).notNull(),
    codOrders: t.integer("cod_orders").default(0).notNull(),

    // Revenue (paise)
    grossRevenue: t
      .bigint("gross_revenue", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    netRevenue: t
      .bigint("net_revenue", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    averageOrderValue: t.integer("average_order_value"),

    // Items
    totalItemsSold: t.integer("total_items_sold").default(0).notNull(),

    // Customers
    newCustomers: t.integer("new_customers").default(0).notNull(),
    returningCustomers: t.integer("returning_customers").default(0).notNull(),
    guestCheckouts: t.integer("guest_checkouts").default(0).notNull(),

    // Discounts & promotions
    totalDiscounts: t
      .bigint("total_discounts", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    ordersWithDiscounts: t
      .integer("orders_with_discounts")
      .default(0)
      .notNull(),

    // Shipping
    totalShippingRevenue: t
      .bigint("total_shipping_revenue", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    freeShippingOrders: t.integer("free_shipping_orders").default(0).notNull(),

    // Tax
    totalTaxCollected: t
      .bigint("total_tax_collected", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    // Refunds
    totalRefunded: t
      .bigint("total_refunded", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    fullRefundsCount: t.integer("full_refunds_count").default(0).notNull(),
    partialRefundsCount: t
      .integer("partial_refunds_count")
      .default(0)
      .notNull(),

    // Payment method breakdown
    paymentMethodBreakdown: t
      .jsonb("payment_method_breakdown")
      .$type<Record<string, number>>(),

    // Conversion funnel
    cartAbandonmentRate: t.decimal("cart_abandonment_rate", {
      precision: 5,
      scale: 2,
    }),
    checkoutConversionRate: t.decimal("checkout_conversion_rate", {
      precision: 5,
      scale: 2,
    }),

    // Device breakdown
    mobileOrders: t.integer("mobile_orders").default(0).notNull(),
    desktopOrders: t.integer("desktop_orders").default(0).notNull(),
    tabletOrders: t.integer("tablet_orders").default(0).notNull(),

    // Hourly distribution
    hourlyDistribution: t
      .jsonb("hourly_distribution")
      .$type<{ hour: number; orders: number; revenue: number }[]>(),

    // Growth vs previous day
    revenueGrowth: t.decimal("revenue_growth", { precision: 10, scale: 2 }),
    ordersGrowth: t.decimal("orders_growth", { precision: 10, scale: 2 }),

    calculatedAt: t
      .timestamp("calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("order_analytics_shop_date_uq_idx").on(tbl.shopId, tbl.date),
    t.index("order_analytics_shop_idx").on(tbl.shopId, tbl.date),
  ],
);

// =============================================================================
// SECTION 15 — GIFT CARDS & GIFT CARD TRANSACTIONS
// =============================================================================

export const giftCardsTable = table(
  "gift_cards",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    code: t.varchar("code", { length: 50 }).notNull(),

    // Balances (paise)
    initialBalance: t.integer("initial_balance").notNull(),
    currentBalance: t.integer("current_balance").notNull(),
    currency: t.varchar("currency", { length: 3 }).default("INR").notNull(),

    // Purchase
    purchasedBy: t
      .uuid("purchased_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    purchaseOrderId: t
      .uuid("purchase_order_id")
      .references(() => ordersTable.id, { onDelete: "set null" }),

    // Recipient
    recipientEmail: t.varchar("recipient_email", { length: 255 }),
    recipientName: t.varchar("recipient_name", { length: 255 }),
    senderName: t.varchar("sender_name", { length: 255 }),
    message: t.text("message"),

    // Status
    isActive: t.boolean("is_active").default(true).notNull(),
    isFullyRedeemed: t.boolean("is_fully_redeemed").default(false).notNull(),

    activatedAt: t.timestamp("activated_at", { withTimezone: true }),
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
    lastUsedAt: t.timestamp("last_used_at", { withTimezone: true }),

    usageCount: t.integer("usage_count").default(0).notNull(),

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
    t.uniqueIndex("gift_cards_code_shop_uq_idx").on(tbl.shopId, tbl.code),

    t.index("gift_cards_shop_idx").on(tbl.shopId, tbl.isActive),
    t
      .index("gift_cards_recipient_idx")
      .on(tbl.recipientEmail)
      .where(sql`recipient_email IS NOT NULL`),

    t.check(
      "gift_cards_balances_chk",
      sql`
        ${tbl.initialBalance} > 0 AND
        ${tbl.currentBalance} >= 0 AND
        ${tbl.currentBalance} <= ${tbl.initialBalance}
      `,
    ),
  ],
);

// Append-only gift card ledger
export const giftCardTransactionsTable = table(
  "gift_card_transactions",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    giftCardId: t
      .uuid("gift_card_id")
      .notNull()
      .references(() => giftCardsTable.id, { onDelete: "restrict" }),

    orderId: t
      .uuid("order_id")
      .references(() => ordersTable.id, { onDelete: "set null" }),

    transactionType: giftCardTransactionTypeEnum("transaction_type").notNull(),

    amount: t.integer("amount").notNull(), // paise
    balanceBefore: t.integer("balance_before").notNull(),
    balanceAfter: t.integer("balance_after").notNull(),

    note: t.text("note"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("gift_card_txns_card_idx").on(tbl.giftCardId, tbl.createdAt),
    t
      .index("gift_card_txns_order_idx")
      .on(tbl.orderId)
      .where(sql`order_id IS NOT NULL`),

    t.check("gift_card_txns_amount_chk", sql`${tbl.amount} > 0`),
    t.check("gift_card_txns_balance_after_chk", sql`${tbl.balanceAfter} >= 0`),
  ],
);
