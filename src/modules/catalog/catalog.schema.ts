/**
 * modules/catalog/catalog.schema.ts
 *
 * Zod schemas for the catalog module.
 * Used for validation (controller) and documentation (TypeBox conversion in routes).
 */

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import {
  brandTable,
  brandCategoriesTable,
  masterProductTable,
  masterProductVariantTable,
  masterProductImagesTable,
  shopProductTable,
  shopProductVariantTable,
  shopProductImagesTable,
  shopProductPriceTable,
  shopProductPricingTiersTable,
  shopCollectionsTable,
  shopCollectionProductsTable,
  productBundlesTable,
  bundleItemsTable,
  productLinksTable,
  dailyPicksTable,
  dailyPickProductsTable,
  shopAnnouncementsTable,
  productQuestionsTable,
  shopCouponsTable,
  savedForLaterTable,
} from "../../db/schema";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();
const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9-]+$/, "Slug must be kebab-case");

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

// ---------------------------------------------------------------------------
// 1. Brands
// ---------------------------------------------------------------------------

export const brandSelectSchema = createSelectSchema(brandTable);
export type BrandSelect = z.infer<typeof brandSelectSchema>;

export const createBrandRequestSchema = z.object({
  brandName: z.string().min(1).max(150),
  slug: slugSchema.optional(),
  description: z.string().max(2000).optional(),
  parentBrandId: uuidSchema.optional(),
  logoKey: z.string().max(500).optional(),
  logoThumbnailKey: z.string().max(500).optional(),
  coverImageKey: z.string().max(500).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(2000).optional(),
  isFeatured: z.boolean().optional(),
});
export type CreateBrandRequest = z.infer<typeof createBrandRequestSchema>;

export const updateBrandRequestSchema = createBrandRequestSchema.partial();
export type UpdateBrandRequest = z.infer<typeof updateBrandRequestSchema>;

export const addBrandCategoryRequestSchema = z.object({
  categoryId: uuidSchema,
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});
export type AddBrandCategoryRequest = z.infer<typeof addBrandCategoryRequestSchema>;

// ---------------------------------------------------------------------------
// 2. Master Products
// ---------------------------------------------------------------------------

export const masterProductSelectSchema = createSelectSchema(masterProductTable, {
  attributes: () => z.record(z.string(), z.unknown()).nullable(),
  specifications: () => z.record(z.string(), z.unknown()).nullable(),
  tags: () => z.array(z.string()).nullable(),
  keywords: () => z.array(z.string()).nullable(),
});
export type MasterProductSelect = z.infer<typeof masterProductSelectSchema>;

export const createMasterProductRequestSchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema.optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  leafCategoryId: uuidSchema,
  brandId: uuidSchema.optional(),
  globalSku: z.string().max(100).optional(),
  gtin: z.string().max(14).optional(),
  basePrice: z.number().int().min(0).optional(),
  msrp: z.number().int().min(0).optional(),
  productCondition: z.enum(["new", "refurbished", "used", "open_box"]).optional(),
  manufacturer: z.string().max(200).optional(),
  countryOfOrigin: z.string().max(100).optional(),
  weightGrams: z.string().optional(),
  lengthCm: z.string().optional(),
  widthCm: z.string().optional(),
  heightCm: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});
export type CreateMasterProductRequest = z.infer<typeof createMasterProductRequestSchema>;

export const updateMasterProductRequestSchema = createMasterProductRequestSchema.partial();
export type UpdateMasterProductRequest = z.infer<typeof updateMasterProductRequestSchema>;

export const createMasterVariantRequestSchema = z.object({
  variantName: z.string().min(1).max(150),
  variantSku: z.string().min(1).max(100),
  variantGtin: z.string().max(14).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  basePrice: z.number().int().min(0).optional(),
  msrp: z.number().int().min(0).optional(),
  weightGrams: z.string().optional(),
  lengthCm: z.string().optional(),
  widthCm: z.string().optional(),
  heightCm: z.string().optional(),
});
export type CreateMasterVariantRequest = z.infer<typeof createMasterVariantRequestSchema>;

export const addProductImageRequestSchema = z.object({
  imageUrl: z.string().min(1).max(500),
  thumbnailUrl: z.string().max(500).optional(),
  altText: z.string().max(255).optional(),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  widthPx: z.number().int().min(0).optional(),
  heightPx: z.number().int().min(0).optional(),
  fileSizeBytes: z.number().int().min(0).optional(),
  variantId: uuidSchema.optional(),
});
export type AddProductImageRequest = z.infer<typeof addProductImageRequestSchema>;

// ---------------------------------------------------------------------------
// 3. Shop Products
// ---------------------------------------------------------------------------

