import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userTable } from "./auth";
import { shopsTable } from "./shop";
import { citiesTable } from "./location";
import {
  ordersTable,
  orderItemsTable,
  paymentTransactionsTable,
  refundsTable,
  savedPaymentMethodsTable,
} from "./commerce";
import { deliveryTasksTable } from "./logistic";
import { shopProductTable } from "./catalog";
import {
  splitStatusEnum,
  shopEarningsEntryTypeEnum,
  shopPayoutStatusEnum,
  taxTypeEnum,
  gstTransactionTypeEnum,
  platformFeePaymentStatusEnum,
  commissionScopeEnum,
  shopSubscriptionBillingStatusEnum,
  billingCycleEnum,
  feeDeductionMethodEnum,
  commissionAppliedOnEnum,
} from "../shared/enums";

// =============================================================================
// FINANCIAL MODEL
//
// Covers:
//   ── ORDER FINANCIAL SPLIT ──────────────────────────────────────────────────
//   1.  Order Financial Split  (per-order money allocation, the core of the
//                               platform's business model)
//   2.  Order Financial Split Line Items  (how each order item contributes)
//   3.  Refund Financial Adjustments  (reverse a split on refund)
//
//   ── SHOP EARNINGS ──────────────────────────────────────────────────────────
//   4.  Shop Earnings Ledger  (append-only, every shop earning event)
//   5.  Shop Payouts          (periodic settlement to shopkeeper's bank)
//
//   ── TAX ────────────────────────────────────────────────────────────────────
//   6.  Tax Categories        (GST slab definitions: 0/5/12/18/28%)
//   7.  Tax Rules             (intra-state CGST+SGST vs inter-state IGST)
//   8.  Order Tax Ledger      (immutable per-order tax record for filing)
//
//   ── PLATFORM SHOP FEES (SHOP RENT) ────────────────────────────────────────
//   9.  Platform Fee Plans    (free / basic / pro / enterprise tiers)
//  10.  Shop Subscriptions    (which plan a shop is on + billing cycle)
//  11.  Platform Fee Invoices (monthly invoice issued to each shop)
//  12.  Platform Fee Payments (records of shops paying their invoice)
//
//   ── PLATFORM COMMISSION CONFIG ────────────────────────────────────────────
//  13.  Commission Rate Config  (global defaults + per-city + per-shop overrides)
//
//   ── FINANCIAL ANALYTICS ───────────────────────────────────────────────────
//  14.  Platform Revenue Analytics  (daily roll-up of all revenue streams)
//  15.  Shop Revenue Analytics      (daily roll-up per shop)
//
// ─── Business rules encoded here ─────────────────────────────────────────────
//
//   Order total = shopEarning + deliveryEarning + platformCommission + tax
//
//   platformCommission is charged as a percentage of the shopEarning
//   (i.e. platform takes X% of what the shop earns on each order).
//
//   Delivery fee is charged to the customer and split:
//     partnerEarning = deliveryFee × partnerSurgeShareRate  (delivery.model.ts)
//     platformDeliveryCommission = deliveryFee − partnerEarning
//
//   Monthly shop rent = platformFeePlansTable.monthlyAmountPaise
//     (applied to the plan tier from shopsTable.subscriptionPlan)
//
// ─── Monetary convention ─────────────────────────────────────────────────────
//   All amounts in paise (₹ × 100) stored as INTEGER unless explicitly noted.
//   bigint for lifetime/analytics aggregates.
//
// ─── Append-only tables ──────────────────────────────────────────────────────
//   shopEarningsLedgerTable, orderTaxLedgerTable.
//   NEVER issue UPDATE or DELETE on these tables.
// =============================================================================

// =============================================================================
// SECTION 1 — ORDER FINANCIAL SPLIT
//
// One row per delivered (or partially refunded) order.
// Answers: "How much does each party receive from order #X?"
// =============================================================================

