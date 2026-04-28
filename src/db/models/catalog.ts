import { pgTable as table } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { categoriesTable, shopsTable } from "./shop";
import { userTable } from "./auth";
import {
  productStatusEnum,
  productConditionEnum,
  productSourceEnum,
  productRecommendationBadgeEnum,
  discountTypeEnum,
  pricingTierTypeEnum,
  collectionTypeEnum,
  bundleTypeEnum,
  bundlePricingTypeEnum,
  linkTypeEnum,
  linkSourceEnum,
  filterTypeEnum,
  filterDisplayStyleEnum,
  filterScopeEnum,
  viewSourceEnum,
  deviceTypeEnum,
  comparisonOutcomeEnum,
  trendPeriodEnum,
  trendDirectionEnum,
  questionTypeEnum,
  answeredByEnum,
  catalogueAnnouncementTypeEnum,
  displayLocationEnum,
  stockAlertTypeEnum,
  stockAlertSeverityEnum,
  savedItemSourceEnum,
  priceAlertStatusEnum,
  suggestionStatusEnum,
  matchTypeEnum,
  suggestionSourceEnum,
  reviewActionEnum,
  catalogueRecommendationTypeEnum,
  recommendationStatusEnum,
  searchIntentEnum,
  suggestionTypeEnum,
  couponDiscountTypeEnum,
  couponStatusEnum,
  couponTargetEnum,
  couponScopeEnum,
  usageRestrictionEnum,
  generationMethodEnum,
  coinTransactionTypeEnum,
  coinEarningSourceEnum,
  coinRedemptionTypeEnum,
  coinTransactionStatusEnum,
  customerTierEnum,
  recQueueStatusEnum,
  interactionTypeEnum,
  searchSuggestionTypeEnum,
  pushSuggestionTypeEnum,
  matchingStatusEnum,
  detectionMethodEnum,
  duplicateReportStatusEnum,
} from "../shared/enums";

// =============================================================================
// CATALOGUE MODEL
//
// Covers:
//   1.  Brands & Brand-Categories
//   2.  Master Products (global catalog) + Variants + Images
//   3.  Shop Products (per-shop instances) + Variants + Images
//   4.  Pricing — base prices, volume/tiered pricing
//   5.  Collections & Collection Products
//   6.  Bundles / Combos & Bundle Items
//   7.  Product Links (cross-sell / upsell)
//   8.  Daily Picks & Daily Pick Products
//   9.  Product Filters, Filter Values, Filter Presets, Filter Groups
//  10.  Behavioural analytics — views, interactions, comparisons, search
//  11.  Product Q&A, Shop Announcements
//  12.  Trending — products, categories, searches, popularity scores
//  13.  Stock alerts & alert history
//  14.  Saved-for-later, price-drop alerts, back-in-stock alerts
//  15.  Price history
//  16.  Master-product matching / push-suggestion workflow
//  17.  Coupons & coupon usage
//  18.  Coins / loyalty-points system
//
// Monetary amounts
//   All prices are stored in paise (₹ × 100) as INTEGER unless the column
//   comment says otherwise.  This matches the convention already established
//   in profile.model.ts and auth.model.ts.
//
// Object-store keys
//   Image / document columns that end in "Key" hold S3/R2 object-store keys.
//   Generate signed URLs at request time; never store raw URLs in these cols.
//   Columns that end in "Url" are pre-existing in the rough draft and are
//   kept for now — migrate them to keys in a follow-up.
//
// Spatial indexes
//   No geography columns exist in this file.  If you add any, follow the
//   PostGIS convention from profile.model.ts and add GIST indexes in
//   migrations/add_spatial_indexes.sql.
//
// Search vectors
//   `search_vector` on master_products is TEXT today.  Migrate it to a
//   GENERATED tsvector column via ALTER TABLE after the initial deploy
//   (see commented migration at bottom of file).
//
// Table-name / import alignment
//   The rough draft referenced auth.schema / shop.schema — corrected to
//   auth.model / shop.model to match the rest of the codebase.
// =============================================================================

// =============================================================================
// SECTION 2 — BRANDS
// =============================================================================

export const brandTable = table(
  "brands",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    brandName: t.varchar("brand_name", { length: 150 }).notNull(),
    slug: t.varchar("slug", { length: 200 }).notNull(),

    description: t.text("description"),

    // Object-store keys — generate signed URLs at request time
    logoKey: t.varchar("logo_key", { length: 500 }),
    logoThumbnailKey: t.varchar("logo_thumbnail_key", { length: 500 }),
    coverImageKey: t.varchar("cover_image_key", { length: 500 }),

    // Self-referential hierarchy (root brand → sub-brand)
    parentBrandId: t.uuid("parent_brand_id"),
    brandLevel: t.smallint("brand_level").default(0).notNull(), // 0 = root

    // SEO
    metaTitle: t.varchar("meta_title", { length: 255 }),
    metaDescription: t.text("meta_description"),

    isVerified: t.boolean("is_verified").default(false).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),
    isFeatured: t.boolean("is_featured").default(false).notNull(),

    // Denormalised — kept in sync by background job on product changes
    productCount: t.integer("product_count").default(0).notNull(),

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
    t.foreignKey({
      name: "brands_parent_brand_fk",
      columns: [tbl.parentBrandId],
      foreignColumns: [tbl.id],
    }),

    t.uniqueIndex("brands_slug_uq_idx").on(tbl.slug),

    t.index("brands_active_verified_idx").on(tbl.isActive, tbl.isVerified),
    t.index("brands_parent_idx").on(tbl.parentBrandId, tbl.isActive),
    t.index("brands_featured_idx").on(tbl.isFeatured, tbl.isActive),

    t.check(
      "brands_no_self_parent_chk",
      sql`${tbl.parentBrandId} IS NULL OR ${tbl.id} <> ${tbl.parentBrandId}`,
    ),
  ],
);

// Brand ↔ Category (many-to-many, for navigation / filtering)
export const brandCategoriesTable = table(
  "brand_categories",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    brandId: t
      .uuid("brand_id")
      .notNull()
      .references(() => brandTable.id, { onDelete: "cascade" }),

    categoryId: t
      .uuid("category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),

    isPrimary: t.boolean("is_primary").default(false).notNull(),
    displayOrder: t.integer("display_order").default(0).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("brand_categories_brand_cat_uq_idx")
      .on(tbl.brandId, tbl.categoryId),

    t.index("brand_categories_brand_idx").on(tbl.brandId),
    t.index("brand_categories_category_idx").on(tbl.categoryId),
  ],
);

// =============================================================================
// SECTION 3 — MASTER PRODUCTS (global catalog)
// =============================================================================