export const shopProductSelectSchema = createSelectSchema(shopProductTable);
export type ShopProductSelect = z.infer<typeof shopProductSelectSchema>;

export const createShopProductRequestSchema = z.object({
  productSource: z.enum(["master", "custom"]).default("master"),
  masterProductId: uuidSchema.optional(),
  name: z.string().min(1).max(250).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  slug: slugSchema.optional(),
  trackInventory: z.boolean().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  allowBackorder: z.boolean().optional(),
  taxable: z.boolean().optional(),
  requiresShipping: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  recommendationBadge: z.enum([
    "best_seller", "new_arrival", "staff_pick", "trending",
    "limited_edition", "value_pick", "eco_friendly",
  ]).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(2000).optional(),
});
export type CreateShopProductRequest = z.infer<typeof createShopProductRequestSchema>;

export const updateShopProductRequestSchema = createShopProductRequestSchema
  .omit({ productSource: true, masterProductId: true })
  .partial();
export type UpdateShopProductRequest = z.infer<typeof updateShopProductRequestSchema>;

export const updateStockRequestSchema = z.object({
  stockQuantity: z.number().int().min(0),
});
export type UpdateStockRequest = z.infer<typeof updateStockRequestSchema>;

export const createShopVariantRequestSchema = z.object({
  masterProductVariantId: uuidSchema.optional(),
  variantName: z.string().max(200).optional(),
  variantSku: z.string().max(100).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});
export type CreateShopVariantRequest = z.infer<typeof createShopVariantRequestSchema>;

// ---------------------------------------------------------------------------
// 4. Pricing
// ---------------------------------------------------------------------------

export const setShopProductPriceRequestSchema = z.object({
  shopProductVariantId: uuidSchema.optional(),
  currencyCode: z.string().length(3).default("INR"),
  mrp: z.number().int().positive(),
  sellingPrice: z.number().int().positive(),
  costPrice: z.number().int().min(0).optional(),
  hasDiscount: z.boolean().optional(),
  discountType: z.enum(["percentage", "fixed_amount"]).optional(),
  discountValue: z.number().int().min(0).optional(),
  discountStartDate: z.string().datetime().optional(),
  discountEndDate: z.string().datetime().optional(),
});
export type SetShopProductPriceRequest = z.infer<typeof setShopProductPriceRequestSchema>;

export const createPricingTierRequestSchema = z.object({
  shopProductVariantId: uuidSchema.optional(),
  tierName: z.string().max(100).optional(),
  minQuantity: z.number().int().positive(),
  maxQuantity: z.number().int().positive().optional(),
  tierType: z.enum(["price_per_unit", "total_price", "discount_percent", "discount_fixed"]),
  pricePerUnit: z.number().int().positive().optional(),
  totalPrice: z.number().int().positive().optional(),
  discountPercentage: z.number().int().min(1).max(100).optional(),
  discountAmount: z.number().int().positive().optional(),
  displayLabel: z.string().max(200).optional(),
  badgeText: z.string().max(50).optional(),
  badgeColor: z.string().max(20).optional(),
  priority: z.number().int().min(0).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});
export type CreatePricingTierRequest = z.infer<typeof createPricingTierRequestSchema>;

// ---------------------------------------------------------------------------
// 5. Collections
// ---------------------------------------------------------------------------

export const createCollectionRequestSchema = z.object({
  collectionName: z.string().min(1).max(255),
  slug: slugSchema.optional(),
  description: z.string().optional(),
  coverImageKey: z.string().max(500).optional(),
  thumbnailKey: z.string().max(500).optional(),
  collectionType: z.enum(["manual", "smart"]).default("manual"),
  autoRules: z.record(z.string(), z.unknown()).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(2000).optional(),
});
export type CreateCollectionRequest = z.infer<typeof createCollectionRequestSchema>;

export const updateCollectionRequestSchema = createCollectionRequestSchema.partial();
export type UpdateCollectionRequest = z.infer<typeof updateCollectionRequestSchema>;

export const addCollectionProductRequestSchema = z.object({
  shopProductId: uuidSchema,
  displayOrder: z.number().int().min(0).optional(),
});
export type AddCollectionProductRequest = z.infer<typeof addCollectionProductRequestSchema>;

// ---------------------------------------------------------------------------
// 6. Bundles
// ---------------------------------------------------------------------------