export const orderFinancialSplitTable = table(
  "order_financial_splits",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    orderId: t
      .uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "restrict" }),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    // The payment transaction that funded this order
    paymentTransactionId: t
      .uuid("payment_transaction_id")
      .references(() => paymentTransactionsTable.id, { onDelete: "set null" }),

    // The delivery task associated with this order
    deliveryTaskId: t
      .uuid("delivery_task_id")
      .references(() => deliveryTasksTable.id, { onDelete: "set null" }),

    // ── Order totals (paise) ──────────────────────────────────────────────
    orderTotalPaise: t.integer("order_total_paise").notNull(),
    // The total amount the customer paid (includes tax, delivery, tip)

    itemsSubtotalPaise: t.integer("items_subtotal_paise").notNull(),
    // Sum of item prices before discounts and tax

    discountTotalPaise: t.integer("discount_total_paise").default(0).notNull(),
    // Total discounts applied (coupons, offers)

    itemsTaxPaise: t.integer("items_tax_paise").default(0).notNull(),
    // GST on items

    deliveryFeePaise: t.integer("delivery_fee_paise").default(0).notNull(),
    // Delivery fee charged to customer

    deliveryTaxPaise: t.integer("delivery_tax_paise").default(0).notNull(),
    // GST on delivery fee (if applicable)

    tipPaise: t.integer("tip_paise").default(0).notNull(),
    // Customer tip (goes to delivery partner)

    // ── Platform commission on items ──────────────────────────────────────
    // Platform charges a % of the shop's gross item revenue
    commissionRateApplied: t.decimal(
      "commission_rate_applied",
      { precision: 5, scale: 4 },
    ).notNull(),
    // e.g. 0.1200 = 12%  (rate snapshotted at order time)

    platformCommissionPaise: t.integer("platform_commission_paise").notNull(),
    // = ROUND(itemsSubtotalPaise × commissionRateApplied)
    // Note: commission is on the pre-discount subtotal unless overridden

    platformCommissionTaxPaise: t.integer(
      "platform_commission_tax_paise",
    ).default(0).notNull(),
    // GST on the platform commission (paid by platform, for B2B invoice)

    // ── Platform delivery cut ─────────────────────────────────────────────
    platformDeliveryCommissionPaise: t.integer(
      "platform_delivery_commission_paise",
    ).default(0).notNull(),
    // = deliveryFeePaise − partnerEarningPaise

    // ── Delivery partner earning ──────────────────────────────────────────
    partnerEarningPaise: t.integer("partner_earning_paise").default(0).notNull(),
    // = deliveryFeePaise × partnerSurgeShareRate + surge + tip
    // Snapshotted here from deliveryTasksTable for single-source settlement query

    // ── Shop earning ──────────────────────────────────────────────────────
    shopEarningPaise: t.integer("shop_earning_paise").notNull(),
    // = itemsSubtotalPaise − discountTotalPaise − platformCommissionPaise

    // ── COD handling ──────────────────────────────────────────────────────
    isCod: t.boolean("is_cod").default(false).notNull(),
    codAmountPaise: t.integer("cod_amount_paise"),
    // Amount the delivery partner collected in cash
    codRemittedToShopPaise: t.integer("cod_remitted_to_shop_paise"),
    // After platform deducted its commission from the COD cash

    // ── Status ────────────────────────────────────────────────────────────
    status: splitStatusEnum("status").notNull().default("pending"),

    // When the split was finalised (all parties' earnings credited)
    calculatedAt: t.timestamp("calculated_at", { withTimezone: true }),
    settledAt: t.timestamp("settled_at", { withTimezone: true }),

    // Commission rate config that produced this split
    commissionConfigId: t.uuid("commission_config_id"),
    // FK to commissionRateConfigsTable (forward ref — see migration notes)

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
    // One split record per order
    t.uniqueIndex("order_financial_splits_order_uq_idx").on(tbl.orderId),

    t.index("order_financial_splits_shop_idx").on(tbl.shopId, tbl.createdAt),
    t.index("order_financial_splits_status_idx").on(tbl.status, tbl.createdAt),

    // Unsettled splits — dispatcher query for settlement runs
    t
      .index("order_financial_splits_unsettled_idx")
      .on(tbl.shopId, tbl.calculatedAt)
      .where(sql`status = 'calculated'`),

    t.check(
      "order_splits_amounts_chk",
      sql`
        ${tbl.orderTotalPaise}                >= 0 AND
        ${tbl.itemsSubtotalPaise}             >= 0 AND
        ${tbl.discountTotalPaise}             >= 0 AND
        ${tbl.itemsTaxPaise}                  >= 0 AND
        ${tbl.deliveryFeePaise}               >= 0 AND
        ${tbl.platformCommissionPaise}        >= 0 AND
        ${tbl.partnerEarningPaise}            >= 0 AND
        ${tbl.shopEarningPaise}               >= 0
      `,
    ),
    t.check(
      "order_splits_commission_rate_chk",
      sql`
        ${tbl.commissionRateApplied} >= 0 AND
        ${tbl.commissionRateApplied} <= 1
      `,
    ),
    t.check(
      "order_splits_cod_chk",
      sql`${tbl.isCod} = false OR ${tbl.codAmountPaise} IS NOT NULL`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Order Financial Split — per line item contribution
// One row per order item, showing how each item's price feeds into the split.
// ---------------------------------------------------------------------------

export const orderSplitLineItemsTable = table(
  "order_split_line_items",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    splitId: t
      .uuid("split_id")
      .notNull()
      .references(() => orderFinancialSplitTable.id, { onDelete: "cascade" }),

    orderItemId: t
      .uuid("order_item_id")
      .notNull()
      .references(() => orderItemsTable.id, { onDelete: "restrict" }),

    shopProductId: t
      .uuid("shop_product_id")
      .references(() => shopProductTable.id, { onDelete: "set null" }),

    // Paise
    itemSubtotalPaise: t.integer("item_subtotal_paise").notNull(),
    // quantity × unitPrice before discount

    discountPaise: t.integer("discount_paise").default(0).notNull(),
    taxPaise: t.integer("tax_paise").default(0).notNull(),

    // Applied tax rate snapshotted at order time
    taxCategoryId: t.uuid("tax_category_id"),
    // FK to taxCategoriesTable
    gstRatePct: t.decimal("gst_rate_pct", { precision: 5, scale: 2 }),
    // e.g. 18.00 for 18% GST
    gstTransactionType: gstTransactionTypeEnum("gst_transaction_type"),

    // CGST + SGST (intra-state) OR IGST (inter-state) — in paise
    cgstPaise: t.integer("cgst_paise").default(0).notNull(),
    sgstPaise: t.integer("sgst_paise").default(0).notNull(),
    igstPaise: t.integer("igst_paise").default(0).notNull(),
    cessPaise: t.integer("cess_paise").default(0).notNull(),

    platformCommissionPaise: t.integer("platform_commission_paise").notNull(),
    shopEarningPaise: t.integer("shop_earning_paise").notNull(),
    // = itemSubtotal − discount − platformCommission

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("split_line_items_split_item_uq_idx")
      .on(tbl.splitId, tbl.orderItemId),

    t.index("split_line_items_split_idx").on(tbl.splitId),
    t.index("split_line_items_order_item_idx").on(tbl.orderItemId),

    t.check(
      "split_line_items_amounts_chk",
      sql`
        ${tbl.itemSubtotalPaise}          >= 0 AND
        ${tbl.discountPaise}              >= 0 AND
        ${tbl.taxPaise}                   >= 0 AND
        ${tbl.platformCommissionPaise}    >= 0 AND
        ${tbl.shopEarningPaise}           >= 0
      `,
    ),
    t.check(
      "split_line_items_tax_type_chk",
      sql`
        (${tbl.cgstPaise} > 0 AND ${tbl.sgstPaise} > 0 AND ${tbl.igstPaise} = 0) OR
        (${tbl.igstPaise} > 0 AND ${tbl.cgstPaise} = 0 AND ${tbl.sgstPaise} = 0) OR
        (${tbl.cgstPaise} = 0 AND ${tbl.sgstPaise} = 0 AND ${tbl.igstPaise} = 0)
      `,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Refund Financial Adjustments
// When a refund is processed, the split amounts that have already been (or
// were about to be) credited to each party are reversed by this amount.
// ---------------------------------------------------------------------------

export const refundFinancialAdjustmentsTable = table(
  "refund_financial_adjustments",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    splitId: t
      .uuid("split_id")
      .notNull()
      .references(() => orderFinancialSplitTable.id, { onDelete: "restrict" }),

    refundId: t
      .uuid("refund_id")
      .notNull()
      .references(() => refundsTable.id, { onDelete: "restrict" }),

    // How much of each party's earning is being reversed (paise)
    shopEarningReversalPaise: t
      .integer("shop_earning_reversal_paise")
      .default(0)
      .notNull(),
    partnerEarningReversalPaise: t
      .integer("partner_earning_reversal_paise")
      .default(0)
      .notNull(),
    platformCommissionReversalPaise: t
      .integer("platform_commission_reversal_paise")
      .default(0)
      .notNull(),
    taxReversalPaise: t.integer("tax_reversal_paise").default(0).notNull(),

    totalRefundedPaise: t.integer("total_refunded_paise").notNull(),

    processedAt: t.timestamp("processed_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    // One adjustment per refund
    t
      .uniqueIndex("refund_financial_adjustments_refund_uq_idx")
      .on(tbl.refundId),

    t.index("refund_financial_adjustments_split_idx").on(tbl.splitId),

    t.check(
      "refund_adjustments_amounts_chk",
      sql`
        ${tbl.shopEarningReversalPaise}         >= 0 AND
        ${tbl.partnerEarningReversalPaise}       >= 0 AND
        ${tbl.platformCommissionReversalPaise}   >= 0 AND
        ${tbl.totalRefundedPaise}                > 0
      `,
    ),
  ],
);

// =============================================================================
// SECTION 4 — SHOP EARNINGS LEDGER (append-only)
//
// Every credit and debit to a shop's earnings balance.
// Mirrored partnerEarningsLedgerTable in delivery.model.ts.
// =============================================================================

export const shopEarningsLedgerTable = table(
  "shop_earnings_ledger",
  {
    id: t.bigint("id", { mode: "bigint" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    // Source order / refund
    orderId: t
      .uuid("order_id")
      .references(() => ordersTable.id, { onDelete: "set null" }),

    splitId: t
      .uuid("split_id")
      .references(() => orderFinancialSplitTable.id, { onDelete: "set null" }),

    entryType: shopEarningsEntryTypeEnum("entry_type").notNull(),

    // Positive = credit, negative = debit — always in paise
    amountPaise: t.integer("amount_paise").notNull(),
    balanceBeforePaise: t.integer("balance_before_paise").notNull(),
    balanceAfterPaise: t.integer("balance_after_paise").notNull(),

    description: t.text("description"),
    internalNote: t.text("internal_note"),

    // Set when this entry is included in a shop payout
    // FK added via migration — forward ref to shopPayoutsTable
    payoutId: t.uuid("payout_id"),

    processedBy: t
      .uuid("processed_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("shop_earnings_ledger_shop_idx").on(tbl.shopId, tbl.createdAt),
    t
      .index("shop_earnings_ledger_order_idx")
      .on(tbl.orderId)
      .where(sql`order_id IS NOT NULL`),
    t
      .index("shop_earnings_ledger_unpaid_idx")
      .on(tbl.shopId, tbl.payoutId)
      .where(sql`payout_id IS NULL`),

    t.check(
      "shop_earnings_ledger_balance_chk",
      sql`${tbl.balanceAfterPaise} >= 0`,
    ),
  ],
);

// =============================================================================
// SECTION 5 — SHOP PAYOUTS
// Periodic settlement of shop earnings to the shopkeeper's bank account.
// =============================================================================

export const shopPayoutsTable = table(
  "shop_payouts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    payoutNumber: t.varchar("payout_number", { length: 50 }).notNull(),
    // e.g. "SPAY-2024-000123"

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    // Period this payout covers
    periodStart: t.timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: t.timestamp("period_end", { withTimezone: true }).notNull(),

    // ── Amounts (paise) ───────────────────────────────────────────────────
    grossEarningsPaise: t.integer("gross_earnings_paise").notNull(),
    // sum of all credit entries for this period

    deductionsPaise: t.integer("deductions_paise").default(0).notNull(),
    // refund reversals + penalties + platform fee deductions (if deducted at source)

    platformFeeDeductedPaise: t.integer("platform_fee_deducted_paise")
      .default(0)
      .notNull(),
    // If the monthly platform fee is deducted from this payout rather than
    // billed separately (depends on shopSubscriptionBilling.deductionMethod)

    netPaiseToBePaid: t.integer("net_paise_to_be_paid").notNull(),
    // = grossEarnings − deductions − platformFeeDeducted

    ordersCount: t.integer("orders_count").default(0).notNull(),

    // ── Bank details snapshot ─────────────────────────────────────────────
    bankAccountId: t.uuid("bank_account_id"),
    // FK to bankAccountsTable in profile.model.ts (soft reference)
    bankAccountSnapshot: t.jsonb("bank_account_snapshot").$type<{
      accountHolderName: string;
      accountNumberLast4: string;
      ifscCode: string;
      bankName: string;
    }>(),

    // ── Status ────────────────────────────────────────────────────────────
    status: shopPayoutStatusEnum("status").notNull().default("pending"),

    initiatedAt: t.timestamp("initiated_at", { withTimezone: true }),
    completedAt: t.timestamp("completed_at", { withTimezone: true }),
    failedAt: t.timestamp("failed_at", { withTimezone: true }),

    externalTransactionId: t.varchar("external_transaction_id", {
      length: 255,
    }),
    failureReason: t.text("failure_reason"),

    processedBy: t
      .uuid("processed_by")
      .references(() => userTable.id, { onDelete: "set null" }),

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
    t.uniqueIndex("shop_payouts_number_uq_idx").on(tbl.payoutNumber),

    t.index("shop_payouts_shop_idx").on(tbl.shopId, tbl.createdAt),
    t.index("shop_payouts_status_idx").on(tbl.status, tbl.createdAt),

    t.check(
      "shop_payouts_period_chk",
      sql`${tbl.periodEnd} > ${tbl.periodStart}`,
    ),
    t.check(
      "shop_payouts_amounts_chk",
      sql`
        ${tbl.grossEarningsPaise}       >= 0 AND
        ${tbl.deductionsPaise}          >= 0 AND
        ${tbl.platformFeeDeductedPaise} >= 0 AND
        ${tbl.netPaiseToBePaid}         >= 0 AND
        ${tbl.netPaiseToBePaid} = ${tbl.grossEarningsPaise}
                               - ${tbl.deductionsPaise}
                               - ${tbl.platformFeeDeductedPaise}
      `,
    ),
  ],
);

// =============================================================================
// SECTION 6 — TAX CATEGORIES
// Maps product categories to GST slabs.
// =============================================================================

export const taxCategoriesTable = table(
  "tax_categories",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 150 }).notNull(),
    // e.g. "Packaged Food - 5%", "Electronics - 18%", "Luxury - 28%"
    slug: t.varchar("slug", { length: 180 }).notNull(),
    description: t.text("description"),

    // GST rate — stored as decimal percentage: 18.00 = 18%
    gstRatePct: t.decimal("gst_rate_pct", { precision: 5, scale: 2 }).notNull(),

    // CGST + SGST each = gstRatePct / 2 (for intra-state)
    // IGST = gstRatePct (for inter-state)

    // Cess (on top of standard GST, e.g. tobacco, cars)
    cessRatePct: t.decimal("cess_rate_pct", { precision: 5, scale: 2 })
      .default("0.00")
      .notNull(),

    // HSN (Harmonised System of Nomenclature) code for GST filing
    hsnCode: t.varchar("hsn_code", { length: 20 }),
    sacCode: t.varchar("sac_code", { length: 20 }),
    // SAC = Services Accounting Code (for delivery charges, platform fees)

    isActive: t.boolean("is_active").default(true).notNull(),

    // Effective dates (GST rates can change via government notification)
    effectiveFrom: t.date("effective_from").notNull(),
    effectiveTo: t.date("effective_to"),

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
    t.uniqueIndex("tax_categories_slug_uq_idx").on(tbl.slug),

    t.index("tax_categories_active_idx").on(tbl.isActive, tbl.gstRatePct),

    t.check(
      "tax_categories_rate_chk",
      sql`
        ${tbl.gstRatePct}  >= 0 AND ${tbl.gstRatePct}  <= 100 AND
        ${tbl.cessRatePct} >= 0 AND ${tbl.cessRatePct} <= 100
      `,
    ),
    t.check(
      "tax_categories_dates_chk",
      sql`
        ${tbl.effectiveTo} IS NULL OR
        ${tbl.effectiveTo} > ${tbl.effectiveFrom}
      `,
    ),
  ],
);

// =============================================================================
// SECTION 7 — TAX RULES
// Intra-state vs inter-state routing rules by state code pair.
// =============================================================================

export const taxRulesTable = table(
  "tax_rules",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 150 }).notNull(),

    // ISO 3166-2 state codes e.g. "MH", "KA", "DL"
    sellerStateCode: t.varchar("seller_state_code", { length: 3 }),
    // null = applies to all seller states
    buyerStateCode: t.varchar("buyer_state_code", { length: 3 }),
    // null = applies to all buyer states

    transactionType: gstTransactionTypeEnum("transaction_type").notNull(),
    // intra_state | inter_state | export

    // Is reverse charge applicable?
    reverseCharge: t.boolean("reverse_charge").default(false).notNull(),

    isActive: t.boolean("is_active").default(true).notNull(),

    // Priority — higher wins when multiple rules match
    priority: t.smallint("priority").default(0).notNull(),

    effectiveFrom: t.date("effective_from").notNull(),
    effectiveTo: t.date("effective_to"),

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
    t.index("tax_rules_state_pair_idx").on(
      tbl.sellerStateCode,
      tbl.buyerStateCode,
      tbl.isActive,
    ),
    t.index("tax_rules_type_idx").on(tbl.transactionType, tbl.isActive),
  ],
);