export const masterProductTable = table(
  "master_products",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    // Identifiers
    globalSku: t.varchar("global_sku", { length: 100 }),
    gtin: t.varchar("gtin", { length: 14 }), // EAN / UPC

    slug: t.varchar("slug", { length: 255 }).notNull(),
    name: t.varchar("name", { length: 200 }).notNull(),
    description: t.text("description"),
    shortDescription: t.varchar("short_description", { length: 500 }),

    // Taxonomy
    leafCategoryId: t
      .uuid("leaf_category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "restrict" }),

    brandId: t
      .uuid("brand_id")
      .references(() => brandTable.id, { onDelete: "set null" }),

    // Pricing (suggested / reference — shops set their own prices)
    basePrice: t.integer("base_price"), // paise
    msrp: t.integer("msrp"), // paise

    // Physical attributes
    weightGrams: t.decimal("weight_grams", { precision: 10, scale: 2 }),
    lengthCm: t.decimal("length_cm", { precision: 10, scale: 2 }),
    widthCm: t.decimal("width_cm", { precision: 10, scale: 2 }),
    heightCm: t.decimal("height_cm", { precision: 10, scale: 2 }),

    // Product info
    productCondition: productConditionEnum("product_condition")
      .default("new")
      .notNull(),
    manufacturer: t.varchar("manufacturer", { length: 200 }),
    countryOfOrigin: t.varchar("country_of_origin", { length: 100 }),

    // Flexible attribute bags
    attributes: t.jsonb("attributes").$type<Record<string, unknown>>(),
    specifications: t.jsonb("specifications").$type<Record<string, unknown>>(),
    tags: t.jsonb("tags").$type<string[]>(),
    keywords: t.jsonb("keywords").$type<string[]>(),

    // Full-text search — TEXT today, migrate to GENERATED tsvector post-deploy
    searchVector: t.text("search_vector"),

    // Status
    status: productStatusEnum("status").default("draft").notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),

    // Denormalised stats (updated by background job)
    totalShopsUsing: t.integer("total_shops_using").default(0).notNull(),
    // Rating stored as (sum, count) — same pattern as shop_stats / dp_profiles
    ratingSum: t.doublePrecision("rating_sum").default(0).notNull(),
    ratingCount: t.integer("rating_count").default(0).notNull(),
    totalReviews: t.integer("total_reviews").default(0).notNull(),

    // Audit
    uploaderAdminId: t
      .uuid("uploader_admin_id")
      .references(() => userTable.id, { onDelete: "set null" }),
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
    t.uniqueIndex("master_products_slug_uq_idx").on(tbl.slug),
    t
      .uniqueIndex("master_products_global_sku_uq_idx")
      .on(tbl.globalSku)
      .where(sql`global_sku IS NOT NULL`),
    t
      .uniqueIndex("master_products_gtin_uq_idx")
      .on(tbl.gtin)
      .where(sql`gtin IS NOT NULL`),

    t
      .index("master_products_category_idx")
      .on(tbl.leafCategoryId, tbl.isActive),
    t.index("master_products_brand_idx").on(tbl.brandId, tbl.isActive),
    t.index("master_products_status_idx").on(tbl.status, tbl.isActive),

    // GIN indexes for array / JSONB containment queries
    t.index("master_products_tags_gin_idx").using("gin", tbl.tags),
    t.index("master_products_keywords_gin_idx").using("gin", tbl.keywords),

    t.check(
      "master_products_prices_chk",
      sql`
        (${tbl.basePrice} IS NULL OR ${tbl.basePrice} >= 0) AND
        (${tbl.msrp} IS NULL OR ${tbl.msrp} >= 0)
      `,
    ),
    t.check(
      "master_products_dimensions_chk",
      sql`
        (${tbl.weightGrams} IS NULL OR ${tbl.weightGrams} >= 0) AND
        (${tbl.lengthCm}    IS NULL OR ${tbl.lengthCm}    >= 0) AND
        (${tbl.widthCm}     IS NULL OR ${tbl.widthCm}     >= 0) AND
        (${tbl.heightCm}    IS NULL OR ${tbl.heightCm}    >= 0)
      `,
    ),
    t.check(
      "master_products_rating_chk",
      sql`${tbl.ratingCount} >= 0 AND ${tbl.ratingSum} >= 0`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Master Product Variants
// ---------------------------------------------------------------------------

export const masterProductVariantTable = table(
  "master_product_variants",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    masterProductId: t
      .uuid("master_product_id")
      .notNull()
      .references(() => masterProductTable.id, { onDelete: "cascade" }),

    variantSku: t.varchar("variant_sku", { length: 100 }).notNull(),
    variantGtin: t.varchar("variant_gtin", { length: 14 }),
    variantName: t.varchar("variant_name", { length: 150 }).notNull(),

    // Variant-specific attribute overrides (colour, size, …)
    attributes: t.jsonb("attributes").$type<Record<string, unknown>>(),

    // Price/dimension overrides — null means inherit from master
    basePrice: t.integer("base_price"), // paise
    msrp: t.integer("msrp"), // paise
    weightGrams: t.decimal("weight_grams", { precision: 10, scale: 2 }),
    lengthCm: t.decimal("length_cm", { precision: 10, scale: 2 }),
    widthCm: t.decimal("width_cm", { precision: 10, scale: 2 }),
    heightCm: t.decimal("height_cm", { precision: 10, scale: 2 }),

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
    t.uniqueIndex("master_variants_sku_uq_idx").on(tbl.variantSku),
    t
      .uniqueIndex("master_variants_gtin_uq_idx")
      .on(tbl.variantGtin)
      .where(sql`variant_gtin IS NOT NULL`),

    t
      .index("master_variants_product_idx")
      .on(tbl.masterProductId, tbl.isActive),

    t.check(
      "master_variants_prices_chk",
      sql`
        (${tbl.basePrice} IS NULL OR ${tbl.basePrice} >= 0) AND
        (${tbl.msrp}      IS NULL OR ${tbl.msrp}      >= 0)
      `,
    ),
    t.check(
      "master_variants_dimensions_chk",
      sql`
        (${tbl.weightGrams} IS NULL OR ${tbl.weightGrams} >= 0) AND
        (${tbl.lengthCm}    IS NULL OR ${tbl.lengthCm}    >= 0) AND
        (${tbl.widthCm}     IS NULL OR ${tbl.widthCm}     >= 0) AND
        (${tbl.heightCm}    IS NULL OR ${tbl.heightCm}    >= 0)
      `,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Master Product Images
// ---------------------------------------------------------------------------

export const masterProductImagesTable = table(
  "master_product_images",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    masterProductId: t
      .uuid("master_product_id")
      .notNull()
      .references(() => masterProductTable.id, { onDelete: "cascade" }),

    // Optional: image belongs to a specific variant
    variantId: t
      .uuid("variant_id")
      .references(() => masterProductVariantTable.id, { onDelete: "cascade" }),

    // Object-store key (migrate imageUrl → imageKey in follow-up)
    imageUrl: t.varchar("image_url", { length: 500 }).notNull(),
    thumbnailUrl: t.varchar("thumbnail_url", { length: 500 }),
    altText: t.varchar("alt_text", { length: 255 }),

    // isPrimaryFlag: computed UNIQUE trick enforces exactly one primary per
    // product without a partial unique index on a nullable column.
    // Enforce with: GENERATED ALWAYS AS (CASE WHEN is_primary THEN 1 END) STORED
    // + UNIQUE(master_product_id, is_primary_flag)  — see migration notes.
    isPrimary: t.boolean("is_primary").default(false).notNull(),
    displayOrder: t.smallint("display_order").default(0).notNull(),

    widthPx: t.integer("width_px"),
    heightPx: t.integer("height_px"),
    fileSizeBytes: t.integer("file_size_bytes"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("master_product_images_product_idx")
      .on(tbl.masterProductId, tbl.isPrimary),
    t.index("master_product_images_variant_idx").on(tbl.variantId),
  ],
);

// =============================================================================
// SECTION 4 — SHOP PRODUCTS
// =============================================================================

export const shopProductTable = table(
  "shop_products",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    // Source tracking
    productSource: productSourceEnum("product_source")
      .notNull()
      .default("master"),
    masterProductId: t
      .uuid("master_product_id")
      .references(() => masterProductTable.id, { onDelete: "set null" }),

    // Shop-specific overrides (null = inherit from master)
    name: t.varchar("name", { length: 250 }),
    description: t.text("description"),
    shortDescription: t.varchar("short_description", { length: 500 }),

    // Inventory
    trackInventory: t.boolean("track_inventory").default(true).notNull(),
    stockQuantity: t.integer("stock_quantity").default(0).notNull(),
    lowStockThreshold: t.integer("low_stock_threshold").default(10).notNull(),
    allowBackorder: t.boolean("allow_backorder").default(false).notNull(),

    // Tax & Shipping
    taxable: t.boolean("taxable").default(true).notNull(),
    taxCategoryId: t.uuid("tax_category_id"),
    requiresShipping: t.boolean("requires_shipping").default(true).notNull(),
    shippingWeightGrams: t.decimal("shipping_weight_grams", {
      precision: 10,
      scale: 2,
    }),

    // Display & Marketing
    displayOrder: t.integer("display_order").default(0).notNull(),
    isFeatured: t.boolean("is_featured").default(false).notNull(),
    recommendationBadge: productRecommendationBadgeEnum("recommendation_badge"),

    // Status
    status: productStatusEnum("status").default("draft").notNull(),
    isAvailable: t.boolean("is_available").default(true).notNull(),
    publishedAt: t.timestamp("published_at", { withTimezone: true }),

    // SEO
    slug: t.varchar("slug", { length: 255 }).notNull(),
    metaTitle: t.varchar("meta_title", { length: 255 }),
    metaDescription: t.text("meta_description"),

    // Audit
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
    t.uniqueIndex("shop_products_slug_uq_idx").on(tbl.shopId, tbl.slug),

    t
      .index("shop_products_shop_status_idx")
      .on(tbl.shopId, tbl.status, tbl.isAvailable),
    t.index("shop_products_master_idx").on(tbl.masterProductId),
    t
      .index("shop_products_featured_idx")
      .on(tbl.shopId, tbl.isFeatured, tbl.isAvailable),
    t
      .index("shop_products_inventory_idx")
      .on(tbl.shopId, tbl.stockQuantity, tbl.trackInventory),

    t.check("shop_products_stock_chk", sql`${tbl.stockQuantity} >= 0`),
    t.check("shop_products_threshold_chk", sql`${tbl.lowStockThreshold} >= 0`),
    t.check(
      "shop_products_source_chk",
      sql`
        (${tbl.productSource} = 'master'  AND ${tbl.masterProductId} IS NOT NULL) OR
        (${tbl.productSource} = 'custom' AND ${tbl.masterProductId} IS NULL)
      `,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Shop Product Variants
// ---------------------------------------------------------------------------

export const shopProductVariantTable = table(
  "shop_product_variants",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    masterProductVariantId: t
      .uuid("master_product_variant_id")
      .references(() => masterProductVariantTable.id, {
        onDelete: "set null",
      }),

    variantName: t.varchar("variant_name", { length: 200 }),
    variantSku: t.varchar("variant_sku", { length: 100 }),
    attributes: t.jsonb("attributes").$type<Record<string, unknown>>(),

    // Variant-level inventory
    stockQuantity: t.integer("stock_quantity").default(0).notNull(),
    lowStockThreshold: t.integer("low_stock_threshold").default(10).notNull(),

    isAvailable: t.boolean("is_available").default(true).notNull(),
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
    // SKU must be unique within a shop's product
    t
      .uniqueIndex("shop_variants_sku_uq_idx")
      .on(tbl.shopProductId, tbl.variantSku)
      .where(sql`variant_sku IS NOT NULL`),

    t.index("shop_variants_product_idx").on(tbl.shopProductId, tbl.isActive),
    t.index("shop_variants_master_idx").on(tbl.masterProductVariantId),

    t.check("shop_variants_stock_chk", sql`${tbl.stockQuantity} >= 0`),
    t.check("shop_variants_threshold_chk", sql`${tbl.lowStockThreshold} >= 0`),
  ],
);

// ---------------------------------------------------------------------------
// Shop Product Images
// ---------------------------------------------------------------------------

export const shopProductImagesTable = table(
  "shop_product_images",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    shopProductVariantId: t
      .uuid("shop_product_variant_id")
      .references(() => shopProductVariantTable.id, { onDelete: "cascade" }),

    imageUrl: t.varchar("image_url", { length: 500 }).notNull(),
    thumbnailUrl: t.varchar("thumbnail_url", { length: 500 }),
    altText: t.varchar("alt_text", { length: 255 }),

    isPrimary: t.boolean("is_primary").default(false).notNull(),
    displayOrder: t.smallint("display_order").default(0).notNull(),

    widthPx: t.integer("width_px"),
    heightPx: t.integer("height_px"),
    fileSizeBytes: t.integer("file_size_bytes"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("shop_product_images_product_idx")
      .on(tbl.shopProductId, tbl.isPrimary),
    t.index("shop_product_images_variant_idx").on(tbl.shopProductVariantId),
  ],
);

// =============================================================================
// SECTION 5 — SHOP PRODUCT PRICING
//
// Two tables:
//   shopProductPriceTable  — single-unit base price (one active row per
//                            product/variant/currency)
//   shopProductPricingTiersTable — bulk/volume discount tiers layered on top
// =============================================================================

export const shopProductPriceTable = table(
  "shop_product_prices",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    shopProductVariantId: t
      .uuid("shop_product_variant_id")
      .references(() => shopProductVariantTable.id, { onDelete: "cascade" }),

    // ISO 4217 currency code (default: INR)
    currencyCode: t
      .varchar("currency_code", { length: 3 })
      .default("INR")
      .notNull(),

    // Base pricing (all in smallest currency unit — paise for INR)
    mrp: t.integer("mrp").notNull(), // Maximum Retail Price
    sellingPrice: t.integer("selling_price").notNull(),
    costPrice: t.integer("cost_price"), // for margin calculation

    // Optional discount overlaid on the base selling price
    hasDiscount: t.boolean("has_discount").default(false).notNull(),
    discountType: discountTypeEnum("discount_type"),
    discountValue: t.integer("discount_value"), // percentage (0-100) OR fixed paise

    discountStartDate: t.timestamp("discount_start_date", {
      withTimezone: true,
    }),
    discountEndDate: t.timestamp("discount_end_date", { withTimezone: true }),

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
    // One active price per (product, variant, currency)
    t
      .uniqueIndex("shop_prices_active_uq_idx")
      .on(tbl.shopProductId, tbl.shopProductVariantId, tbl.currencyCode)
      .where(sql`is_active = true`),

    t.index("shop_prices_product_idx").on(tbl.shopProductId, tbl.isActive),
    t.index("shop_prices_variant_idx").on(tbl.shopProductVariantId),
    t
      .index("shop_prices_discount_period_idx")
      .on(tbl.discountStartDate, tbl.discountEndDate, tbl.isActive),

    t.check(
      "shop_prices_values_chk",
      sql`
        ${tbl.mrp} > 0 AND
        ${tbl.sellingPrice} > 0 AND
        ${tbl.sellingPrice} <= ${tbl.mrp} AND
        (${tbl.costPrice} IS NULL OR ${tbl.costPrice} >= 0)
      `,
    ),
    t.check(
      "shop_prices_discount_required_chk",
      sql`
        ${tbl.hasDiscount} = false OR (
          ${tbl.discountType}  IS NOT NULL AND
          ${tbl.discountValue} IS NOT NULL
        )
      `,
    ),
    t.check(
      "shop_prices_discount_value_chk",
      sql`
        ${tbl.discountValue} IS NULL OR
        (${tbl.discountType} = 'percentage'  AND ${tbl.discountValue} BETWEEN 1 AND 100) OR
        (${tbl.discountType} = 'fixed_amount' AND ${tbl.discountValue} > 0)
      `,
    ),
    t.check(
      "shop_prices_discount_dates_chk",
      sql`
        ${tbl.discountEndDate} IS NULL OR
        ${tbl.discountStartDate} IS NULL OR
        ${tbl.discountEndDate} >= ${tbl.discountStartDate}
      `,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Volume / Bulk Pricing Tiers
// ---------------------------------------------------------------------------

export const shopProductPricingTiersTable = table(
  "shop_product_pricing_tiers",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    shopProductVariantId: t
      .uuid("shop_product_variant_id")
      .references(() => shopProductVariantTable.id, { onDelete: "cascade" }),

    tierName: t.varchar("tier_name", { length: 100 }),
    minQuantity: t.integer("min_quantity").notNull(),
    maxQuantity: t.integer("max_quantity"), // null = unlimited

    tierType: pricingTierTypeEnum("tier_type").notNull(),

    // Use the field that matches tierType:
    pricePerUnit: t.integer("price_per_unit"), // for price_per_unit
    totalPrice: t.integer("total_price"), // for total_price
    discountPercentage: t.integer("discount_percentage"), // for discount_percent (0-100)
    discountAmount: t.integer("discount_amount"), // for discount_fixed (paise)

    displayLabel: t.varchar("display_label", { length: 200 }),
    badgeText: t.varchar("badge_text", { length: 50 }),
    badgeColor: t.varchar("badge_color", { length: 20 }),

    priority: t.integer("priority").default(0).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),

    validFrom: t.timestamp("valid_from", { withTimezone: true }),
    validUntil: t.timestamp("valid_until", { withTimezone: true }),

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
      .index("shop_pricing_tiers_product_idx")
      .on(tbl.shopProductId, tbl.minQuantity, tbl.isActive),
    t.index("shop_pricing_tiers_variant_idx").on(tbl.shopProductVariantId),
    t
      .index("shop_pricing_tiers_validity_idx")
      .on(tbl.validFrom, tbl.validUntil, tbl.isActive),

    t.check(
      "shop_pricing_tiers_qty_range_chk",
      sql`
        ${tbl.minQuantity} > 0 AND
        (${tbl.maxQuantity} IS NULL OR ${tbl.maxQuantity} >= ${tbl.minQuantity})
      `,
    ),
    t.check(
      "shop_pricing_tiers_value_chk",
      sql`
        (${tbl.tierType} = 'price_per_unit'   AND ${tbl.pricePerUnit}       > 0) OR
        (${tbl.tierType} = 'total_price'       AND ${tbl.totalPrice}         > 0) OR
        (${tbl.tierType} = 'discount_percent'  AND ${tbl.discountPercentage} BETWEEN 1 AND 100) OR
        (${tbl.tierType} = 'discount_fixed'    AND ${tbl.discountAmount}     > 0)
      `,
    ),
    t.check(
      "shop_pricing_tiers_validity_period_chk",
      sql`
        ${tbl.validUntil} IS NULL OR
        ${tbl.validFrom}  IS NULL OR
        ${tbl.validUntil} >= ${tbl.validFrom}
      `,
    ),
  ],
);

// =============================================================================
// SECTION 6 — COLLECTIONS
// =============================================================================

export const shopCollectionsTable = table(
  "shop_collections",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    collectionName: t.varchar("collection_name", { length: 255 }).notNull(),
    slug: t.varchar("slug", { length: 255 }).notNull(),
    description: t.text("description"),

    // Object-store keys
    coverImageKey: t.varchar("cover_image_key", { length: 500 }),
    thumbnailKey: t.varchar("thumbnail_key", { length: 500 }),

    collectionType: collectionTypeEnum("collection_type")
      .default("manual")
      .notNull(),

    // Rules JSON — only used when collectionType = 'smart'
    autoRules: t.jsonb("auto_rules").$type<Record<string, unknown>>(),

    displayOrder: t.smallint("display_order").default(0).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),
    isFeatured: t.boolean("is_featured").default(false).notNull(),

    // SEO
    metaTitle: t.varchar("meta_title", { length: 255 }),
    metaDescription: t.text("meta_description"),

    // Denormalised stats (async update)
    productCount: t.integer("product_count").default(0).notNull(),
    totalViews: t.integer("total_views").default(0).notNull(),
    totalOrders: t.integer("total_orders").default(0).notNull(),

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
    t.uniqueIndex("shop_collections_slug_uq_idx").on(tbl.shopId, tbl.slug),

    t.index("shop_collections_shop_idx").on(tbl.shopId, tbl.isActive),
    t.index("shop_collections_type_idx").on(tbl.shopId, tbl.collectionType),
    t
      .index("shop_collections_featured_idx")
      .on(tbl.shopId, tbl.isFeatured, tbl.isActive),
  ],
);

export const shopCollectionProductsTable = table(
  "shop_collection_products",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    collectionId: t
      .uuid("collection_id")
      .notNull()
      .references(() => shopCollectionsTable.id, { onDelete: "cascade" }),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    displayOrder: t.smallint("display_order").default(0).notNull(),

    addedAt: t
      .timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    addedBy: t
      .uuid("added_by")
      .references(() => userTable.id, { onDelete: "set null" }),
  },
  (tbl) => [
    t
      .uniqueIndex("shop_collection_products_uq_idx")
      .on(tbl.collectionId, tbl.shopProductId),

    t.index("shop_collection_products_collection_idx").on(tbl.collectionId),
    t.index("shop_collection_products_product_idx").on(tbl.shopProductId),
  ],
);

// =============================================================================
// SECTION 7 — BUNDLES / COMBOS
// =============================================================================

export const productBundlesTable = table(
  "product_bundles",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    bundleName: t.varchar("bundle_name", { length: 255 }).notNull(),
    slug: t.varchar("slug", { length: 255 }).notNull(),
    description: t.text("description"),
    shortDescription: t.varchar("short_description", { length: 500 }),

    bundleType: bundleTypeEnum("bundle_type").notNull().default("flexible"),

    // Only for flexible bundles
    minItemsRequired: t.integer("min_items_required"),
    maxItemsAllowed: t.integer("max_items_allowed"),

    pricingType: bundlePricingTypeEnum("pricing_type").notNull(),

    // Use the field matching pricingType:
    fixedPrice: t.integer("fixed_price"), // paise
    discountPercentage: t.integer("discount_percentage"), // 0-100
    discountAmount: t.integer("discount_amount"), // paise
    buyQuantity: t.integer("buy_quantity"),
    getQuantity: t.integer("get_quantity"),

    // Display-only calculated fields (populated by app layer)
    originalPrice: t.integer("original_price"), // sum of individual prices
    finalPrice: t.integer("final_price"),
    savingsAmount: t.integer("savings_amount"),

    // Object-store keys
    bundleImageKey: t.varchar("bundle_image_key", { length: 500 }),
    thumbnailKey: t.varchar("thumbnail_key", { length: 500 }),

    displayOrder: t.integer("display_order").default(0).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),
    isFeatured: t.boolean("is_featured").default(false).notNull(),

    validFrom: t.timestamp("valid_from", { withTimezone: true }),
    validUntil: t.timestamp("valid_until", { withTimezone: true }),

    // Optional inventory tracking for the bundle as a whole
    trackInventory: t.boolean("track_inventory").default(false).notNull(),
    stockQuantity: t.integer("stock_quantity").default(0),

    // SEO
    metaTitle: t.varchar("meta_title", { length: 255 }),
    metaDescription: t.text("meta_description"),

    // Denormalised stats
    viewCount: t.integer("view_count").default(0).notNull(),
    purchaseCount: t.integer("purchase_count").default(0).notNull(),

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
    t.uniqueIndex("product_bundles_slug_uq_idx").on(tbl.shopId, tbl.slug),

    t.index("product_bundles_shop_idx").on(tbl.shopId, tbl.isActive),
    t.index("product_bundles_type_idx").on(tbl.shopId, tbl.bundleType),
    t
      .index("product_bundles_featured_idx")
      .on(tbl.shopId, tbl.isFeatured, tbl.isActive),
    t
      .index("product_bundles_validity_idx")
      .on(tbl.validFrom, tbl.validUntil, tbl.isActive),

    t.check(
      "product_bundles_pricing_chk",
      sql`
        (${tbl.pricingType} = 'fixed_price'    AND ${tbl.fixedPrice}          > 0) OR
        (${tbl.pricingType} = 'percentage_off' AND ${tbl.discountPercentage}  BETWEEN 1 AND 100) OR
        (${tbl.pricingType} = 'fixed_discount' AND ${tbl.discountAmount}      > 0) OR
        (${tbl.pricingType} = 'buy_x_get_y'   AND ${tbl.buyQuantity}         > 0
                                               AND ${tbl.getQuantity}         > 0)
      `,
    ),
    t.check(
      "product_bundles_flexible_limits_chk",
      sql`
        ${tbl.bundleType} = 'fixed' OR (
          (${tbl.minItemsRequired} IS NULL OR ${tbl.minItemsRequired} >= 1) AND
          (${tbl.maxItemsAllowed}  IS NULL OR ${tbl.maxItemsAllowed}  >= ${tbl.minItemsRequired})
        )
      `,
    ),
    t.check(
      "product_bundles_validity_period_chk",
      sql`
        ${tbl.validUntil} IS NULL OR
        ${tbl.validFrom}  IS NULL OR
        ${tbl.validUntil} >= ${tbl.validFrom}
      `,
    ),
  ],
);