export const createBundleRequestSchema = z.object({
  bundleName: z.string().min(1).max(255),
  slug: slugSchema.optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  bundleType: z.enum(["fixed", "flexible"]).default("flexible"),
  minItemsRequired: z.number().int().positive().optional(),
  maxItemsAllowed: z.number().int().positive().optional(),
  pricingType: z.enum(["fixed_price", "percentage_off", "fixed_discount", "buy_x_get_y"]),
  fixedPrice: z.number().int().positive().optional(),
  discountPercentage: z.number().int().min(1).max(100).optional(),
  discountAmount: z.number().int().positive().optional(),
  buyQuantity: z.number().int().positive().optional(),
  getQuantity: z.number().int().positive().optional(),
  bundleImageKey: z.string().max(500).optional(),
  thumbnailKey: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(2000).optional(),
});
export type CreateBundleRequest = z.infer<typeof createBundleRequestSchema>;

export const updateBundleRequestSchema = createBundleRequestSchema
  .omit({ pricingType: true })
  .partial();
export type UpdateBundleRequest = z.infer<typeof updateBundleRequestSchema>;

export const addBundleItemRequestSchema = z.object({
  shopProductId: uuidSchema,
  shopProductVariantId: uuidSchema.optional(),
  quantity: z.number().int().positive().default(1),
  isOptional: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  individualPrice: z.number().int().min(0).optional(),
  displayOrder: z.number().int().min(0).optional(),
  displayLabel: z.string().max(200).optional(),
});
export type AddBundleItemRequest = z.infer<typeof addBundleItemRequestSchema>;

// ---------------------------------------------------------------------------
// 7. Announcements
// ---------------------------------------------------------------------------

export const createAnnouncementRequestSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  announcementType: z.enum([
    "general", "sale", "new_arrival", "restock",
    "holiday", "maintenance", "policy_change",
  ]).default("general"),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().max(500).optional(),
  imageKey: z.string().max(500).optional(),
  displayLocation: z.enum([
    "shop_header", "product_page", "checkout",
    "category_page", "home_feed",
  ]).default("shop_header"),
  priority: z.number().int().min(0).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isDismissible: z.boolean().optional(),
  showOncePerSession: z.boolean().optional(),
});
export type CreateAnnouncementRequest = z.infer<typeof createAnnouncementRequestSchema>;

export const updateAnnouncementRequestSchema = createAnnouncementRequestSchema.partial();
export type UpdateAnnouncementRequest = z.infer<typeof updateAnnouncementRequestSchema>;

// ---------------------------------------------------------------------------
// 8. Q&A
// ---------------------------------------------------------------------------

export const askQuestionRequestSchema = z.object({
  questionText: z.string().min(1).max(2000),
  questionType: z.enum(["general", "sizing", "compatibility", "availability", "shipping"]).default("general"),
  askedByName: z.string().max(100).optional(),
  askedByEmail: z.string().email().max(255).optional(),
});
export type AskQuestionRequest = z.infer<typeof askQuestionRequestSchema>;

export const answerQuestionRequestSchema = z.object({
  answerText: z.string().min(1).max(5000),
});
export type AnswerQuestionRequest = z.infer<typeof answerQuestionRequestSchema>;

export const voteQuestionRequestSchema = z.object({
  isHelpful: z.boolean(),
});
export type VoteQuestionRequest = z.infer<typeof voteQuestionRequestSchema>;

// ---------------------------------------------------------------------------
// 9. Saved Items
// ---------------------------------------------------------------------------

export const saveItemRequestSchema = z.object({
  shopId: uuidSchema,
  shopProductId: uuidSchema,
  shopProductVariantId: uuidSchema.optional(),
  source: z.enum(["direct", "cart", "comparison", "recommendation", "search"]).optional(),
  collectionName: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  notifyOnPriceDrop: z.boolean().optional(),
  notifyOnBackInStock: z.boolean().optional(),
  targetPrice: z.number().int().min(0).optional(),
  desiredQuantity: z.number().int().positive().optional(),
});
export type SaveItemRequest = z.infer<typeof saveItemRequestSchema>;

// ---------------------------------------------------------------------------
// 10. Product Links (Cross-sell / Upsell)
// ---------------------------------------------------------------------------

export const createProductLinkRequestSchema = z.object({
  sourceProductId: uuidSchema,
  linkedProductId: uuidSchema,
  linkType: z.enum([
    "frequently_bought_together", "customers_also_bought",
    "alternative", "accessory", "replacement", "upgrade",
    "related", "similar",
  ]).default("frequently_bought_together"),
  linkSource: z.enum(["manual", "auto_purchase", "auto_view", "auto_cart", "ai_suggested"]).default("manual"),
  displayOrder: z.number().int().min(0).optional(),
  customLabel: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
});
export type CreateProductLinkRequest = z.infer<typeof createProductLinkRequestSchema>;

export const updateProductLinkRequestSchema = createProductLinkRequestSchema
  .omit({ sourceProductId: true, linkedProductId: true, linkType: true })
  .partial();
export type UpdateProductLinkRequest = z.infer<typeof updateProductLinkRequestSchema>;