// =============================================================================
// SECTION 8 — ORDER TAX LEDGER (append-only)
// Immutable per-order GST record for filing and audit.
// NEVER UPDATE or DELETE rows in this table.
// =============================================================================

export const orderTaxLedgerTable = table(
  "order_tax_ledger",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    orderId: t
      .uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "restrict" }),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    // ── Seller (shop) GST details ─────────────────────────────────────────
    sellerGstin: t.varchar("seller_gstin", { length: 15 }),
    sellerStateCode: t.varchar("seller_state_code", { length: 3 }),
    sellerLegalName: t.varchar("seller_legal_name", { length: 255 }),

    // ── Buyer details ─────────────────────────────────────────────────────
    buyerName: t.varchar("buyer_name", { length: 255 }),
    buyerGstin: t.varchar("buyer_gstin", { length: 15 }),
    // For B2B orders
    buyerStateCode: t.varchar("buyer_state_code", { length: 3 }),
    buyerAddress: t.text("buyer_address"),

    // ── Transaction classification ────────────────────────────────────────
    transactionType: gstTransactionTypeEnum("transaction_type").notNull(),
    isB2B: t.boolean("is_b2b").default(false).notNull(),

    // ── Tax amounts (paise) ───────────────────────────────────────────────
    taxableValuePaise: t.integer("taxable_value_paise").notNull(),
    // Item subtotal after discounts

    cgstAmountPaise: t.integer("cgst_amount_paise").default(0).notNull(),
    sgstAmountPaise: t.integer("sgst_amount_paise").default(0).notNull(),
    igstAmountPaise: t.integer("igst_amount_paise").default(0).notNull(),
    utgstAmountPaise: t.integer("utgst_amount_paise").default(0).notNull(),
    cessAmountPaise: t.integer("cess_amount_paise").default(0).notNull(),
    totalTaxAmountPaise: t.integer("total_tax_amount_paise").notNull(),

    // ── Delivery charge tax ───────────────────────────────────────────────
    deliveryChargePaise: t.integer("delivery_charge_paise").default(0).notNull(),
    deliveryChargeTaxPaise: t.integer("delivery_charge_tax_paise")
      .default(0)
      .notNull(),
    deliverySacCode: t.varchar("delivery_sac_code", { length: 20 }),

    // ── Invoice reference ─────────────────────────────────────────────────
    invoiceNumber: t.varchar("invoice_number", { length: 50 }),
    invoiceDate: t.date("invoice_date"),

    // ── GST return period this belongs to ─────────────────────────────────
    gstReturnMonth: t.varchar("gst_return_month", { length: 7 }),
    // YYYY-MM format

    isIncludedInReturn: t.boolean("is_included_in_return")
      .default(false)
      .notNull(),
    returnFiledAt: t.timestamp("return_filed_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    // One tax record per order
    t.uniqueIndex("order_tax_ledger_order_uq_idx").on(tbl.orderId),

    t.index("order_tax_ledger_shop_idx").on(tbl.shopId, tbl.createdAt),
    t
      .index("order_tax_ledger_return_month_idx")
      .on(tbl.gstReturnMonth, tbl.shopId),
    t
      .index("order_tax_ledger_unfiled_idx")
      .on(tbl.shopId, tbl.gstReturnMonth)
      .where(sql`is_included_in_return = false`),

    t.check(
      "order_tax_ledger_amounts_chk",
      sql`
        ${tbl.taxableValuePaise}      >= 0 AND
        ${tbl.cgstAmountPaise}        >= 0 AND
        ${tbl.sgstAmountPaise}        >= 0 AND
        ${tbl.igstAmountPaise}        >= 0 AND
        ${tbl.totalTaxAmountPaise}    >= 0
      `,
    ),
    t.check(
      "order_tax_ledger_intra_inter_chk",
      sql`
        (${tbl.transactionType} = 'intra_state' AND ${tbl.igstAmountPaise} = 0) OR
        (${tbl.transactionType} = 'inter_state' AND ${tbl.cgstAmountPaise} = 0
                                                AND ${tbl.sgstAmountPaise} = 0) OR
        (${tbl.transactionType} = 'export')
      `,
    ),
  ],
);