export const bundleItemsTable = table(
  "bundle_items",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    bundleId: t
      .uuid("bundle_id")
      .notNull()
      .references(() => productBundlesTable.id, { onDelete: "cascade" }),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    shopProductVariantId: t
      .uuid("shop_product_variant_id")
      .references(() => shopProductVariantTable.id, { onDelete: "cascade" }),

    quantity: t.integer("quantity").default(1).notNull(),

    // Flexible bundle controls
    isOptional: t.boolean("is_optional").default(false).notNull(),
    isDefault: t.boolean("is_default").default(true).notNull(),

    individualPrice: t.integer("individual_price"), // price if bought separately

    displayOrder: t.integer("display_order").default(0).notNull(),
    displayLabel: t.varchar("display_label", { length: 200 }),

    addedAt: t
      .timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("bundle_items_uq_idx")
      .on(tbl.bundleId, tbl.shopProductId, tbl.shopProductVariantId),

    t.index("bundle_items_bundle_idx").on(tbl.bundleId),
    t.index("bundle_items_product_idx").on(tbl.shopProductId),

    t.check("bundle_items_qty_chk", sql`${tbl.quantity} > 0`),
  ],
);

// =============================================================================
// SECTION 8 — PRODUCT LINKS (cross-sell / upsell)
// =============================================================================

export const productLinksTable = table(
  "product_links",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    sourceProductId: t
      .uuid("source_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    linkedProductId: t
      .uuid("linked_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    linkType: linkTypeEnum("link_type")
      .notNull()
      .default("frequently_bought_together"),
    linkSource: linkSourceEnum("link_source").notNull().default("manual"),

    // ML / signal strength (0-100)
    linkStrength: t
      .decimal("link_strength", { precision: 5, scale: 2 })
      .default("0.00"),
    confidence: t
      .decimal("confidence", { precision: 5, scale: 2 })
      .default("0.00"),

    // Co-occurrence counters (updated by background job)
    coPurchaseCount: t.integer("co_purchase_count").default(0).notNull(),
    coViewCount: t.integer("co_view_count").default(0).notNull(),
    coCartCount: t.integer("co_cart_count").default(0).notNull(),

    displayOrder: t.integer("display_order").default(0).notNull(),
    customLabel: t.varchar("custom_label", { length: 200 }),

    isActive: t.boolean("is_active").default(true).notNull(),
    isApproved: t.boolean("is_approved").default(true).notNull(),

    // Performance counters
    impressionCount: t.integer("impression_count").default(0).notNull(),
    clickCount: t.integer("click_count").default(0).notNull(),
    addToCartCount: t.integer("add_to_cart_count").default(0).notNull(),
    purchaseCount: t.integer("purchase_count").default(0).notNull(),

    revenueGenerated: t.integer("revenue_generated").default(0), // paise

    lastRefreshedAt: t.timestamp("last_refreshed_at", { withTimezone: true }),
    nextRefreshAt: t.timestamp("next_refresh_at", { withTimezone: true }),

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
    // One directional link per type — e.g. A→B for FBT is independent of B→A
    t
      .uniqueIndex("product_links_direction_type_uq_idx")
      .on(tbl.sourceProductId, tbl.linkedProductId, tbl.linkType),

    t
      .index("product_links_source_idx")
      .on(tbl.sourceProductId, tbl.linkType, tbl.isActive),
    t.index("product_links_shop_idx").on(tbl.shopId, tbl.isActive),
    t.index("product_links_strength_idx").on(tbl.linkStrength, tbl.isActive),
    t
      .index("product_links_source_approval_idx")
      .on(tbl.linkSource, tbl.isApproved),
    t.index("product_links_refresh_idx").on(tbl.nextRefreshAt, tbl.linkSource),

    t.check(
      "product_links_no_self_link_chk",
      sql`${tbl.sourceProductId} <> ${tbl.linkedProductId}`,
    ),
    t.check(
      "product_links_strength_range_chk",
      sql`${tbl.linkStrength} BETWEEN 0 AND 100`,
    ),
    t.check(
      "product_links_confidence_range_chk",
      sql`${tbl.confidence} BETWEEN 0 AND 100`,
    ),
  ],
);

// AI-suggested links awaiting approval
export const recommendationQueueTable = table(
  "recommendation_queue",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    sourceProductId: t
      .uuid("source_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    recommendedProductId: t
      .uuid("recommended_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    linkType: linkTypeEnum("link_type").notNull(),
    confidenceScore: t
      .decimal("confidence_score", { precision: 5, scale: 2 })
      .notNull(),
    reason: t.text("reason"),
    supportingData: t.jsonb("supporting_data").$type<Record<string, unknown>>(),

    status: recQueueStatusEnum("status").notNull().default("pending"),

    reviewedBy: t
      .uuid("reviewed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: t.text("review_notes"),

    createdLinkId: t
      .uuid("created_link_id")
      .references(() => productLinksTable.id, { onDelete: "set null" }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
  },
  (tbl) => [
    t.index("recommendation_queue_shop_idx").on(tbl.shopId, tbl.status),
    t.index("recommendation_queue_expires_idx").on(tbl.expiresAt),
  ],
);

// =============================================================================
// SECTION 9 — DAILY PICKS
// =============================================================================

export const dailyPicksTable = table(
  "daily_picks",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    pickDate: t
      .date("pick_date")
      .notNull()
      .default(sql`CURRENT_DATE`),

    title: t.varchar("title", { length: 200 }),
    description: t.text("description"),
    dailyMessage: t.text("daily_message"),

    bannerImageKey: t.varchar("banner_image_key", { length: 500 }),

    displayStyle: t
      .varchar("display_style", { length: 50 })
      .default("carousel"),
    maxProducts: t.integer("max_products").default(10),

    isActive: t.boolean("is_active").default(true).notNull(),
    isPublished: t.boolean("is_published").default(false).notNull(),
    publishedAt: t.timestamp("published_at", { withTimezone: true }),

    scheduleStartTime: t.time("schedule_start_time"),
    scheduleEndTime: t.time("schedule_end_time"),

    // Denormalised stats
    totalViews: t.integer("total_views").default(0).notNull(),
    totalClicks: t.integer("total_clicks").default(0).notNull(),
    totalPurchases: t.integer("total_purchases").default(0).notNull(),
    totalRevenue: t.integer("total_revenue").default(0).notNull(), // paise

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
    t.uniqueIndex("daily_picks_shop_date_uq_idx").on(tbl.shopId, tbl.pickDate),

    t.index("daily_picks_shop_date_idx").on(tbl.shopId, tbl.pickDate),
    t
      .index("daily_picks_active_idx")
      .on(tbl.shopId, tbl.isActive, tbl.isPublished),
  ],
);

export const dailyPickProductsTable = table(
  "daily_pick_products",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    dailyPickId: t
      .uuid("daily_pick_id")
      .notNull()
      .references(() => dailyPicksTable.id, { onDelete: "cascade" }),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    displayOrder: t.integer("display_order").default(0).notNull(),

    customTitle: t.varchar("custom_title", { length: 200 }),
    productNote: t.text("product_note"),
    highlightText: t.varchar("highlight_text", { length: 100 }),

    // Optional daily-pick special price (overrides regular price)
    specialPrice: t.integer("special_price"), // paise
    specialPriceLabel: t.varchar("special_price_label", { length: 100 }),

    badgeText: t.varchar("badge_text", { length: 50 }),
    badgeColor: t.varchar("badge_color", { length: 20 }),

    maxQuantityForPick: t.integer("max_quantity_for_pick"),
    quantitySold: t.integer("quantity_sold").default(0).notNull(),

    // Denormalised stats
    viewCount: t.integer("view_count").default(0).notNull(),
    clickCount: t.integer("click_count").default(0).notNull(),
    addToCartCount: t.integer("add_to_cart_count").default(0).notNull(),
    purchaseCount: t.integer("purchase_count").default(0).notNull(),
    revenueGenerated: t.integer("revenue_generated").default(0).notNull(), // paise

    addedAt: t
      .timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("daily_pick_products_uq_idx")
      .on(tbl.dailyPickId, tbl.shopProductId),

    t
      .index("daily_pick_products_pick_order_idx")
      .on(tbl.dailyPickId, tbl.displayOrder),
    t.index("daily_pick_products_product_idx").on(tbl.shopProductId),

    t.check(
      "daily_pick_products_special_price_chk",
      sql`${tbl.specialPrice} IS NULL OR ${tbl.specialPrice} > 0`,
    ),
    t.check(
      "daily_pick_products_max_qty_chk",
      sql`${tbl.maxQuantityForPick} IS NULL OR ${tbl.maxQuantityForPick} > 0`,
    ),
    t.check(
      "daily_pick_products_qty_sold_chk",
      sql`
        ${tbl.maxQuantityForPick} IS NULL OR
        ${tbl.quantitySold} <= ${tbl.maxQuantityForPick}
      `,
    ),
  ],
);

// =============================================================================
// SECTION 10 — PRODUCT FILTERS
// =============================================================================

export const productFiltersTable = table(
  "product_filters",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .references(() => shopsTable.id, { onDelete: "cascade" }), // null = global filter

    filterScope: filterScopeEnum("filter_scope").notNull().default("category"),
    categoryId: t
      .uuid("category_id")
      .references(() => categoriesTable.id, { onDelete: "cascade" }), // null = global

    filterKey: t.varchar("filter_key", { length: 100 }).notNull(),
    filterName: t.varchar("filter_name", { length: 100 }).notNull(),
    filterType: filterTypeEnum("filter_type").notNull(),
    displayStyle: filterDisplayStyleEnum("display_style"),

    description: t.text("description"),
    helpText: t.varchar("help_text", { length: 255 }),

    // Options (for select-type filters)
    filterOptions: t.jsonb("filter_options").$type<
      {
        value: string;
        label: string;
        color?: string;
        icon?: string;
        imageUrl?: string;
        count?: number;
        isPopular?: boolean;
      }[]
    >(),

    // Range configuration (for range-type filters)
    minValue: t.decimal("min_value", { precision: 10, scale: 2 }),
    maxValue: t.decimal("max_value", { precision: 10, scale: 2 }),
    stepValue: t.decimal("step_value", { precision: 10, scale: 2 }),
    unit: t.varchar("unit", { length: 20 }),

    displayOrder: t.integer("display_order").default(0).notNull(),
    isCollapsible: t.boolean("is_collapsible").default(true).notNull(),
    isCollapsedByDefault: t
      .boolean("is_collapsed_by_default")
      .default(false)
      .notNull(),
    showProductCount: t.boolean("show_product_count").default(true).notNull(),

    isSearchable: t.boolean("is_searchable").default(false).notNull(),
    searchPlaceholder: t.varchar("search_placeholder", { length: 100 }),

    isActive: t.boolean("is_active").default(true).notNull(),
    isRequired: t.boolean("is_required").default(false).notNull(),

    allowCustomValues: t
      .boolean("allow_custom_values")
      .default(false)
      .notNull(),

    // Self-referential FK for dependent filters (e.g. Model depends on Brand)
    dependsOnFilterId: t.uuid("depends_on_filter_id"),

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
    t.foreignKey({
      name: "product_filters_depends_on_fk",
      columns: [tbl.dependsOnFilterId],
      foreignColumns: [tbl.id],
    }),

    // Unique filter key per scope anchor
    t
      .uniqueIndex("product_filters_category_key_uq_idx")
      .on(tbl.categoryId, tbl.filterKey)
      .where(sql`category_id IS NOT NULL`),
    t
      .uniqueIndex("product_filters_shop_key_uq_idx")
      .on(tbl.shopId, tbl.filterKey)
      .where(sql`shop_id IS NOT NULL`),

    t
      .index("product_filters_category_idx")
      .on(tbl.categoryId, tbl.isActive, tbl.displayOrder),
    t.index("product_filters_shop_idx").on(tbl.shopId, tbl.isActive),
    t.index("product_filters_scope_idx").on(tbl.filterScope, tbl.isActive),

    t.check(
      "product_filters_range_chk",
      sql`
        ${tbl.filterType} <> 'range' OR (
          ${tbl.minValue} IS NOT NULL AND
          ${tbl.maxValue} IS NOT NULL AND
          ${tbl.maxValue} > ${tbl.minValue}
        )
      `,
    ),
    t.check(
      "product_filters_options_chk",
      sql`
        ${tbl.filterType} NOT IN ('single_select', 'multi_select', 'color', 'size') OR
        ${tbl.filterOptions} IS NOT NULL
      `,
    ),
    t.check(
      "product_filters_scope_anchor_chk",
      sql`
        (${tbl.filterScope} = 'global'   AND ${tbl.categoryId} IS NULL AND ${tbl.shopId} IS NULL) OR
        (${tbl.filterScope} = 'category' AND ${tbl.categoryId} IS NOT NULL) OR
        (${tbl.filterScope} = 'shop'     AND ${tbl.shopId}     IS NOT NULL)
      `,
    ),
  ],
);

export const productFilterValuesTable = table(
  "product_filter_values",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    filterId: t
      .uuid("filter_id")
      .notNull()
      .references(() => productFiltersTable.id, { onDelete: "cascade" }),

    textValue: t.varchar("text_value", { length: 255 }),
    numericValue: t.decimal("numeric_value", { precision: 10, scale: 2 }),
    booleanValue: t.boolean("boolean_value"),
    arrayValue: t.jsonb("array_value").$type<string[]>(),

    customLabel: t.varchar("custom_label", { length: 200 }),
    sortOrder: t.integer("sort_order").default(0),

    isVerified: t.boolean("is_verified").default(true).notNull(),
    verifiedBy: t
      .uuid("verified_by")
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
      .uniqueIndex("product_filter_values_product_filter_uq_idx")
      .on(tbl.shopProductId, tbl.filterId),
    t.index("product_filter_values_product_idx").on(tbl.shopProductId),
    t
      .index("product_filter_values_filter_text_idx")
      .on(tbl.filterId, tbl.textValue),
    t
      .index("product_filter_values_filter_numeric_idx")
      .on(tbl.filterId, tbl.numericValue),
    t
      .index("product_filter_values_filter_bool_idx")
      .on(tbl.filterId, tbl.booleanValue),

    t.check(
      "product_filter_values_has_value_chk",
      sql`
        ${tbl.textValue}    IS NOT NULL OR
        ${tbl.numericValue} IS NOT NULL OR
        ${tbl.booleanValue} IS NOT NULL OR
        ${tbl.arrayValue}   IS NOT NULL
      `,
    ),
  ],
);