// ---------------------------------------------------------------------------
// 11. Daily Picks
// ---------------------------------------------------------------------------

export const createDailyPickRequestSchema = z.object({
  pickDate: z.string().date().optional(),
  title: z.string().max(200).optional(),
  description: z.string().optional(),
  dailyMessage: z.string().optional(),
  bannerImageKey: z.string().max(500).optional(),
  displayStyle: z.enum(["carousel", "grid", "list"]).default("carousel"),
  maxProducts: z.number().int().positive().max(50).default(10),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  scheduleStartTime: z.string().optional(),
  scheduleEndTime: z.string().optional(),
});
export type CreateDailyPickRequest = z.infer<typeof createDailyPickRequestSchema>;

export const updateDailyPickRequestSchema = createDailyPickRequestSchema.partial();
export type UpdateDailyPickRequest = z.infer<typeof updateDailyPickRequestSchema>;

export const addDailyPickProductRequestSchema = z.object({
  shopProductId: uuidSchema,
  displayOrder: z.number().int().min(0).optional(),
  customTitle: z.string().max(200).optional(),
  productNote: z.string().optional(),
  highlightText: z.string().max(100).optional(),
  specialPrice: z.number().int().positive().optional(),
  specialPriceLabel: z.string().max(100).optional(),
  badgeText: z.string().max(50).optional(),
  badgeColor: z.string().max(20).optional(),
  maxQuantityForPick: z.number().int().positive().optional(),
});
export type AddDailyPickProductRequest = z.infer<typeof addDailyPickProductRequestSchema>;

// ---------------------------------------------------------------------------
// 12. Coupons
// ---------------------------------------------------------------------------

export const createCouponRequestSchema = z.object({
  code: z.string().min(1).max(50),
  internalName: z.string().max(255).optional(),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed_amount", "free_shipping", "buy_x_get_y", "tiered"]),
  discountValue: z.number().int().positive(),
  maxDiscountAmount: z.number().int().positive().optional(),
  minPurchaseAmount: z.number().int().min(0).optional(),
  minQuantity: z.number().int().positive().optional(),
  target: z.enum([
    "all", "specific_products", "categories", "collections",
    "brands", "new_customers", "first_purchase", "abandoned_cart",
  ]).default("all"),
  scope: z.enum(["order_total", "shipping", "specific_items", "subscription"]).default("order_total"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().max(50).default("UTC"),
  usageRestriction: z.enum([
    "once_per_customer", "once_per_order", "unlimited",
    "limited_total", "limited_per_user",
  ]).default("unlimited"),
  totalUsageLimit: z.number().int().positive().optional(),
  perUserUsageLimit: z.number().int().positive().optional(),
  isStackable: z.boolean().optional(),
  stackableWith: z.array(z.string()).optional(),
  priority: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
  requiresAuthentication: z.boolean().optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  buyXGetYConfig: z.object({
    buyQuantity: z.number().int().positive(),
    getQuantity: z.number().int().positive(),
    applyTo: z.enum(["same_product", "any_product", "specific_products"]).optional(),
    specificProductIds: z.array(uuidSchema).optional(),
    maxApplications: z.number().int().positive().optional(),
  }).optional(),
  tieredConfig: z.object({
    tiers: z.array(z.object({
      minAmount: z.number().int().positive(),
      discountType: z.enum(["percentage", "fixed_amount"]),
      discountValue: z.number().int().positive(),
    })),
  }).optional(),
  campaignId: z.string().max(100).optional(),
});
export type CreateCouponRequest = z.infer<typeof createCouponRequestSchema>;

export const updateCouponRequestSchema = createCouponRequestSchema
  .omit({ code: true, discountType: true })
  .partial();
export type UpdateCouponRequest = z.infer<typeof updateCouponRequestSchema>;

export const validateCouponRequestSchema = z.object({
  code: z.string().min(1).max(50),
  shopId: uuidSchema,
  orderTotal: z.number().int().min(0).optional(),
  productIds: z.array(uuidSchema).optional(),
});
export type ValidateCouponRequest = z.infer<typeof validateCouponRequestSchema>;

export const addCouponProductRequestSchema = z.object({
  productId: uuidSchema,
  variantId: uuidSchema.optional(),
});
export type AddCouponProductRequest = z.infer<typeof addCouponProductRequestSchema>;

export const addCouponCollectionRequestSchema = z.object({
  collectionId: uuidSchema,
});
export type AddCouponCollectionRequest = z.infer<typeof addCouponCollectionRequestSchema>;

export const addCouponCategoryRequestSchema = z.object({
  categoryId: uuidSchema,
});
export type AddCouponCategoryRequest = z.infer<typeof addCouponCategoryRequestSchema>;