// =============================================================================
// SECTION 9 — PLATFORM FEE PLANS (SHOP RENT TIERS)
// Defines what each subscription tier costs per month.
// =============================================================================

export const platformFeePlansTable = table(
  "platform_fee_plans",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    // Must match values in shopsTable.subscriptionPlan enum
    planSlug: t.varchar("plan_slug", { length: 50 }).notNull(),
    // "free" | "basic" | "pro" | "enterprise"

    name: t.varchar("name", { length: 100 }).notNull(),
    description: t.text("description"),

    // ── Pricing (paise / month) ───────────────────────────────────────────
    monthlyAmountPaise: t.integer("monthly_amount_paise").notNull(),
    // 0 for free tier

    annualAmountPaise: t.integer("annual_amount_paise"),
    // If paid annually

    setupFeePaise: t.integer("setup_fee_paise").default(0).notNull(),
    // One-time setup fee

    // ── Plan limits ───────────────────────────────────────────────────────
    maxProducts: t.integer("max_products"),
    maxCategories: t.integer("max_categories"),
    maxImages: t.integer("max_images"),
    maxMonthlyOrders: t.integer("max_monthly_orders"),
    maxBranches: t.integer("max_branches"),

    // ── Features included ─────────────────────────────────────────────────
    features: t.jsonb("features").$type<string[]>(),

    // ── Commission override ────────────────────────────────────────────────
    commissionRateOverride: t.decimal("commission_rate_override", {
      precision: 5,
      scale: 4,
    }),

    // ── Trial ─────────────────────────────────────────────────────────────
    trialDays: t.integer("trial_days").default(0).notNull(),

    isActive: t.boolean("is_active").default(true).notNull(),
    isFeatured: t.boolean("is_featured").default(false).notNull(),
    displayOrder: t.smallint("display_order").default(0).notNull(),

    effectiveFrom: t.date("effective_from").notNull(),
    effectiveTo: t.date("effective_to"),

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
    t.uniqueIndex("platform_fee_plans_slug_uq_idx").on(tbl.planSlug),

    t.index("platform_fee_plans_active_idx").on(tbl.isActive, tbl.displayOrder),

    t.check(
      "platform_fee_plans_amounts_chk",
      sql`
        ${tbl.monthlyAmountPaise} >= 0 AND
        (${tbl.annualAmountPaise} IS NULL OR ${tbl.annualAmountPaise} >= 0) AND
        ${tbl.setupFeePaise} >= 0
      `,
    ),
    t.check(
      "platform_fee_plans_commission_chk",
      sql`
        ${tbl.commissionRateOverride} IS NULL OR
        (${tbl.commissionRateOverride} >= 0 AND ${tbl.commissionRateOverride} <= 1)
      `,
    ),
    t.check(
      "platform_fee_plans_dates_chk",
      sql`
        ${tbl.effectiveTo} IS NULL OR
        ${tbl.effectiveTo} > ${tbl.effectiveFrom}
      `,
    ),
  ],
);