export const filterPresetsTable = table(
  "filter_presets",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),
    categoryId: t
      .uuid("category_id")
      .references(() => categoriesTable.id, { onDelete: "cascade" }),

    presetName: t.varchar("preset_name", { length: 100 }).notNull(),
    description: t.text("description"),

    filterConfig: t
      .jsonb("filter_config")
      .$type<Record<string, unknown>>()
      .notNull(),

    icon: t.varchar("icon", { length: 100 }),
    displayOrder: t.integer("display_order").default(0).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),
    isDefault: t.boolean("is_default").default(false).notNull(),

    usageCount: t.integer("usage_count").default(0).notNull(),

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
    t.index("filter_presets_shop_idx").on(tbl.shopId, tbl.isActive),
    t.index("filter_presets_category_idx").on(tbl.categoryId, tbl.isActive),
  ],
);

export const filterGroupsTable = table(
  "filter_groups",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    categoryId: t
      .uuid("category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),

    groupName: t.varchar("group_name", { length: 100 }).notNull(),
    description: t.text("description"),

    displayOrder: t.integer("display_order").default(0).notNull(),
    isCollapsable: t.boolean("is_collapsable").default(true).notNull(),
    isCollapsedByDefault: t
      .boolean("is_collapsed_by_default")
      .default(false)
      .notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("filter_groups_category_idx").on(tbl.categoryId, tbl.isActive),
  ],
);

export const filterGroupMembersTable = table(
  "filter_group_members",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    groupId: t
      .uuid("group_id")
      .notNull()
      .references(() => filterGroupsTable.id, { onDelete: "cascade" }),
    filterId: t
      .uuid("filter_id")
      .notNull()
      .references(() => productFiltersTable.id, { onDelete: "cascade" }),

    displayOrder: t.integer("display_order").default(0).notNull(),
  },
  (tbl) => [
    t.uniqueIndex("filter_group_members_uq_idx").on(tbl.groupId, tbl.filterId),
    t.index("filter_group_members_group_idx").on(tbl.groupId, tbl.displayOrder),
  ],
);

// =============================================================================
// SECTION 11 — BEHAVIOURAL ANALYTICS
// =============================================================================

// ---------------------------------------------------------------------------
// Product Views (raw event log — partition by view_date in production)
// ---------------------------------------------------------------------------

export const productViewsTable = table(
  "product_views",
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
      .references(() => shopProductVariantTable.id, { onDelete: "set null" }),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    sessionId: t.varchar("session_id", { length: 255 }).notNull(),

    viewedAt: t
      .timestamp("viewed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    viewDate: t
      .date("view_date")
      .default(sql`CURRENT_DATE`)
      .notNull(),
    viewDurationSeconds: t.integer("view_duration_seconds"),

    // Engagement
    scrollDepthPct: t.integer("scroll_depth_pct"), // 0-100
    imagesViewed: t.integer("images_viewed").default(0),
    videoWatched: t.boolean("video_watched").default(false),
    videoWatchDurationSeconds: t.integer("video_watch_duration_seconds"),

    // Actions taken during view
    addedToCart: t.boolean("added_to_cart").default(false).notNull(),
    addedToWishlist: t.boolean("added_to_wishlist").default(false).notNull(),
    shared: t.boolean("shared").default(false).notNull(),
    comparedWithOthers: t
      .boolean("compared_with_others")
      .default(false)
      .notNull(),

    // Navigation
    cameFrom: viewSourceEnum("came_from"),
    referrerUrl: t.text("referrer_url"),
    exitedTo: t.varchar("exited_to", { length: 100 }),
    bounced: t.boolean("bounced").default(false).notNull(),

    // Device & geo
    deviceType: deviceTypeEnum("device_type"),
    browser: t.varchar("browser", { length: 100 }),
    os: t.varchar("os", { length: 100 }),
    userAgent: t.text("user_agent"),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    country: t.varchar("country", { length: 2 }),
    region: t.varchar("region", { length: 100 }),
    city: t.varchar("city", { length: 100 }),

    // UTM attribution
    utmSource: t.varchar("utm_source", { length: 100 }),
    utmMedium: t.varchar("utm_medium", { length: 100 }),
    utmCampaign: t.varchar("utm_campaign", { length: 100 }),
    utmContent: t.varchar("utm_content", { length: 100 }),
    utmTerm: t.varchar("utm_term", { length: 100 }),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (tbl) => [
    t
      .index("product_views_product_date_idx")
      .on(tbl.shopProductId, tbl.viewDate),
    t.index("product_views_user_idx").on(tbl.userId, tbl.viewedAt),
    t.index("product_views_session_idx").on(tbl.sessionId, tbl.viewedAt),
    t.index("product_views_shop_date_idx").on(tbl.shopId, tbl.viewDate),
    t
      .index("product_views_engagement_idx")
      .on(tbl.addedToCart, tbl.addedToWishlist),
  ],
);

// ---------------------------------------------------------------------------
// Product View Aggregates (pre-computed daily roll-up)
// ---------------------------------------------------------------------------

export const productViewAggregatesTable = table(
  "product_view_aggregates",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),
    aggregationDate: t.date("aggregation_date").notNull(),

    totalViews: t.integer("total_views").default(0).notNull(),
    uniqueViews: t.integer("unique_views").default(0).notNull(),
    avgViewDurationSeconds: t.decimal("avg_view_duration_seconds", {
      precision: 10,
      scale: 2,
    }),
    avgScrollDepth: t.decimal("avg_scroll_depth", {
      precision: 5,
      scale: 2,
    }),

    viewsToCartCount: t.integer("views_to_cart_count").default(0).notNull(),
    viewsToWishlistCount: t
      .integer("views_to_wishlist_count")
      .default(0)
      .notNull(),
    viewsToPurchaseCount: t
      .integer("views_to_purchase_count")
      .default(0)
      .notNull(),

    cartConversionRate: t.decimal("cart_conversion_rate", {
      precision: 5,
      scale: 2,
    }),
    purchaseConversionRate: t.decimal("purchase_conversion_rate", {
      precision: 5,
      scale: 2,
    }),

    bounceCount: t.integer("bounce_count").default(0).notNull(),
    bounceRate: t.decimal("bounce_rate", { precision: 5, scale: 2 }),

    totalRevenue: t.integer("total_revenue").default(0), // paise

    lastUpdatedAt: t
      .timestamp("last_updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("product_view_agg_date_uq_idx")
      .on(tbl.shopProductId, tbl.aggregationDate),
    t.index("product_view_agg_date_idx").on(tbl.aggregationDate),
    t.index("product_view_agg_product_idx").on(tbl.shopProductId),
  ],
);

// ---------------------------------------------------------------------------
// Product Interactions (quick-action events)
// ---------------------------------------------------------------------------

export const productInteractionsTable = table(
  "product_interactions",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    sessionId: t.varchar("session_id", { length: 255 }).notNull(),

    interactionType: interactionTypeEnum("interaction_type").notNull(),
    interactionValue: t
      .jsonb("interaction_value")
      .$type<Record<string, unknown>>(),

    pageUrl: t.text("page_url"),
    deviceType: deviceTypeEnum("device_type"),

    interactedAt: t
      .timestamp("interacted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("product_interactions_product_idx")
      .on(tbl.shopProductId, tbl.interactionType, tbl.interactedAt),
    t.index("product_interactions_user_idx").on(tbl.userId, tbl.interactedAt),
    t.index("product_interactions_session_idx").on(tbl.sessionId),
  ],
);

// ---------------------------------------------------------------------------
// Product Comparisons
// ---------------------------------------------------------------------------

export const productComparisonsTable = table(
  "product_comparisons",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    // Array of product IDs being compared — minimum 2
    productIds: t.jsonb("product_ids").$type<string[]>().notNull(),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    sessionId: t.varchar("session_id", { length: 255 }).notNull(),

    comparisonStartedAt: t
      .timestamp("comparison_started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    comparisonEndedAt: t.timestamp("comparison_ended_at", {
      withTimezone: true,
    }),
    comparisonDurationSeconds: t.integer("comparison_duration_seconds"),

    selectedProductId: t
      .uuid("selected_product_id")
      .references(() => shopProductTable.id, { onDelete: "set null" }),
    outcome: comparisonOutcomeEnum("outcome").default("unclear").notNull(),

    comparedAttributes: t.jsonb("compared_attributes").$type<string[]>(),

    wasPurchaseMade: t.boolean("was_purchase_made").default(false).notNull(),
    purchaseId: t.uuid("purchase_id"),
    purchaseAmount: t.integer("purchase_amount"),
    timeToPurchaseSeconds: t.integer("time_to_purchase_seconds"),

    categoryId: t
      .uuid("category_id")
      .references(() => categoriesTable.id, { onDelete: "set null" }),
    cameFrom: viewSourceEnum("came_from"),

    deviceType: deviceTypeEnum("device_type"),
    userAgent: t.text("user_agent"),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    country: t.varchar("country", { length: 2 }),
    city: t.varchar("city", { length: 100 }),

    wasSaved: t.boolean("was_saved").default(false).notNull(),
    wasShared: t.boolean("was_shared").default(false).notNull(),
    sharedVia: t.varchar("shared_via", { length: 50 }),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("product_comparisons_shop_idx").on(tbl.shopId, tbl.createdAt),
    t.index("product_comparisons_user_idx").on(tbl.userId, tbl.createdAt),
    t.index("product_comparisons_session_idx").on(tbl.sessionId),
    t
      .index("product_comparisons_outcome_idx")
      .on(tbl.outcome, tbl.wasPurchaseMade),
    t.index("product_comparisons_category_idx").on(tbl.categoryId),
    t
      .index("product_comparisons_products_gin_idx")
      .using("gin", tbl.productIds),

    t.check(
      "product_comparisons_min_products_chk",
      sql`jsonb_array_length(${tbl.productIds}) >= 2`,
    ),
    t.check(
      "product_comparisons_duration_chk",
      sql`${tbl.comparisonDurationSeconds} IS NULL OR ${tbl.comparisonDurationSeconds} >= 0`,
    ),
  ],
);

// =============================================================================
// SECTION 12 — SEARCH
// =============================================================================

export const searchQueriesTable = table(
  "search_queries",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    searchTerm: t.varchar("search_term", { length: 500 }).notNull(),
    normalizedTerm: t.varchar("normalized_term", { length: 500 }),

    searchIntent: searchIntentEnum("search_intent").default("unclear"),
    queryLength: t.integer("query_length"),
    hasTypos: t.boolean("has_typos").default(false),
    correctedQuery: t.varchar("corrected_query", { length: 500 }),

    filtersApplied: t
      .jsonb("filters_applied")
      .$type<{ filterType: string; values: unknown[] }[]>(),
    sortOrder: t.varchar("sort_order", { length: 50 }),
    priceRange: t.jsonb("price_range").$type<{ min?: number; max?: number }>(),

    resultsCount: t.integer("results_count").default(0).notNull(),
    hasResults: t.boolean("has_results").notNull(),

    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    sessionId: t.varchar("session_id", { length: 255 }).notNull(),

    clickedProductIds: t.jsonb("clicked_product_ids").$type<string[]>(),
    addedToCartProductIds: t
      .jsonb("added_to_cart_product_ids")
      .$type<string[]>(),

    resultedInAddToCart: t
      .boolean("resulted_in_add_to_cart")
      .default(false)
      .notNull(),
    resultedInPurchase: t
      .boolean("resulted_in_purchase")
      .default(false)
      .notNull(),

    deviceType: deviceTypeEnum("device_type"),

    searchedAt: t
      .timestamp("searched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    searchDate: t
      .date("search_date")
      .default(sql`CURRENT_DATE`)
      .notNull(),
  },
  (tbl) => [
    t.index("search_queries_shop_idx").on(tbl.shopId, tbl.searchedAt),
    t.index("search_queries_term_idx").on(tbl.normalizedTerm, tbl.shopId),
    t.index("search_queries_user_idx").on(tbl.userId, tbl.searchedAt),
    t.index("search_queries_session_idx").on(tbl.sessionId),
    t
      .index("search_queries_no_results_idx")
      .on(tbl.shopId, tbl.hasResults)
      .where(sql`has_results = false`),
    t.index("search_queries_date_idx").on(tbl.searchDate, tbl.shopId),
    t
      .index("search_queries_conversion_idx")
      .on(tbl.shopId, tbl.resultedInPurchase, tbl.searchedAt),
  ],
);

export const searchSuggestionsTable = table(
  "search_suggestions",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    suggestionText: t.varchar("suggestion_text", { length: 255 }).notNull(),
    suggestionType: searchSuggestionTypeEnum("suggestion_type").notNull(),

    popularityScore: t.integer("popularity_score").default(0).notNull(),
    trendingScore: t.decimal("trending_score", { precision: 5, scale: 2 }),
    displayOrder: t.integer("display_order").default(0).notNull(),

    impressions: t.integer("impressions").default(0).notNull(),
    clicks: t.integer("clicks").default(0).notNull(),
    conversions: t.integer("conversions").default(0).notNull(),
    clickThroughRate: t.decimal("click_through_rate", {
      precision: 5,
      scale: 2,
    }),

    isActive: t.boolean("is_active").default(true).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastUsedAt: t.timestamp("last_used_at", { withTimezone: true }),
  },
  (tbl) => [
    t
      .uniqueIndex("search_suggestions_shop_text_uq_idx")
      .on(tbl.shopId, tbl.suggestionText),
    t
      .index("search_suggestions_shop_idx")
      .on(tbl.shopId, tbl.isActive, tbl.displayOrder),
    t.index("search_suggestions_text_idx").on(tbl.suggestionText),
  ],
);