// =============================================================================
// SECTION 10 — SHOP SUBSCRIPTIONS (platform fee billing)
// Tracks which fee plan the shop is on and billing state.
// =============================================================================

export const shopSubscriptionBillingTable = table(
  "shop_subscription_billing",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    planId: t
      .uuid("plan_id")
      .notNull()
      .references(() => platformFeePlansTable.id, { onDelete: "restrict" }),

    planSlug: t.varchar("plan_slug", { length: 50 }).notNull(),

    status: shopSubscriptionBillingStatusEnum("status").notNull().default("trialing"),

    // ── Billing cycle ─────────────────────────────────────────────────────
    billingCycle: billingCycleEnum("billing_cycle").notNull().default("monthly"),

    currentPeriodStart: t.timestamp("current_period_start", {
      withTimezone: true,
    }).notNull(),
    currentPeriodEnd: t.timestamp("current_period_end", {
      withTimezone: true,
    }).notNull(),

    nextBillingDate: t.timestamp("next_billing_date", { withTimezone: true }),
    lastBilledAt: t.timestamp("last_billed_at", { withTimezone: true }),

    // ── Trial ─────────────────────────────────────────────────────────────
    trialStart: t.timestamp("trial_start", { withTimezone: true }),
    trialEnd: t.timestamp("trial_end", { withTimezone: true }),

    // ── Fee deduction method ──────────────────────────────────────────────
    deductionMethod: feeDeductionMethodEnum("deduction_method")
      .notNull()
      .default("deduct_from_payout"),

    // ── Payment method (if separate_invoice) ──────────────────────────────
    autoPayEnabled: t.boolean("auto_pay_enabled").default(false).notNull(),
    autoPayMethodId: t.uuid("auto_pay_method_id"),
    // FK to savedPaymentMethodsTable in commerce.ts

    // ── Failure tracking ──────────────────────────────────────────────────
    billingFailureCount: t.smallint("billing_failure_count")
      .default(0)
      .notNull(),
    lastBillingError: t.text("last_billing_error"),

    // ── Cancellation ──────────────────────────────────────────────────────
    cancelledAt: t.timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: t.text("cancellation_reason"),

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
    // One billing record per shop
    t
      .uniqueIndex("shop_subscription_billing_shop_uq_idx")
      .on(tbl.shopId),

    t.index("shop_subscription_billing_status_idx").on(
      tbl.status,
      tbl.nextBillingDate,
    ),
    t
      .index("shop_subscription_billing_due_idx")
      .on(tbl.nextBillingDate)
      .where(sql`status IN ('active', 'past_due')`),

    t.check(
      "shop_subscription_billing_period_chk",
      sql`${tbl.currentPeriodEnd} > ${tbl.currentPeriodStart}`,
    ),
    t.check(
      "shop_subscription_billing_failure_chk",
      sql`${tbl.billingFailureCount} >= 0`,
    ),
  ],
);

// =============================================================================
// SECTION 11 — PLATFORM FEE INVOICES
// Monthly invoice issued to each shop for their platform subscription.
// =============================================================================

export const platformFeeInvoicesTable = table(
  "platform_fee_invoices",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    invoiceNumber: t.varchar("invoice_number", { length: 50 }).notNull(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    subscriptionId: t
      .uuid("subscription_id")
      .notNull()
      .references(() => shopSubscriptionBillingTable.id, {
        onDelete: "restrict",
      }),

    planId: t
      .uuid("plan_id")
      .notNull()
      .references(() => platformFeePlansTable.id, { onDelete: "restrict" }),

    // ── Billing period ────────────────────────────────────────────────────
    billingPeriodStart: t.date("billing_period_start").notNull(),
    billingPeriodEnd: t.date("billing_period_end").notNull(),

    // ── Amounts (paise) ───────────────────────────────────────────────────
    subtotalPaise: t.integer("subtotal_paise").notNull(),

    gstRatePct: t.decimal("gst_rate_pct", { precision: 5, scale: 2 })
      .notNull(),

    cgstPaise: t.integer("cgst_paise").default(0).notNull(),
    sgstPaise: t.integer("sgst_paise").default(0).notNull(),
    igstPaise: t.integer("igst_paise").default(0).notNull(),
    totalTaxPaise: t.integer("total_tax_paise").notNull(),
    totalAmountPaise: t.integer("total_amount_paise").notNull(),

    // ── Discount / credits ────────────────────────────────────────────────
    discountPaise: t.integer("discount_paise").default(0).notNull(),
    creditAppliedPaise: t.integer("credit_applied_paise").default(0).notNull(),

    amountDuePaise: t.integer("amount_due_paise").notNull(),

    // ── GST details ───────────────────────────────────────────────────────
    platformGstin: t.varchar("platform_gstin", { length: 15 }),
    shopGstin: t.varchar("shop_gstin", { length: 15 }),
    transactionType: gstTransactionTypeEnum("transaction_type").notNull(),

    // ── Status ────────────────────────────────────────────────────────────
    status: platformFeePaymentStatusEnum("status")
      .notNull()
      .default("pending"),

    dueDate: t.date("due_date").notNull(),

    // ── PDF ───────────────────────────────────────────────────────────────
    pdfKey: t.varchar("pdf_key", { length: 500 }),

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
    t.uniqueIndex("platform_fee_invoices_number_uq_idx").on(tbl.invoiceNumber),

    t.index("platform_fee_invoices_shop_idx").on(tbl.shopId, tbl.createdAt),
    t.index("platform_fee_invoices_status_idx").on(tbl.status, tbl.dueDate),
    t
      .index("platform_fee_invoices_overdue_idx")
      .on(tbl.dueDate)
      .where(sql`status = 'pending'`),

    t.check(
      "platform_fee_invoices_amounts_chk",
      sql`
        ${tbl.subtotalPaise}       >= 0 AND
        ${tbl.totalAmountPaise}    >= 0 AND
        ${tbl.amountDuePaise}      >= 0 AND
        ${tbl.discountPaise}       >= 0 AND
        ${tbl.creditAppliedPaise}  >= 0 AND
        ${tbl.totalAmountPaise} = ${tbl.subtotalPaise} + ${tbl.totalTaxPaise} AND
        ${tbl.amountDuePaise}   = ${tbl.totalAmountPaise}
                                - ${tbl.discountPaise}
                                - ${tbl.creditAppliedPaise}
      `,
    ),
    t.check(
      "platform_fee_invoices_period_chk",
      sql`${tbl.billingPeriodEnd} >= ${tbl.billingPeriodStart}`,
    ),
  ],
);