// =============================================================================
// SECTION 13 — TRENDING
// =============================================================================

export const trendingProductsTable = table(
  "trending_products",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    periodType: trendPeriodEnum("period_type").notNull(),
    periodStart: t.timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: t.timestamp("period_end", { withTimezone: true }).notNull(),

    generatedAt: t
      .timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    algorithm: t.varchar("algorithm", { length: 50 }).default("weighted_score"),
    algorithmConfig: t.jsonb("algorithm_config").$type<{
      viewWeight?: number;
      purchaseWeight?: number;
      revenueWeight?: number;
      recencyBoost?: number;
      velocityMultiplier?: number;
    }>(),

    rankings: t
      .jsonb("rankings")
      .$type<
        {
          rank: number;
          shopProductId: string;
          productName: string;
          trendScore: number;
          viewCount: number;
          purchaseCount: number;
          revenue: number;
          previousRank?: number;
          rankChange: number;
          trendDirection: "rising" | "falling" | "stable" | "new_entry";
          viewVelocity?: number;
          purchaseVelocity?: number;
        }[]
      >()
      .notNull(),

    totalProductsAnalyzed: t.integer("total_products_analyzed"),
    isActive: t.boolean("is_active").default(true).notNull(),
    isPublished: t.boolean("is_published").default(false).notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("trending_products_period_uq_idx")
      .on(tbl.shopId, tbl.periodType, tbl.periodStart),
    t
      .index("trending_products_shop_idx")
      .on(tbl.shopId, tbl.periodType, tbl.periodStart),
  ],
);

export const trendingCategoriesTable = table(
  "trending_categories",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    periodType: trendPeriodEnum("period_type").notNull(),
    periodStart: t.timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: t.timestamp("period_end", { withTimezone: true }).notNull(),

    rankings: t
      .jsonb("rankings")
      .$type<
        {
          rank: number;
          categoryId: string;
          categoryName: string;
          trendScore: number;
          productCount: number;
          viewCount: number;
          purchaseCount: number;
          revenue: number;
          previousRank?: number;
          rankChange: number;
          trendDirection: "rising" | "falling" | "stable" | "new_entry";
        }[]
      >()
      .notNull(),

    generatedAt: t
      .timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("trending_categories_period_uq_idx")
      .on(tbl.shopId, tbl.periodType, tbl.periodStart),
  ],
);

export const trendingSearchesTable = table(
  "trending_searches",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    periodType: trendPeriodEnum("period_type").notNull(),
    periodStart: t.timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: t.timestamp("period_end", { withTimezone: true }).notNull(),

    rankings: t
      .jsonb("rankings")
      .$type<
        {
          rank: number;
          searchQuery: string;
          searchCount: number;
          clickThroughRate: number;
          conversionRate: number;
          previousRank?: number;
          rankChange: number;
          trendDirection: "rising" | "falling" | "stable" | "new_entry";
        }[]
      >()
      .notNull(),

    generatedAt: t
      .timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("trending_searches_period_uq_idx")
      .on(tbl.shopId, tbl.periodType, tbl.periodStart),
  ],
);

export const productPopularityScoresTable = table(
  "product_popularity_scores",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    // Composite scores (0-100)
    overallScore: t
      .decimal("overall_score", { precision: 5, scale: 2 })
      .notNull(),
    trendingScore: t.decimal("trending_score", { precision: 5, scale: 2 }),
    velocityScore: t.decimal("velocity_score", { precision: 5, scale: 2 }),
    engagementScore: t.decimal("engagement_score", { precision: 5, scale: 2 }),

    views24h: t.integer("views_24h").default(0),
    purchases24h: t.integer("purchases_24h").default(0),
    cartAdds24h: t.integer("cart_adds_24h").default(0),
    views7d: t.integer("views_7d").default(0),
    purchases7d: t.integer("purchases_7d").default(0),

    viewVelocity: t.decimal("view_velocity", { precision: 10, scale: 2 }),
    purchaseVelocity: t.decimal("purchase_velocity", {
      precision: 10,
      scale: 2,
    }),

    shopRank: t.integer("shop_rank"),
    categoryRank: t.integer("category_rank"),

    isTrending: t.boolean("is_trending").default(false).notNull(),
    trendDirection: trendDirectionEnum("trend_direction"),

    lastCalculatedAt: t
      .timestamp("last_calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    nextCalculationAt: t.timestamp("next_calculation_at", {
      withTimezone: true,
    }),
  },
  (tbl) => [
    t.index("product_popularity_product_idx").on(tbl.shopProductId),
    t
      .index("product_popularity_trending_idx")
      .on(tbl.isTrending, tbl.overallScore),
    t.index("product_popularity_calc_idx").on(tbl.nextCalculationAt),
  ],
);

// =============================================================================
// SECTION 14 — PRODUCT Q&A & SHOP ANNOUNCEMENTS
// =============================================================================

export const productQuestionsTable = table(
  "product_questions",
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

    questionText: t.text("question_text").notNull(),
    questionType: questionTypeEnum("question_type")
      .default("general")
      .notNull(),

    askedByUserId: t
      .uuid("asked_by_user_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    askedByName: t.varchar("asked_by_name", { length: 100 }),
    askedByEmail: t.varchar("asked_by_email", { length: 255 }),
    isVerifiedBuyer: t.boolean("is_verified_buyer").default(false).notNull(),

    answerText: t.text("answer_text"),
    answeredBy: answeredByEnum("answered_by"),
    answeredByUserId: t
      .uuid("answered_by_user_id")
      .references(() => userTable.id, { onDelete: "set null" }),

    isAnswered: t.boolean("is_answered").default(false).notNull(),
    isVisible: t.boolean("is_visible").default(true).notNull(),
    isPublic: t.boolean("is_public").default(true).notNull(),
    isPinned: t.boolean("is_pinned").default(false).notNull(),
    isFrequentlyAsked: t
      .boolean("is_frequently_asked")
      .default(false)
      .notNull(),

    isApproved: t.boolean("is_approved").default(true).notNull(),
    moderatedBy: t
      .uuid("moderated_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    displayOrder: t.integer("display_order").default(0).notNull(),

    viewCount: t.integer("view_count").default(0).notNull(),
    helpfulCount: t.integer("helpful_count").default(0).notNull(),
    notHelpfulCount: t.integer("not_helpful_count").default(0).notNull(),

    askerNotified: t.boolean("asker_notified").default(false).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    answeredAt: t.timestamp("answered_at", { withTimezone: true }),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("product_questions_product_idx")
      .on(tbl.shopProductId, tbl.isVisible, tbl.isAnswered),
    t.index("product_questions_shop_idx").on(tbl.shopId, tbl.isAnswered),
    t
      .index("product_questions_faq_idx")
      .on(tbl.shopProductId, tbl.isFrequentlyAsked, tbl.isPinned),
    t.index("product_questions_user_idx").on(tbl.askedByUserId, tbl.createdAt),
    t
      .index("product_questions_unanswered_idx")
      .on(tbl.shopId, tbl.isAnswered)
      .where(sql`is_answered = false`),
  ],
);

export const questionVotesTable = table(
  "question_votes",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    questionId: t
      .uuid("question_id")
      .notNull()
      .references(() => productQuestionsTable.id, { onDelete: "cascade" }),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    isHelpful: t.boolean("is_helpful").notNull(),

    votedAt: t
      .timestamp("voted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("question_votes_uq_idx").on(tbl.questionId, tbl.userId),
    t.index("question_votes_question_idx").on(tbl.questionId),
  ],
);

export const shopAnnouncementsTable = table(
  "shop_announcements",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    title: t.varchar("title", { length: 255 }).notNull(),
    message: t.text("message").notNull(),
    announcementType: catalogueAnnouncementTypeEnum("announcement_type")
      .default("general")
      .notNull(),

    ctaText: t.varchar("cta_text", { length: 100 }),
    ctaUrl: t.varchar("cta_url", { length: 500 }),

    imageKey: t.varchar("image_key", { length: 500 }),

    displayLocation: displayLocationEnum("display_location")
      .default("shop_header")
      .notNull(),
    displayStyle: t.varchar("display_style", { length: 50 }).default("banner"),

    priority: t.integer("priority").default(0).notNull(),

    startDate: t.timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: t.timestamp("end_date", { withTimezone: true }),

    isDismissible: t.boolean("is_dismissible").default(true).notNull(),
    showOncePerSession: t
      .boolean("show_once_per_session")
      .default(false)
      .notNull(),

    isActive: t.boolean("is_active").default(true).notNull(),
    isPublished: t.boolean("is_published").default(false).notNull(),

    // Denormalised engagement
    viewCount: t.integer("view_count").default(0).notNull(),
    clickCount: t.integer("click_count").default(0).notNull(),
    dismissCount: t.integer("dismiss_count").default(0).notNull(),

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
    publishedAt: t.timestamp("published_at", { withTimezone: true }),
  },
  (tbl) => [
    t
      .index("shop_announcements_shop_idx")
      .on(tbl.shopId, tbl.isActive, tbl.isPublished),
    t
      .index("shop_announcements_schedule_idx")
      .on(tbl.shopId, tbl.startDate, tbl.endDate, tbl.isActive),
    t
      .index("shop_announcements_location_idx")
      .on(tbl.displayLocation, tbl.isActive),
    t
      .index("shop_announcements_priority_idx")
      .on(tbl.shopId, tbl.priority, tbl.isActive),

    t.check(
      "shop_announcements_date_range_chk",
      sql`${tbl.endDate} IS NULL OR ${tbl.endDate} >= ${tbl.startDate}`,
    ),
  ],
);

export const announcementDismissalsTable = table(
  "announcement_dismissals",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    announcementId: t
      .uuid("announcement_id")
      .notNull()
      .references(() => shopAnnouncementsTable.id, { onDelete: "cascade" }),
    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "cascade" }),
    sessionId: t.varchar("session_id", { length: 255 }),

    dismissedAt: t
      .timestamp("dismissed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("announcement_dismissals_announcement_idx").on(tbl.announcementId),
    t.index("announcement_dismissals_user_idx").on(tbl.userId),
  ],
);

// =============================================================================
// SECTION 15 — STOCK ALERTS
// =============================================================================

export const stockAlertsTable = table(
  "stock_alerts",
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

    alertType: stockAlertTypeEnum("alert_type").notNull().default("low_stock"),
    severity: stockAlertSeverityEnum("severity").notNull().default("medium"),

    currentStock: t.integer("current_stock").notNull(),
    thresholdStock: t.integer("threshold_stock").notNull(),
    previousStock: t.integer("previous_stock"),

    alertMessage: t.text("alert_message"),
    recommendedAction: t.text("recommended_action"),

    expiryDate: t.timestamp("expiry_date", { withTimezone: true }),
    daysUntilExpiry: t.integer("days_until_expiry"),

    isResolved: t.boolean("is_resolved").default(false).notNull(),
    resolvedAt: t.timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: t
      .uuid("resolved_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    resolutionNotes: t.text("resolution_notes"),

    autoResolveAt: t.timestamp("auto_resolve_at", { withTimezone: true }),

    firstNotifiedAt: t.timestamp("first_notified_at", { withTimezone: true }),
    lastNotifiedAt: t.timestamp("last_notified_at", { withTimezone: true }),
    notificationCount: t.integer("notification_count").default(0).notNull(),

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
      .index("stock_alerts_shop_idx")
      .on(tbl.shopId, tbl.isResolved, tbl.severity),
    t.index("stock_alerts_product_idx").on(tbl.shopProductId, tbl.isResolved),
    t
      .index("stock_alerts_unresolved_idx")
      .on(tbl.shopId, tbl.createdAt)
      .where(sql`is_resolved = false`),
    t.index("stock_alerts_auto_resolve_idx").on(tbl.autoResolveAt),

    t.check(
      "stock_alerts_stock_levels_chk",
      sql`${tbl.currentStock} >= 0 AND ${tbl.thresholdStock} >= 0`,
    ),
  ],
);

export const stockAlertHistoryTable = table(
  "stock_alert_history",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    alertId: t
      .uuid("alert_id")
      .notNull()
      .references(() => stockAlertsTable.id, { onDelete: "cascade" }),

    eventType: t.varchar("event_type", { length: 50 }).notNull(),
    previousStock: t.integer("previous_stock"),
    newStock: t.integer("new_stock"),
    changedBy: t
      .uuid("changed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    changeNotes: t.text("change_notes"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("stock_alert_history_alert_idx").on(tbl.alertId, tbl.createdAt),
  ],
);

// =============================================================================
// SECTION 16 — SAVED FOR LATER, PRICE DROP ALERTS, BACK-IN-STOCK ALERTS
// =============================================================================

export const savedForLaterTable = table(
  "saved_for_later",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
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

    source: savedItemSourceEnum("source").default("direct"),

    collectionName: t.varchar("collection_name", { length: 100 }),
    notes: t.text("notes"),
    priority: t.integer("priority").default(0),

    // Price snapshot at save time + current price for change detection
    savedPrice: t.integer("saved_price").notNull(), // paise
    currentPrice: t.integer("current_price"),
    lowestPriceEver: t.integer("lowest_price_ever"),
    lowestPriceDate: t.timestamp("lowest_price_date", { withTimezone: true }),

    // Alert preferences
    notifyOnPriceDrop: t
      .boolean("notify_on_price_drop")
      .default(false)
      .notNull(),
    notifyOnBackInStock: t
      .boolean("notify_on_back_in_stock")
      .default(false)
      .notNull(),
    notifyOnSale: t.boolean("notify_on_sale").default(false).notNull(),
    targetPrice: t.integer("target_price"),
    priceDropPercentage: t.integer("price_drop_percentage"),

    desiredQuantity: t.integer("desired_quantity").default(1).notNull(),

    wasAvailableWhenSaved: t.boolean("was_available_when_saved").notNull(),
    isCurrentlyAvailable: t.boolean("is_currently_available"),
    lastAvailabilityCheck: t.timestamp("last_availability_check", {
      withTimezone: true,
    }),

    timesViewed: t.integer("times_viewed").default(0).notNull(),
    lastViewedAt: t.timestamp("last_viewed_at", { withTimezone: true }),

    reminderDate: t.timestamp("reminder_date", { withTimezone: true }),
    reminderSent: t.boolean("reminder_sent").default(false).notNull(),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

    wasPurchased: t.boolean("was_purchased").default(false).notNull(),
    purchasedAt: t.timestamp("purchased_at", { withTimezone: true }),
    orderId: t.uuid("order_id"),

    savedAt: t
      .timestamp("saved_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("saved_for_later_uq_idx")
      .on(tbl.userId, tbl.shopProductId, tbl.shopProductVariantId),

    t.index("saved_for_later_user_idx").on(tbl.userId, tbl.savedAt),
    t.index("saved_for_later_shop_idx").on(tbl.shopId),
    t.index("saved_for_later_product_idx").on(tbl.shopProductId),
    t
      .index("saved_for_later_notifications_idx")
      .on(tbl.userId, tbl.notifyOnPriceDrop, tbl.notifyOnBackInStock),
    t
      .index("saved_for_later_reminders_idx")
      .on(tbl.reminderDate)
      .where(sql`reminder_sent = false AND reminder_date IS NOT NULL`),
    t.index("saved_for_later_expiration_idx").on(tbl.expiresAt),

    t.check("saved_for_later_qty_chk", sql`${tbl.desiredQuantity} > 0`),
    t.check(
      "saved_for_later_price_drop_pct_chk",
      sql`
        ${tbl.priceDropPercentage} IS NULL OR (
          ${tbl.priceDropPercentage} > 0 AND ${tbl.priceDropPercentage} <= 100
        )
      `,
    ),
  ],
);