// =============================================================================
// SECTION 12 — PLATFORM FEE PAYMENTS
// Records of shops paying their platform fee invoices.
// =============================================================================

export const platformFeePaymentsTable = table(
  "platform_fee_payments",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    invoiceId: t
      .uuid("invoice_id")
      .notNull()
      .references(() => platformFeeInvoicesTable.id, { onDelete: "restrict" }),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    amountPaidPaise: t.integer("amount_paid_paise").notNull(),

    paymentMethod: t.varchar("payment_method", { length: 50 }).notNull(),

    // If paid via payment gateway
    externalTransactionId: t.varchar("external_transaction_id", {
      length: 255,
    }),
    paymentProvider: t.varchar("payment_provider", { length: 100 }),

    // If deducted from earnings payout
    shopPayoutId: t
      .uuid("shop_payout_id")
      .references(() => shopPayoutsTable.id, { onDelete: "set null" }),

    status: platformFeePaymentStatusEnum("status")
      .notNull()
      .default("pending"),

    paidAt: t.timestamp("paid_at", { withTimezone: true }),
    failedAt: t.timestamp("failed_at", { withTimezone: true }),
    failureReason: t.text("failure_reason"),

    processedBy: t
      .uuid("processed_by")
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
    t.index("platform_fee_payments_invoice_idx").on(tbl.invoiceId),
    t.index("platform_fee_payments_shop_idx").on(tbl.shopId, tbl.createdAt),

    t.check(
      "platform_fee_payments_amount_chk",
      sql`${tbl.amountPaidPaise} > 0`,
    ),
  ],
);

// =============================================================================
// SECTION 13 — COMMISSION RATE CONFIGS
//
// Defines the platform commission rate at global, city, shop-type, and
// per-shop level.
// =============================================================================

export const commissionRateConfigsTable = table(
  "commission_rate_configs",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 150 }).notNull(),
    description: t.text("description"),

    scope: commissionScopeEnum("scope").notNull(),

    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "cascade" }),
    shopTypeSlug: t.varchar("shop_type_slug", { length: 120 }),

    commissionRate: t.decimal("commission_rate", {
      precision: 5,
      scale: 4,
    }).notNull(),

    appliedOn: commissionAppliedOnEnum("applied_on")
      .notNull()
      .default("gross_subtotal"),

    priority: t.smallint("priority").default(0).notNull(),

    isActive: t.boolean("is_active").default(true).notNull(),

    effectiveFrom: t.date("effective_from").notNull(),
    effectiveTo: t.date("effective_to"),

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
    t.index("commission_configs_scope_idx").on(tbl.scope, tbl.isActive),
    t.index("commission_configs_city_idx").on(tbl.cityId, tbl.isActive),

    // Exactly one active global config at any time
    t
      .uniqueIndex("commission_configs_global_uq_idx")
      .on(tbl.scope)
      .where(sql`scope = 'global' AND is_active = true`),

    t.check(
      "commission_configs_rate_chk",
      sql`${tbl.commissionRate} >= 0 AND ${tbl.commissionRate} <= 1`,
    ),
    t.check(
      "commission_configs_scope_anchor_chk",
      sql`
        (${tbl.scope} = 'global'    AND ${tbl.cityId} IS NULL AND ${tbl.shopTypeSlug} IS NULL) OR
        (${tbl.scope} = 'city'      AND ${tbl.cityId} IS NOT NULL) OR
        (${tbl.scope} = 'shop_type' AND ${tbl.shopTypeSlug} IS NOT NULL) OR
        (${tbl.scope} = 'shop')
      `,
    ),
    t.check(
      "commission_configs_dates_chk",
      sql`
        ${tbl.effectiveTo} IS NULL OR
        ${tbl.effectiveTo} > ${tbl.effectiveFrom}
      `,
    ),
  ],
);