export const priceDropAlertsTable = table(
  "price_drop_alerts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    savedId: t
      .uuid("saved_id")
      .notNull()
      .references(() => savedForLaterTable.id, { onDelete: "cascade" }),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),

    oldPrice: t.integer("old_price").notNull(), // paise
    newPrice: t.integer("new_price").notNull(), // paise
    dropAmount: t.integer("drop_amount").notNull(),
    dropPercentage: t
      .decimal("drop_percentage", { precision: 5, scale: 2 })
      .notNull(),

    isInStock: t.boolean("is_in_stock").notNull(),
    stockQuantity: t.integer("stock_quantity"),

    status: priceAlertStatusEnum("status").default("pending").notNull(),

    sentAt: t.timestamp("sent_at", { withTimezone: true }),
    viewedAt: t.timestamp("viewed_at", { withTimezone: true }),
    clickedAt: t.timestamp("clicked_at", { withTimezone: true }),
    purchasedAt: t.timestamp("purchased_at", { withTimezone: true }),
    orderId: t.uuid("order_id"),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
    isExpired: t.boolean("is_expired").default(false).notNull(),

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
    t.index("price_drop_alerts_saved_idx").on(tbl.savedId),
    t.index("price_drop_alerts_user_idx").on(tbl.userId, tbl.createdAt),
    t.index("price_drop_alerts_status_idx").on(tbl.status, tbl.createdAt),
    t
      .index("price_drop_alerts_pending_idx")
      .on(tbl.createdAt)
      .where(sql`status = 'pending'`),
    t.index("price_drop_alerts_expiration_idx").on(tbl.expiresAt),

    t.check(
      "price_drop_alerts_price_chk",
      sql`${tbl.newPrice} < ${tbl.oldPrice}`,
    ),
    t.check(
      "price_drop_alerts_amount_chk",
      sql`${tbl.dropAmount} = ${tbl.oldPrice} - ${tbl.newPrice}`,
    ),
  ],
);

export const backInStockAlertsTable = table(
  "back_in_stock_alerts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    savedId: t
      .uuid("saved_id")
      .references(() => savedForLaterTable.id, { onDelete: "cascade" }),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
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

    stockQuantity: t.integer("stock_quantity").notNull(),
    restockedAt: t.timestamp("restocked_at", { withTimezone: true }).notNull(),
    priceAtRestock: t.integer("price_at_restock").notNull(), // paise

    notificationSent: t.boolean("notification_sent").default(false).notNull(),
    sentAt: t.timestamp("sent_at", { withTimezone: true }),
    viewedAt: t.timestamp("viewed_at", { withTimezone: true }),
    purchasedAt: t.timestamp("purchased_at", { withTimezone: true }),
    orderId: t.uuid("order_id"),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
    isExpired: t.boolean("is_expired").default(false).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("back_in_stock_alerts_user_idx").on(tbl.userId, tbl.createdAt),
    t.index("back_in_stock_alerts_product_idx").on(tbl.shopProductId),
    t
      .index("back_in_stock_alerts_pending_idx")
      .on(tbl.notificationSent, tbl.createdAt),
  ],
);

export const savedItemCollectionsTable = table(
  "saved_item_collections",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    collectionName: t.varchar("collection_name", { length: 100 }).notNull(),
    description: t.text("description"),
    coverImageKey: t.varchar("cover_image_key", { length: 500 }),

    isPublic: t.boolean("is_public").default(false).notNull(),
    shareSlug: t.varchar("share_slug", { length: 100 }),

    displayOrder: t.integer("display_order").default(0).notNull(),
    color: t.varchar("color", { length: 20 }),
    icon: t.varchar("icon", { length: 50 }),

    itemCount: t.integer("item_count").default(0).notNull(),
    totalValue: t.integer("total_value").default(0).notNull(), // paise

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
      .uniqueIndex("saved_item_collections_user_name_uq_idx")
      .on(tbl.userId, tbl.collectionName),
    t
      .uniqueIndex("saved_item_collections_share_slug_uq_idx")
      .on(tbl.shareSlug)
      .where(sql`share_slug IS NOT NULL`),

    t.index("saved_item_collections_user_idx").on(tbl.userId, tbl.displayOrder),
  ],
);

// =============================================================================
// SECTION 17 — PRICE HISTORY (append-only)
// =============================================================================

export const productPriceHistoryTable = table(
  "product_price_history",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),
    shopProductVariantId: t
      .uuid("shop_product_variant_id")
      .references(() => shopProductVariantTable.id, { onDelete: "cascade" }),

    price: t.integer("price").notNull(), // paise
    compareAtPrice: t.integer("compare_at_price"), // paise

    previousPrice: t.integer("previous_price"),
    priceChange: t.integer("price_change"),
    changePercentage: t.decimal("change_percentage", {
      precision: 5,
      scale: 2,
    }),
    changeType: t.varchar("change_type", { length: 20 }), // increase | decrease | no_change

    effectiveFrom: t
      .timestamp("effective_from", { withTimezone: true })
      .notNull()
      .defaultNow(),
    effectiveTo: t.timestamp("effective_to", { withTimezone: true }), // null = current price

    changeReason: t.varchar("change_reason", { length: 100 }),
    changedBy: t
      .uuid("changed_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("product_price_history_product_idx")
      .on(tbl.shopProductId, tbl.effectiveFrom),
    t
      .index("product_price_history_current_idx")
      .on(tbl.shopProductId)
      .where(sql`effective_to IS NULL`),
  ],
);

// =============================================================================
// SECTION 18 — AI RECOMMENDATIONS
// =============================================================================

export const catalogAiRecommendationsTable = table(
  "catalog_ai_recommendations",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),
    userId: t
      .uuid("user_id")
      .references(() => userTable.id, { onDelete: "set null" }),
    sessionId: t.varchar("session_id", { length: 255 }),

    recommendationType: catalogueRecommendationTypeEnum(
      "recommendation_type",
    ).notNull(),
    displayLocation: displayLocationEnum("display_location").notNull(),

    inputContext: t.jsonb("input_context").$type<{
      sourceProductId?: string;
      sourceCategoryId?: string;
      cartItems?: string[];
      viewHistory?: string[];
      searchQuery?: string;
      userSegment?: string;
      priceRange?: { min: number; max: number };
      filters?: Record<string, unknown>;
    }>(),

    recommendedItems: t
      .jsonb("recommended_items")
      .$type<
        {
          productId: string;
          productName: string;
          price: number;
          score: number;
          position: number;
          reason?: string;
        }[]
      >()
      .notNull(),

    modelVersion: t.varchar("model_version", { length: 50 }),
    modelType: t.varchar("model_type", { length: 50 }),
    algorithm: t.varchar("algorithm", { length: 100 }),

    overallConfidence: t.decimal("overall_confidence", {
      precision: 5,
      scale: 2,
    }),

    status: recommendationStatusEnum("status").default("generated").notNull(),
    wasShown: t.boolean("was_shown").default(false).notNull(),
    shownAt: t.timestamp("shown_at", { withTimezone: true }),
    impressionCount: t.integer("impression_count").default(0).notNull(),

    clickedItems: t.jsonb("clicked_items").$type<string[]>(),
    clickedAt: t.timestamp("clicked_at", { withTimezone: true }),

    purchasedItems: t.jsonb("purchased_items").$type<string[]>(),
    purchasedAt: t.timestamp("purchased_at", { withTimezone: true }),

    dismissedAt: t.timestamp("dismissed_at", { withTimezone: true }),

    attributedRevenue: t.integer("attributed_revenue").default(0), // paise
    attributedOrders: t.integer("attributed_orders").default(0),

    experimentId: t.varchar("experiment_id", { length: 50 }),
    variantId: t.varchar("variant_id", { length: 50 }),
    controlGroup: t.boolean("control_group").default(false),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
    isExpired: t.boolean("is_expired").default(false).notNull(),

    userFeedback: t.varchar("user_feedback", { length: 50 }),

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
      .index("catalog_recommendations_type_location_idx")
      .on(tbl.recommendationType, tbl.displayLocation),
    t.index("catalog_recommendations_user_idx").on(tbl.userId, tbl.createdAt),
    t.index("catalog_recommendations_session_idx").on(tbl.sessionId),
    t.index("catalog_recommendations_shop_idx").on(tbl.shopId, tbl.createdAt),
    t
      .index("catalog_recommendations_performance_idx")
      .on(tbl.status, tbl.wasShown, tbl.createdAt),
    t
      .index("catalog_recommendations_experiment_idx")
      .on(tbl.experimentId, tbl.variantId),
    t
      .index("catalog_recommendations_items_gin_idx")
      .using("gin", tbl.recommendedItems),
  ],
);

// =============================================================================
// SECTION 19 — MASTER-PRODUCT SUGGESTION WORKFLOW
// =============================================================================

export const masterProductPushSuggestionsTable = table(
  "master_product_push_suggestions",
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

    suggestionType: pushSuggestionTypeEnum("suggestion_type").notNull(),

    suggestedMasterProductId: t
      .uuid("suggested_master_product_id")
      .references(() => masterProductTable.id, { onDelete: "set null" }),

    alternativeMatches: t.jsonb("alternative_matches").$type<
      {
        masterProductId: string;
        masterProductName: string;
        matchScore: number;
        matchReason: string;
        confidence: number;
      }[]
    >(),

    matchType: matchTypeEnum("match_type").notNull(),
    matchScore: t.smallint("match_score").notNull(), // 0-100
    confidenceScore: t.decimal("confidence_score", {
      precision: 5,
      scale: 2,
    }),

    matchSignals: t.jsonb("match_signals").$type<{
      gtinMatch?: boolean;
      skuMatch?: boolean;
      nameSimilarity?: number;
      categorySame?: boolean;
      brandSame?: boolean;
    }>(),

    matchReason: t.text("match_reason"),

    suggestionSource: suggestionSourceEnum("suggestion_source").notNull(),
    submittedBy: t
      .uuid("submitted_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    proposedData: t.jsonb("proposed_data").$type<{
      name: string;
      description?: string;
      categoryId: string;
      brandId?: string;
      gtin?: string;
      specifications?: Record<string, unknown>;
    }>(),

    dataQualityScore: t.integer("data_quality_score"), // 0-100

    status: suggestionStatusEnum("status").default("pending").notNull(),
    priority: t.integer("priority").default(0),

    reviewedBy: t
      .uuid("reviewed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),
    reviewAction: reviewActionEnum("review_action"),
    reviewNotes: t.text("review_notes"),

    createdMasterProductId: t
      .uuid("created_master_product_id")
      .references(() => masterProductTable.id, { onDelete: "set null" }),
    mergedIntoMasterProductId: t
      .uuid("merged_into_master_product_id")
      .references(() => masterProductTable.id, { onDelete: "set null" }),

    autoApprovalEligible: t.boolean("auto_approval_eligible").default(false),
    autoApprovedAt: t.timestamp("auto_approved_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
  },
  (tbl) => [
    t.index("push_suggestions_shop_idx").on(tbl.shopId, tbl.status),
    t.index("push_suggestions_product_idx").on(tbl.shopProductId),
    t.index("push_suggestions_master_idx").on(tbl.suggestedMasterProductId),
    t
      .index("push_suggestions_status_priority_idx")
      .on(tbl.status, tbl.priority, tbl.createdAt),
    t
      .index("push_suggestions_pending_score_idx")
      .on(tbl.status, tbl.matchScore)
      .where(sql`status = 'pending'`),
    t
      .index("push_suggestions_auto_approval_idx")
      .on(tbl.autoApprovalEligible, tbl.status),

    t.check(
      "push_suggestions_match_score_chk",
      sql`${tbl.matchScore} >= 0 AND ${tbl.matchScore} <= 100`,
    ),
    t.check(
      "push_suggestions_type_chk",
      sql`
        (${tbl.suggestionType} = 'create_new'      AND ${tbl.suggestedMasterProductId} IS NULL) OR
        (${tbl.suggestionType} = 'match_existing'  AND ${tbl.suggestedMasterProductId} IS NOT NULL)
      `,
    ),
  ],
);

export const masterProductMatchingQueueTable = table(
  "master_product_matching_queue",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopProductId: t
      .uuid("shop_product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),
    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    status: matchingStatusEnum("status").default("queued").notNull(),

    priority: t.integer("priority").default(0),
    attempts: t.integer("attempts").default(0).notNull(),
    lastAttemptAt: t.timestamp("last_attempt_at", { withTimezone: true }),
    lastError: t.text("last_error"),

    matchesFound: t.integer("matches_found").default(0).notNull(),
    bestMatchId: t.uuid("best_match_id"),
    bestMatchScore: t.integer("best_match_score"),

    suggestionId: t
      .uuid("suggestion_id")
      .references(() => masterProductPushSuggestionsTable.id, {
        onDelete: "set null",
      }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: t.timestamp("processed_at", { withTimezone: true }),
    nextRetryAt: t.timestamp("next_retry_at", { withTimezone: true }),
  },
  (tbl) => [
    t
      .index("matching_queue_status_idx")
      .on(tbl.status, tbl.priority, tbl.createdAt),
    t.index("matching_queue_retry_idx").on(tbl.nextRetryAt),
    t.index("matching_queue_product_idx").on(tbl.shopProductId),
  ],
);

export const duplicateMasterProductReportsTable = table(
  "duplicate_master_product_reports",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    masterProduct1Id: t
      .uuid("master_product_1_id")
      .notNull()
      .references(() => masterProductTable.id, { onDelete: "cascade" }),
    masterProduct2Id: t
      .uuid("master_product_2_id")
      .notNull()
      .references(() => masterProductTable.id, { onDelete: "cascade" }),

    detectionMethod: detectionMethodEnum("detection_method").notNull(),

    similarityScore: t.integer("similarity_score").notNull(), // 0-100

    similarities: t.jsonb("similarities").$type<{
      gtinMatch?: boolean;
      namesSimilar?: number;
      categorySame?: boolean;
      brandSame?: boolean;
    }>(),

    reportedBy: t
      .uuid("reported_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    reportReason: t.text("report_reason"),

    status: duplicateReportStatusEnum("status").default("pending").notNull(),

    reviewedBy: t
      .uuid("reviewed_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: t.text("review_notes"),

    mergedIntoId: t
      .uuid("merged_into_id")
      .references(() => masterProductTable.id, { onDelete: "set null" }),
    mergedAt: t.timestamp("merged_at", { withTimezone: true }),

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
    t.index("duplicate_reports_status_idx").on(tbl.status, tbl.similarityScore),
    t
      .index("duplicate_reports_products_idx")
      .on(tbl.masterProduct1Id, tbl.masterProduct2Id),

    // Canonical pair ordering prevents (A,B) + (B,A) duplicate rows
    t
      .uniqueIndex("duplicate_reports_canonical_pair_uq_idx")
      .on(
        sql`LEAST(${tbl.masterProduct1Id}::text, ${tbl.masterProduct2Id}::text)`,
        sql`GREATEST(${tbl.masterProduct1Id}::text, ${tbl.masterProduct2Id}::text)`,
      ),

    t.check(
      "duplicate_reports_different_products_chk",
      sql`${tbl.masterProduct1Id} <> ${tbl.masterProduct2Id}`,
    ),
  ],
);

// =============================================================================
// SECTION 20 — COUPONS
// =============================================================================

export const shopCouponsTable = table(
  "shop_coupons",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    code: t.varchar("code", { length: 50 }).notNull(),
    internalName: t.varchar("internal_name", { length: 255 }),
    description: t.text("description"),

    discountType: couponDiscountTypeEnum("discount_type").notNull(),
    discountValue: t.integer("discount_value").notNull(), // paise or percentage
    maxDiscountAmount: t.integer("max_discount_amount"), // cap for percentage discounts

    minPurchaseAmount: t.integer("min_purchase_amount"),
    minQuantity: t.integer("min_quantity"),

    target: couponTargetEnum("target").notNull().default("all"),
    scope: couponScopeEnum("scope").notNull().default("order_total"),

    startDate: t.timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: t.timestamp("end_date", { withTimezone: true }),
    timezone: t.varchar("timezone", { length: 50 }).default("UTC"),

    usageRestriction: usageRestrictionEnum("usage_restriction")
      .notNull()
      .default("unlimited"),
    totalUsageLimit: t.integer("total_usage_limit"),
    perUserUsageLimit: t.integer("per_user_usage_limit"),
    usageCount: t.integer("usage_count").default(0).notNull(),

    isStackable: t.boolean("is_stackable").default(false).notNull(),
    stackableWith: t.jsonb("stackable_with").$type<string[]>(),

    status: couponStatusEnum("status").notNull().default("active"),
    priority: t.integer("priority").default(0).notNull(),
    generationMethod: generationMethodEnum("generation_method")
      .notNull()
      .default("manual"),

    campaignId: t.varchar("campaign_id", { length: 100 }),
    isPublic: t.boolean("is_public").default(true).notNull(),
    requiresAuthentication: t
      .boolean("requires_authentication")
      .default(false)
      .notNull(),

    conditions: t.jsonb("conditions").$type<{
      customerTags?: string[];
      customerPurchaseCount?: { min?: number; max?: number };
      dayOfWeek?: number[];
      timeOfDay?: { start: string; end: string };
      deviceType?: ("mobile" | "desktop" | "tablet")[];
      geoRestrictions?: {
        allowedCountries?: string[];
        excludedCountries?: string[];
      };
    }>(),

    // Buy X Get Y config — only used when discountType = 'buy_x_get_y'
    buyXGetYConfig: t.jsonb("buy_x_get_y_config").$type<{
      buyQuantity: number;
      getQuantity: number;
      applyTo?: "same_product" | "any_product" | "specific_products";
      specificProductIds?: string[];
      maxApplications?: number;
    }>(),

    // Tiered discount config — only used when discountType = 'tiered'
    tieredConfig: t.jsonb("tiered_config").$type<{
      tiers: Array<{
        minAmount: number;
        discountType: "percentage" | "fixed_amount";
        discountValue: number;
      }>;
    }>(),

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
    lastUsedAt: t.timestamp("last_used_at", { withTimezone: true }),
  },
  (tbl) => [
    t.uniqueIndex("shop_coupons_code_uq_idx").on(tbl.shopId, tbl.code),

    t.index("shop_coupons_shop_status_idx").on(tbl.shopId, tbl.status),
    t
      .index("shop_coupons_code_lookup_idx")
      .on(tbl.code, tbl.shopId, tbl.status),
    t
      .index("shop_coupons_validity_idx")
      .on(tbl.startDate, tbl.endDate, tbl.status)
      .where(sql`status = 'active'`),
    t.index("shop_coupons_conditions_gin_idx").using("gin", tbl.conditions),

    t.check(
      "shop_coupons_date_range_chk",
      sql`${tbl.endDate} IS NULL OR ${tbl.endDate} > ${tbl.startDate}`,
    ),
    t.check("shop_coupons_discount_value_chk", sql`${tbl.discountValue} > 0`),
    t.check(
      "shop_coupons_usage_limit_chk",
      sql`${tbl.totalUsageLimit} IS NULL OR ${tbl.totalUsageLimit} > 0`,
    ),
    t.check("shop_coupons_usage_count_chk", sql`${tbl.usageCount} >= 0`),
  ],
);

// Coupon → Product / Collection / Category associations
export const couponProductsTable = table(
  "coupon_products",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),
    couponId: t
      .uuid("coupon_id")
      .notNull()
      .references(() => shopCouponsTable.id, { onDelete: "cascade" }),
    productId: t
      .uuid("product_id")
      .notNull()
      .references(() => shopProductTable.id, { onDelete: "cascade" }),
    variantId: t.uuid("variant_id"),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("coupon_products_uq_idx").on(tbl.couponId, tbl.productId),
    t.index("coupon_products_coupon_idx").on(tbl.couponId),
    t.index("coupon_products_product_idx").on(tbl.productId),
  ],
);

export const couponCollectionsTable = table(
  "coupon_collections",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),
    couponId: t
      .uuid("coupon_id")
      .notNull()
      .references(() => shopCouponsTable.id, { onDelete: "cascade" }),
    collectionId: t
      .uuid("collection_id")
      .notNull()
      .references(() => shopCollectionsTable.id, { onDelete: "cascade" }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("coupon_collections_uq_idx")
      .on(tbl.couponId, tbl.collectionId),
    t.index("coupon_collections_coupon_idx").on(tbl.couponId),
  ],
);

export const couponCategoriesTable = table(
  "coupon_categories",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),
    couponId: t
      .uuid("coupon_id")
      .notNull()
      .references(() => shopCouponsTable.id, { onDelete: "cascade" }),
    categoryId: t
      .uuid("category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("coupon_categories_uq_idx").on(tbl.couponId, tbl.categoryId),
    t.index("coupon_categories_coupon_idx").on(tbl.couponId),
  ],
);

// Coupon usage history (append-only — never UPDATE or DELETE rows)
// orderId FK intentionally left as uuid (no FK constraint) because the orders
// table is in a separate model file; the app layer enforces referential integrity.
export const couponUsageHistoryTable = table(
  "coupon_usage_history",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    couponId: t
      .uuid("coupon_id")
      .notNull()
      .references(() => shopCouponsTable.id, { onDelete: "restrict" }),

    orderId: t.uuid("order_id").notNull(),
    userId: t.uuid("user_id"),
    sessionId: t.varchar("session_id", { length: 255 }),

    discountAmount: t.integer("discount_amount").notNull(), // paise
    orderTotal: t.integer("order_total").notNull(), // paise, before discount
    orderTotalAfterDiscount: t.integer("order_total_after_discount").notNull(),

    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),
    deviceType: t.varchar("device_type", { length: 20 }),
    country: t.varchar("country", { length: 2 }),

    isSuccessful: t.boolean("is_successful").default(true).notNull(),
    failureReason: t.text("failure_reason"),

    wasRefunded: t.boolean("was_refunded").default(false).notNull(),
    refundedAt: t.timestamp("refunded_at", { withTimezone: true }),

    usedAt: t
      .timestamp("used_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("coupon_usage_coupon_idx").on(tbl.couponId, tbl.usedAt),
    t.index("coupon_usage_order_idx").on(tbl.orderId),
    t
      .index("coupon_usage_user_idx")
      .on(tbl.userId, tbl.couponId)
      .where(sql`user_id IS NOT NULL`),
    t.index("coupon_usage_session_idx").on(tbl.sessionId, tbl.usedAt),
  ],
);

// Coupon code batches (bulk generation)
export const couponCodeBatchesTable = table(
  "coupon_code_batches",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    batchName: t.varchar("batch_name", { length: 255 }).notNull(),
    prefix: t.varchar("prefix", { length: 20 }),
    suffix: t.varchar("suffix", { length: 20 }),

    totalCodes: t.integer("total_codes").notNull(),
    codesGenerated: t.integer("codes_generated").default(0).notNull(),
    codeLength: t.integer("code_length").notNull().default(8),

    discountType: couponDiscountTypeEnum("discount_type").notNull(),
    discountValue: t.integer("discount_value").notNull(),
    startDate: t.timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: t.timestamp("end_date", { withTimezone: true }),
    perCodeUsageLimit: t.integer("per_code_usage_limit").default(1),

    status: t.varchar("status", { length: 20 }).notNull().default("pending"), // pending | generating | completed | failed

    purpose: t.text("purpose"),
    createdBy: t
      .uuid("created_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    generationStartedAt: t.timestamp("generation_started_at", {
      withTimezone: true,
    }),
    generationCompletedAt: t.timestamp("generation_completed_at", {
      withTimezone: true,
    }),

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
    t.index("coupon_code_batches_shop_status_idx").on(tbl.shopId, tbl.status),
  ],
);

// Individual codes from a batch
export const couponCodeInstancesTable = table(
  "coupon_code_instances",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    batchId: t
      .uuid("batch_id")
      .notNull()
      .references(() => couponCodeBatchesTable.id, { onDelete: "cascade" }),
    couponId: t
      .uuid("coupon_id")
      .notNull()
      .references(() => shopCouponsTable.id, { onDelete: "cascade" }),

    code: t.varchar("code", { length: 50 }).notNull(),

    isUsed: t.boolean("is_used").default(false).notNull(),
    usedCount: t.integer("used_count").default(0).notNull(),
    firstUsedAt: t.timestamp("first_used_at", { withTimezone: true }),
    lastUsedAt: t.timestamp("last_used_at", { withTimezone: true }),

    assignedTo: t.uuid("assigned_to"),
    assignedAt: t.timestamp("assigned_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("coupon_code_instances_code_uq_idx").on(tbl.code),

    t.index("coupon_code_instances_batch_idx").on(tbl.batchId),
    t
      .index("coupon_code_instances_unused_idx")
      .on(tbl.batchId, tbl.isUsed)
      .where(sql`is_used = false`),
    t
      .index("coupon_code_instances_assigned_idx")
      .on(tbl.assignedTo)
      .where(sql`assigned_to IS NOT NULL`),
  ],
);

// Coupon validation attempts (security / fraud detection)
export const couponValidationAttemptsTable = table(
  "coupon_validation_attempts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    couponCode: t.varchar("coupon_code", { length: 50 }).notNull(),
    couponId: t.uuid("coupon_id"),

    userId: t.uuid("user_id"),
    sessionId: t.varchar("session_id", { length: 255 }),
    ipAddress: t.varchar("ip_address", { length: 45 }),

    isValid: t.boolean("is_valid").notNull(),
    validationResult: t.varchar("validation_result", { length: 50 }).notNull(),
    errorMessage: t.text("error_message"),

    orderTotal: t.integer("order_total"),

    attemptedAt: t
      .timestamp("attempted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("coupon_validation_code_idx").on(tbl.couponCode, tbl.attemptedAt),
    t
      .index("coupon_validation_user_idx")
      .on(tbl.userId, tbl.attemptedAt)
      .where(sql`user_id IS NOT NULL`),
    t.index("coupon_validation_ip_idx").on(tbl.ipAddress, tbl.attemptedAt),
    t
      .index("coupon_validation_failed_idx")
      .on(tbl.isValid, tbl.ipAddress, tbl.attemptedAt)
      .where(sql`is_valid = false`),
  ],
);

// =============================================================================
// SECTION 21 — COINS / LOYALTY POINTS
// =============================================================================

// Per-shop coins programme configuration
export const shopCoinsConfigTable = table(
  "shop_coins_config",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    isEnabled: t.boolean("is_enabled").default(true).notNull(),
    coinName: t.varchar("coin_name", { length: 50 }).default("Coins").notNull(),
    coinNamePlural: t
      .varchar("coin_name_plural", { length: 50 })
      .default("Coins")
      .notNull(),
    coinSymbol: t.varchar("coin_symbol", { length: 10 }).default("🪙"),

    // Earning: earningRate coins per earningRateUnit paise spent
    earningRate: t.integer("earning_rate").notNull().default(1),
    earningRateUnit: t.integer("earning_rate_unit").default(100).notNull(), // 100 paise = ₹1
    minPurchaseForEarning: t
      .integer("min_purchase_for_earning")
      .default(0)
      .notNull(),

    // Redemption: 1 coin = redemptionRate paise
    redemptionRate: t.integer("redemption_rate").notNull().default(100),
    minCoinsForRedemption: t
      .integer("min_coins_for_redemption")
      .default(100)
      .notNull(),
    maxRedemptionPerOrder: t.integer("max_redemption_per_order"),
    maxRedemptionPercentage: t.integer("max_redemption_percentage"), // 0-100

    // Expiry
    coinsExpireAfterDays: t.integer("coins_expire_after_days"), // null = never
    expirationWarningDays: t.integer("expiration_warning_days").default(30),

    // Earning policy flags
    earnOnDiscountedAmount: t
      .boolean("earn_on_discounted_amount")
      .default(true)
      .notNull(),
    earnWithCouponUse: t
      .boolean("earn_with_coupon_use")
      .default(true)
      .notNull(),

    // Welcome bonus
    signupBonusEnabled: t
      .boolean("signup_bonus_enabled")
      .default(true)
      .notNull(),
    signupBonusAmount: t.integer("signup_bonus_amount").default(100).notNull(),

    // Referral
    referralEnabled: t.boolean("referral_enabled").default(true).notNull(),
    referralRewardReferrer: t
      .integer("referral_reward_referrer")
      .default(500)
      .notNull(),
    referralRewardReferee: t
      .integer("referral_reward_referee")
      .default(200)
      .notNull(),
    referralMinPurchase: t.integer("referral_min_purchase"),

    // Birthday bonus
    birthdayBonusEnabled: t
      .boolean("birthday_bonus_enabled")
      .default(false)
      .notNull(),
    birthdayBonusAmount: t
      .integer("birthday_bonus_amount")
      .default(500)
      .notNull(),

    // Daily check-in
    dailyCheckinEnabled: t
      .boolean("daily_checkin_enabled")
      .default(false)
      .notNull(),
    dailyCheckinAmount: t.integer("daily_checkin_amount").default(10).notNull(),
    dailyCheckinStreakBonus: t
      .jsonb("daily_checkin_streak_bonus")
      .$type<{ days: number; bonus: number }[]>(),

    // Tier system
    tierSystemEnabled: t
      .boolean("tier_system_enabled")
      .default(false)
      .notNull(),
    tierBenefits: t.jsonb("tier_benefits").$type<
      {
        tier: string;
        earningMultiplier: number;
        minSpend?: number;
        minPoints?: number;
        perks?: string[];
      }[]
    >(),

    // Exclusions
    excludedProducts: t.jsonb("excluded_products").$type<string[]>(),
    excludedCategories: t.jsonb("excluded_categories").$type<string[]>(),

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
    t.uniqueIndex("shop_coins_config_shop_uq_idx").on(tbl.shopId),

    t.check(
      "shop_coins_config_earning_rate_chk",
      sql`${tbl.earningRate} > 0 AND ${tbl.earningRateUnit} > 0`,
    ),
    t.check(
      "shop_coins_config_redemption_rate_chk",
      sql`${tbl.redemptionRate} > 0`,
    ),
    t.check(
      "shop_coins_config_redemption_pct_chk",
      sql`
        ${tbl.maxRedemptionPercentage} IS NULL OR
        (${tbl.maxRedemptionPercentage} > 0 AND ${tbl.maxRedemptionPercentage} <= 100)
      `,
    ),
  ],
);