// =============================================================================
// SECTION 14 — PLATFORM REVENUE ANALYTICS (daily roll-up)
// =============================================================================

export const platformRevenueAnalyticsTable = table(
  "platform_revenue_analytics",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    date: t.date("date").notNull(),
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "cascade" }),

    totalOrdersCount: t.integer("total_orders_count").default(0).notNull(),
    deliveredOrdersCount: t
      .integer("delivered_orders_count")
      .default(0)
      .notNull(),
    cancelledOrdersCount: t
      .integer("cancelled_orders_count")
      .default(0)
      .notNull(),

    gmvPaise: t.bigint("gmv_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    commissionRevenuePaise: t
      .bigint("commission_revenue_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    deliveryCommissionRevenuePaise: t
      .bigint("delivery_commission_revenue_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    shopFeeRevenuePaise: t
      .bigint("shop_fee_revenue_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    activeShopsOnFreeplan: t
      .integer("active_shops_on_free_plan")
      .default(0)
      .notNull(),
    activeShopsOnPaidPlan: t
      .integer("active_shops_on_paid_plan")
      .default(0)
      .notNull(),

    totalShopPayoutsPaise: t
      .bigint("total_shop_payouts_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    totalPartnerPayoutsPaise: t
      .bigint("total_partner_payouts_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    totalRefundedPaise: t
      .bigint("total_refunded_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    netRevenuePaise: t
      .bigint("net_revenue_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    gmvGrowthPct: t.decimal("gmv_growth_pct", { precision: 10, scale: 2 }),
    revenueGrowthPct: t.decimal("revenue_growth_pct", {
      precision: 10,
      scale: 2,
    }),

    calculatedAt: t
      .timestamp("calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("platform_revenue_analytics_date_city_uq_idx")
      .on(tbl.date, tbl.cityId),

    t.index("platform_revenue_analytics_date_idx").on(tbl.date),
  ],
);

// =============================================================================
// SECTION 15 — SHOP REVENUE ANALYTICS (daily roll-up per shop)
// =============================================================================

export const shopRevenueAnalyticsTable = table(
  "shop_revenue_analytics",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    date: t.date("date").notNull(),

    ordersPlaced: t.integer("orders_placed").default(0).notNull(),
    ordersDelivered: t.integer("orders_delivered").default(0).notNull(),
    ordersCancelled: t.integer("orders_cancelled").default(0).notNull(),
    ordersRefunded: t.integer("orders_refunded").default(0).notNull(),

    grossSalesPaise: t
      .bigint("gross_sales_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    discountGivenPaise: t
      .bigint("discount_given_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    platformCommissionPaidPaise: t
      .bigint("platform_commission_paid_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    netEarningsPaise: t
      .bigint("net_earnings_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    refundsIssuedPaise: t
      .bigint("refunds_issued_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    averageOrderValuePaise: t.integer("average_order_value_paise"),

    topProductsByRevenue: t.jsonb("top_products_by_revenue").$type<
      { productId: string; name: string; revenuePaise: number; units: number }[]
    >(),

    calculatedAt: t
      .timestamp("calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("shop_revenue_analytics_shop_date_uq_idx")
      .on(tbl.shopId, tbl.date),

    t.index("shop_revenue_analytics_shop_idx").on(tbl.shopId, tbl.date),
    t.index("shop_revenue_analytics_date_idx").on(tbl.date),
  ],
);

// =============================================================================
// MIGRATION NOTES
// =============================================================================
//
// 1. shopEarningsLedgerTable.payoutId → shopPayoutsTable
//
//    ALTER TABLE shop_earnings_ledger
//      ADD CONSTRAINT shop_earnings_ledger_payout_id_fk
//      FOREIGN KEY (payout_id) REFERENCES shop_payouts(id)
//      ON DELETE SET NULL;
//
// 2. orderFinancialSplitTable.commissionConfigId → commissionRateConfigsTable
//
//    ALTER TABLE order_financial_splits
//      ADD CONSTRAINT order_splits_commission_config_id_fk
//      FOREIGN KEY (commission_config_id)
//      REFERENCES commission_rate_configs(id)
//      ON DELETE SET NULL;
//
// 3. orderSplitLineItemsTable.taxCategoryId → taxCategoriesTable
//
//    ALTER TABLE order_split_line_items
//      ADD CONSTRAINT split_line_items_tax_category_id_fk
//      FOREIGN KEY (tax_category_id) REFERENCES tax_categories(id)
//      ON DELETE SET NULL;
//
// 4. shopProductTable.taxCategoryId → taxCategoriesTable
//
//    ALTER TABLE shop_products
//      ADD CONSTRAINT shop_products_tax_category_id_fk
//      FOREIGN KEY (tax_category_id) REFERENCES tax_categories(id)
//      ON DELETE SET NULL;
//
// 5. Ensure shopsTable.subscriptionPlan values match platformFeePlansTable.planSlug
//
//    ALTER TABLE shops
//      ADD CONSTRAINT shops_subscription_plan_fk
//      FOREIGN KEY (subscription_plan)
//      REFERENCES platform_fee_plans(plan_slug);
// =============================================================================