// Per-customer coin balance per shop
export const customerCoinsBalanceTable = table(
  "customer_coins_balance",
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

    totalEarned: t.integer("total_earned").default(0).notNull(),
    totalRedeemed: t.integer("total_redeemed").default(0).notNull(),
    totalExpired: t.integer("total_expired").default(0).notNull(),
    currentBalance: t.integer("current_balance").default(0).notNull(),
    pendingBalance: t.integer("pending_balance").default(0).notNull(),

    currentTier: customerTierEnum("current_tier"),
    tierProgress: t.integer("tier_progress").default(0),

    lifetimeSpend: t
      .bigint("lifetime_spend", { mode: "bigint" })
      .default(sql`0`)
      .notNull(), // paise
    totalTransactions: t.integer("total_transactions").default(0).notNull(),
    lastEarnedAt: t.timestamp("last_earned_at", { withTimezone: true }),
    lastRedeemedAt: t.timestamp("last_redeemed_at", { withTimezone: true }),

    dailyCheckinStreak: t.integer("daily_checkin_streak").default(0).notNull(),
    lastCheckinDate: t.date("last_checkin_date"),
    longestStreak: t.integer("longest_streak").default(0).notNull(),

    isActive: t.boolean("is_active").default(true).notNull(),
    isFrozen: t.boolean("is_frozen").default(false).notNull(),
    frozenReason: t.text("frozen_reason"),
    frozenAt: t.timestamp("frozen_at", { withTimezone: true }),

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
      .uniqueIndex("customer_coins_balance_shop_user_uq_idx")
      .on(tbl.shopId, tbl.userId),

    t.index("customer_coins_balance_tier_idx").on(tbl.currentTier, tbl.shopId),
    t.index("customer_coins_balance_active_idx").on(tbl.isActive, tbl.shopId),

    t.check(
      "customer_coins_balance_chk",
      sql`${tbl.currentBalance} >= 0 AND ${tbl.pendingBalance} >= 0`,
    ),
  ],
);

// Append-only coin transaction ledger
// NEVER issue UPDATE or DELETE on this table.
export const coinsTransactionsTable = table(
  "coins_transactions",
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

    transactionType: coinTransactionTypeEnum("transaction_type").notNull(),
    amount: t.integer("amount").notNull(),
    balanceBefore: t.integer("balance_before").notNull(),
    balanceAfter: t.integer("balance_after").notNull(),

    source: coinEarningSourceEnum("source"),
    redemptionType: coinRedemptionTypeEnum("redemption_type"),

    orderId: t.uuid("order_id"),
    referralId: t.uuid("referral_id"),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
    isExpired: t.boolean("is_expired").default(false).notNull(),
    expiredAt: t.timestamp("expired_at", { withTimezone: true }),

    status: coinTransactionStatusEnum("status").default("completed").notNull(),

    description: t.text("description"),
    internalNote: t.text("internal_note"),
    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    processedBy: t.uuid("processed_by"),
    reversedBy: t.uuid("reversed_by"),
    reversedAt: t.timestamp("reversed_at", { withTimezone: true }),
    reversalReason: t.text("reversal_reason"),

    transactionDate: t
      .timestamp("transaction_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("coins_transactions_user_idx").on(tbl.userId, tbl.transactionDate),
    t.index("coins_transactions_shop_idx").on(tbl.shopId, tbl.transactionDate),
    t.index("coins_transactions_type_idx").on(tbl.transactionType, tbl.shopId),
    t
      .index("coins_transactions_order_idx")
      .on(tbl.orderId)
      .where(sql`order_id IS NOT NULL`),
    t
      .index("coins_transactions_expiring_idx")
      .on(tbl.expiresAt)
      .where(sql`expires_at IS NOT NULL AND is_expired = false`),

    t.check(
      "coins_transactions_balance_after_chk",
      sql`${tbl.balanceAfter} >= 0`,
    ),
  ],
);

// Redemption catalog items
export const coinsRedemptionCatalogTable = table(
  "coins_redemption_catalog",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    rewardName: t.varchar("reward_name", { length: 255 }).notNull(),
    description: t.text("description"),
    redemptionType: coinRedemptionTypeEnum("redemption_type").notNull(),

    coinsCost: t.integer("coins_cost").notNull(),

    discountValue: t.integer("discount_value"),
    discountType: t.varchar("discount_type", { length: 20 }), // fixed | percentage

    imageKey: t.varchar("image_key", { length: 500 }),
    stockQuantity: t.integer("stock_quantity"),
    isPhysicalReward: t.boolean("is_physical_reward").default(false).notNull(),

    minTierRequired: customerTierEnum("min_tier_required"),
    maxRedemptionsPerCustomer: t.integer("max_redemptions_per_customer"),
    maxRedemptionsTotal: t.integer("max_redemptions_total"),
    redemptionCount: t.integer("redemption_count").default(0).notNull(),

    startDate: t.timestamp("start_date", { withTimezone: true }),
    endDate: t.timestamp("end_date", { withTimezone: true }),
    isActive: t.boolean("is_active").default(true).notNull(),
    isFeatured: t.boolean("is_featured").default(false).notNull(),

    displayOrder: t.integer("display_order").default(0).notNull(),

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
      .index("coins_redemption_catalog_shop_idx")
      .on(tbl.shopId, tbl.isActive, tbl.displayOrder),
    t
      .index("coins_redemption_catalog_type_idx")
      .on(tbl.redemptionType, tbl.shopId),

    t.check("coins_redemption_catalog_cost_chk", sql`${tbl.coinsCost} > 0`),
    t.check(
      "coins_redemption_catalog_stock_chk",
      sql`${tbl.stockQuantity} IS NULL OR ${tbl.stockQuantity} >= 0`,
    ),
  ],
);

// Redemption history
export const coinsRedemptionsTable = table(
  "coins_redemptions",
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

    catalogItemId: t
      .uuid("catalog_item_id")
      .references(() => coinsRedemptionCatalogTable.id, {
        onDelete: "set null",
      }),
    transactionId: t
      .uuid("transaction_id")
      .notNull()
      .references(() => coinsTransactionsTable.id, { onDelete: "restrict" }),

    redemptionType: coinRedemptionTypeEnum("redemption_type").notNull(),
    coinsSpent: t.integer("coins_spent").notNull(),

    rewardName: t.varchar("reward_name", { length: 255 }).notNull(),
    rewardValue: t.integer("reward_value"), // paise

    orderId: t.uuid("order_id"),
    discountApplied: t.integer("discount_applied"),

    // Physical reward fulfillment
    requiresShipping: t.boolean("requires_shipping").default(false).notNull(),
    shippingAddress: t.jsonb("shipping_address").$type<{
      name: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }>(),
    trackingNumber: t.varchar("tracking_number", { length: 100 }),
    shippedAt: t.timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: t.timestamp("delivered_at", { withTimezone: true }),

    status: t.varchar("status", { length: 20 }).default("completed").notNull(),

    voucherCode: t.varchar("voucher_code", { length: 50 }),
    voucherExpiresAt: t.timestamp("voucher_expires_at", {
      withTimezone: true,
    }),
    voucherUsed: t.boolean("voucher_used").default(false).notNull(),
    voucherUsedAt: t.timestamp("voucher_used_at", { withTimezone: true }),

    redeemedAt: t
      .timestamp("redeemed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("coins_redemptions_user_idx").on(tbl.userId, tbl.redeemedAt),
    t.index("coins_redemptions_shop_idx").on(tbl.shopId, tbl.redeemedAt),
    t
      .index("coins_redemptions_order_idx")
      .on(tbl.orderId)
      .where(sql`order_id IS NOT NULL`),
    t.index("coins_redemptions_status_idx").on(tbl.status, tbl.shopId),
  ],
);

// Coins expiration ledger
export const coinsExpirationLedgerTable = table(
  "coins_expiration_ledger",
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
    transactionId: t
      .uuid("transaction_id")
      .notNull()
      .references(() => coinsTransactionsTable.id, { onDelete: "cascade" }),

    coinsAmount: t.integer("coins_amount").notNull(),
    remainingAmount: t.integer("remaining_amount").notNull(),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }).notNull(),
    isExpired: t.boolean("is_expired").default(false).notNull(),
    expiredAt: t.timestamp("expired_at", { withTimezone: true }),

    warningNotificationSent: t
      .boolean("warning_notification_sent")
      .default(false)
      .notNull(),
    warningNotificationSentAt: t.timestamp("warning_notification_sent_at", {
      withTimezone: true,
    }),
    expiryNotificationSent: t
      .boolean("expiry_notification_sent")
      .default(false)
      .notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("coins_expiration_user_idx").on(tbl.userId, tbl.expiresAt),
    t
      .index("coins_expiration_upcoming_idx")
      .on(tbl.expiresAt)
      .where(sql`is_expired = false`),
    t
      .index("coins_expiration_warning_idx")
      .on(tbl.expiresAt, tbl.warningNotificationSent)
      .where(sql`is_expired = false AND warning_notification_sent = false`),
  ],
);

// Daily check-in records
export const coinsDailyCheckinsTable = table(
  "coins_daily_checkins",
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
    transactionId: t
      .uuid("transaction_id")
      .references(() => coinsTransactionsTable.id, { onDelete: "set null" }),

    checkinDate: t.date("checkin_date").notNull(),
    coinsEarned: t.integer("coins_earned").notNull(),
    streakCount: t.integer("streak_count").default(1).notNull(),
    streakBonusEarned: t.integer("streak_bonus_earned").default(0).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("coins_daily_checkins_user_date_uq_idx")
      .on(tbl.userId, tbl.checkinDate),
    t.index("coins_daily_checkins_user_idx").on(tbl.userId, tbl.checkinDate),
  ],
);

// Customer tier change history
export const customerTierHistoryTable = table(
  "customer_tier_history",
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

    previousTier: customerTierEnum("previous_tier"),
    newTier: customerTierEnum("new_tier").notNull(),

    reason: t.text("reason"),
    achievedBy: t.varchar("achieved_by", { length: 50 }), // points | spend | admin

    changedAt: t
      .timestamp("changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("customer_tier_history_user_idx").on(tbl.userId, tbl.changedAt),
  ],
);

// Coins referral tracking (per-shop, independent of auth referrals)
export const coinsReferralsTable = table(
  "coins_referrals",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    referrerId: t
      .uuid("referrer_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    referrerTransactionId: t.uuid("referrer_transaction_id"),

    refereeId: t.uuid("referee_id"),
    refereeEmail: t.varchar("referee_email", { length: 255 }),
    refereeTransactionId: t.uuid("referee_transaction_id"),

    referralCode: t.varchar("referral_code", { length: 50 }).notNull(),

    referrerReward: t.integer("referrer_reward"),
    refereeReward: t.integer("referee_reward"),

    status: t.varchar("status", { length: 20 }).default("pending").notNull(),

    requiresPurchase: t.boolean("requires_purchase").default(true).notNull(),
    minPurchaseAmount: t.integer("min_purchase_amount"),
    qualifyingOrderId: t.uuid("qualifying_order_id"),

    invitedAt: t
      .timestamp("invited_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    signedUpAt: t.timestamp("signed_up_at", { withTimezone: true }),
    completedAt: t.timestamp("completed_at", { withTimezone: true }),
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("coins_referrals_code_uq_idx").on(tbl.referralCode),

    t.index("coins_referrals_referrer_idx").on(tbl.referrerId, tbl.status),
    t
      .index("coins_referrals_referee_idx")
      .on(tbl.refereeId)
      .where(sql`referee_id IS NOT NULL`),
    t.index("coins_referrals_status_idx").on(tbl.status, tbl.shopId),
  ],
);

// =============================================================================
// PENDING MIGRATION NOTES
// =============================================================================
//
// 1. GENERATED tsvector full-text search on master_products:
//
//    ALTER TABLE master_products
//      ADD COLUMN search_vector_generated tsvector
//        GENERATED ALWAYS AS (
//          to_tsvector('english',
//            coalesce(name, '') || ' ' ||
//            coalesce(manufacturer, '') || ' ' ||
//            coalesce(short_description, '')
//          )
//        ) STORED;
//
//    CREATE INDEX idx_master_products_fts
//      ON master_products USING GIN(search_vector_generated);
//
// 2. One-primary-image constraint on master_product_images and shop_product_images:
//
//    ALTER TABLE master_product_images
//      ADD COLUMN is_primary_flag int
//        GENERATED ALWAYS AS (CASE WHEN is_primary THEN 1 END) STORED;
//    CREATE UNIQUE INDEX uniq_master_product_primary_image
//      ON master_product_images(master_product_id, is_primary_flag);
//
// 3. Partition product_views by view_date (high-volume table):
//
//    -- Convert to partitioned table BEFORE first data load
//    CREATE TABLE product_views_2026_03 PARTITION OF product_views
//      FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
//    -- Add a pg_cron job to CREATE future partitions automatically.
//
// 4. Enable pg_cron for scheduled jobs (expiring coins, auto-resolving
//    stock alerts, expiring recommendations, etc.):
//
//    CREATE EXTENSION IF NOT EXISTS pg_cron;
// =============================================================================
