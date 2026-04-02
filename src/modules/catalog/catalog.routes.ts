/**
 * modules/catalog/catalog.routes.ts
 *
 * Elysia routes for the catalog module.
 * Follows shop.routes.ts conventions: TypeBox bodies, public/protected/admin split.
 */

import { Elysia, t } from "elysia";
import { jwtAuthPlugin } from "../../middleware/auth.middleware";
import type { AuthUser } from "../../middleware/auth.middleware";
import { AuthErrors } from "../auth/auth.errors";

import {
  BrandController,
  MasterProductController,
  ShopProductController,
  PriceController,
  CollectionController,
  BundleController,
  AnnouncementController,
  QAController,
  SavedItemController,
  ProductLinkController,
  DailyPickController,
  CouponController,
} from "./catalog.controller";

// ── Shared TypeBox primitives ─────────────────────────────────────────────────

const UUIDParam = t.Object({ id: t.String({ format: "uuid" }) });
// Standardized shop ID param (renamed shopId -> id for route consistency)
const ShopIdParam = t.Object({ id: t.String({ format: "uuid" }) });

// Specific combined params to avoid :id collisions
const ShopIdAndProductIdParam = t.Object({
  id: t.String({ format: "uuid" }), // shopId
  productId: t.String({ format: "uuid" }),
});
const ShopIdAndCollectionIdParam = t.Object({
  id: t.String({ format: "uuid" }), // shopId
  collectionId: t.String({ format: "uuid" }),
});
const ShopIdAndBundleIdParam = t.Object({
  id: t.String({ format: "uuid" }), // shopId
  bundleId: t.String({ format: "uuid" }),
});
const ShopIdAndPickIdParam = t.Object({
  id: t.String({ format: "uuid" }), // shopId
  pickId: t.String({ format: "uuid" }),
});
const ShopIdAndAnnouncementIdParam = t.Object({
  id: t.String({ format: "uuid" }), // shopId
  announcementId: t.String({ format: "uuid" }),
});

const PaginationQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// ── Request context ───────────────────────────────────────────────────────────

function resolveRequestContext({
  request,
  server,
}: {
  request: Request;
  server: { requestIP(req: Request): { address: string } | null } | null;
}) {
  const ip = server?.requestIP(request)?.address ?? "unknown";
  return { ip };
}

function authenticate(ctx: { user?: AuthUser; [key: string]: unknown }) {
  if (!ctx.user) throw AuthErrors.Common.unauthorized();
  return { actor: ctx.user };
}

// ── TypeBox Bodies ────────────────────────────────────────────────────────────

// Brand
const CreateBrandBody = t.Object({
  brandName: t.String({ minLength: 1, maxLength: 150 }),
  slug: t.Optional(t.String({ maxLength: 200 })),
  description: t.Optional(t.String({ maxLength: 2000 })),
  parentBrandId: t.Optional(t.String({ format: "uuid" })),
  logoKey: t.Optional(t.String({ maxLength: 500 })),
  metaTitle: t.Optional(t.String({ maxLength: 255 })),
  metaDescription: t.Optional(t.String({ maxLength: 2000 })),
  isFeatured: t.Optional(t.Boolean()),
});
const UpdateBrandBody = t.Partial(CreateBrandBody);
const AddBrandCategoryBody = t.Object({
  categoryId: t.String({ format: "uuid" }),
  isPrimary: t.Optional(t.Boolean()),
  displayOrder: t.Optional(t.Integer({ minimum: 0 })),
});

// Master Product
const CreateMasterProductBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  slug: t.Optional(t.String({ maxLength: 200 })),
  description: t.Optional(t.String()),
  shortDescription: t.Optional(t.String({ maxLength: 500 })),
  leafCategoryId: t.String({ format: "uuid" }),
  brandId: t.Optional(t.String({ format: "uuid" })),
  globalSku: t.Optional(t.String({ maxLength: 100 })),
  gtin: t.Optional(t.String({ maxLength: 14 })),
  basePrice: t.Optional(t.Integer({ minimum: 0 })),
  msrp: t.Optional(t.Integer({ minimum: 0 })),
  productCondition: t.Optional(t.Union([
    t.Literal("new"), t.Literal("refurbished"), 
    t.Literal("used"), t.Literal("open_box"),
  ])),
  manufacturer: t.Optional(t.String({ maxLength: 200 })),
  countryOfOrigin: t.Optional(t.String({ maxLength: 100 })),
});
const UpdateMasterProductBody = t.Partial(CreateMasterProductBody);
const CreateMasterVariantBody = t.Object({
  variantName: t.String({ minLength: 1, maxLength: 150 }),
  variantSku: t.String({ minLength: 1, maxLength: 100 }),
  variantGtin: t.Optional(t.String({ maxLength: 14 })),
  attributes: t.Optional(t.Record(t.String(), t.Unknown())),
  basePrice: t.Optional(t.Integer({ minimum: 0 })),
  msrp: t.Optional(t.Integer({ minimum: 0 })),
});
const AddProductImageBody = t.Object({
  imageUrl: t.String({ minLength: 1, maxLength: 500 }),
  thumbnailUrl: t.Optional(t.String({ maxLength: 500 })),
  altText: t.Optional(t.String({ maxLength: 255 })),
  isPrimary: t.Optional(t.Boolean()),
  displayOrder: t.Optional(t.Integer({ minimum: 0 })),
  widthPx: t.Optional(t.Integer({ minimum: 0 })),
  heightPx: t.Optional(t.Integer({ minimum: 0 })),
  fileSizeBytes: t.Optional(t.Integer({ minimum: 0 })),
  variantId: t.Optional(t.String({ format: "uuid" })),
});
const StatusBody = t.Object({
  status: t.String(),
});

// Shop Product
const CreateShopProductBody = t.Object({
  productSource: t.Optional(t.Union([t.Literal("master"), t.Literal("custom")])),
  masterProductId: t.Optional(t.String({ format: "uuid" })),
  name: t.Optional(t.String({ minLength: 1, maxLength: 250 })),
  description: t.Optional(t.String()),
  shortDescription: t.Optional(t.String({ maxLength: 500 })),
  slug: t.Optional(t.String({ maxLength: 200 })),
  trackInventory: t.Optional(t.Boolean()),
  stockQuantity: t.Optional(t.Integer({ minimum: 0 })),
  lowStockThreshold: t.Optional(t.Integer({ minimum: 0 })),
  allowBackorder: t.Optional(t.Boolean()),
  taxable: t.Optional(t.Boolean()),
  requiresShipping: t.Optional(t.Boolean()),
  displayOrder: t.Optional(t.Integer({ minimum: 0 })),
  isFeatured: t.Optional(t.Boolean()),
  metaTitle: t.Optional(t.String({ maxLength: 255 })),
  metaDescription: t.Optional(t.String({ maxLength: 2000 })),
});
const UpdateShopProductBody = t.Partial(
  t.Omit(CreateShopProductBody, ["productSource", "masterProductId"]),
);
const UpdateStockBody = t.Object({
  stockQuantity: t.Integer({ minimum: 0 }),
});
const CreateShopVariantBody = t.Object({
  masterProductVariantId: t.Optional(t.String({ format: "uuid" })),
  variantName: t.Optional(t.String({ maxLength: 200 })),
  variantSku: t.Optional(t.String({ maxLength: 100 })),
  attributes: t.Optional(t.Record(t.String(), t.Unknown())),
  stockQuantity: t.Optional(t.Integer({ minimum: 0 })),
  lowStockThreshold: t.Optional(t.Integer({ minimum: 0 })),
});

// Pricing
const SetPriceBody = t.Object({
  shopProductVariantId: t.Optional(t.String({ format: "uuid" })),
  currencyCode: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
  mrp: t.Integer({ minimum: 1 }),
  sellingPrice: t.Integer({ minimum: 1 }),
  costPrice: t.Optional(t.Integer({ minimum: 0 })),
  hasDiscount: t.Optional(t.Boolean()),
  discountType: t.Optional(t.Union([t.Literal("percentage"), t.Literal("fixed_amount")])),
  discountValue: t.Optional(t.Integer({ minimum: 0 })),
  discountStartDate: t.Optional(t.String({ format: "date-time" })),
  discountEndDate: t.Optional(t.String({ format: "date-time" })),
});
const CreatePricingTierBody = t.Object({
  shopProductVariantId: t.Optional(t.String({ format: "uuid" })),
  tierName: t.Optional(t.String({ maxLength: 100 })),
  minQuantity: t.Integer({ minimum: 1 }),
  maxQuantity: t.Optional(t.Integer({ minimum: 1 })),
  tierType: t.Union([
    t.Literal("price_per_unit"), t.Literal("total_price"),
    t.Literal("discount_percent"), t.Literal("discount_fixed"),
  ]),
  pricePerUnit: t.Optional(t.Integer({ minimum: 1 })),
  totalPrice: t.Optional(t.Integer({ minimum: 1 })),
  discountPercentage: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
  discountAmount: t.Optional(t.Integer({ minimum: 1 })),
  displayLabel: t.Optional(t.String({ maxLength: 200 })),
  priority: t.Optional(t.Integer({ minimum: 0 })),
});

// Collection
const CreateCollectionBody = t.Object({
  collectionName: t.String({ minLength: 1, maxLength: 255 }),
  slug: t.Optional(t.String({ maxLength: 200 })),
  description: t.Optional(t.String()),
  coverImageKey: t.Optional(t.String({ maxLength: 500 })),
  collectionType: t.Optional(t.Union([t.Literal("manual"), t.Literal("smart")])),
  displayOrder: t.Optional(t.Integer({ minimum: 0 })),
  isFeatured: t.Optional(t.Boolean()),
  metaTitle: t.Optional(t.String({ maxLength: 255 })),
  metaDescription: t.Optional(t.String({ maxLength: 2000 })),
});
const UpdateCollectionBody = t.Partial(CreateCollectionBody);
const AddCollectionProductBody = t.Object({
  shopProductId: t.String({ format: "uuid" }),
  displayOrder: t.Optional(t.Integer({ minimum: 0 })),
});

// Bundle
const CreateBundleBody = t.Object({
  bundleName: t.String({ minLength: 1, maxLength: 255 }),
  slug: t.Optional(t.String({ maxLength: 200 })),
  description: t.Optional(t.String()),
  bundleType: t.Optional(t.Union([t.Literal("fixed"), t.Literal("flexible")])),
  pricingType: t.Union([
    t.Literal("fixed_price"), t.Literal("percentage_off"),
    t.Literal("fixed_discount"), t.Literal("buy_x_get_y"),
  ]),
  fixedPrice: t.Optional(t.Integer({ minimum: 1 })),
  discountPercentage: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
  discountAmount: t.Optional(t.Integer({ minimum: 1 })),
  displayOrder: t.Optional(t.Integer({ minimum: 0 })),
  isFeatured: t.Optional(t.Boolean()),
});
const UpdateBundleBody = t.Partial(t.Omit(CreateBundleBody, ["pricingType"]));
const AddBundleItemBody = t.Object({
  shopProductId: t.String({ format: "uuid" }),
  shopProductVariantId: t.Optional(t.String({ format: "uuid" })),
  quantity: t.Optional(t.Integer({ minimum: 1 })),
  isOptional: t.Optional(t.Boolean()),
  isDefault: t.Optional(t.Boolean()),
  individualPrice: t.Optional(t.Integer({ minimum: 0 })),
  displayOrder: t.Optional(t.Integer({ minimum: 0 })),
});

// Announcement
const CreateAnnouncementBody = t.Object({
  title: t.String({ minLength: 1, maxLength: 255 }),
  message: t.String({ minLength: 1 }),
  announcementType: t.Optional(t.String()),
  ctaText: t.Optional(t.String({ maxLength: 100 })),
  ctaUrl: t.Optional(t.String({ maxLength: 500 })),
  imageKey: t.Optional(t.String({ maxLength: 500 })),
  displayLocation: t.Optional(t.String()),
  priority: t.Optional(t.Integer({ minimum: 0 })),
  startDate: t.String({ format: "date-time" }),
  endDate: t.Optional(t.String({ format: "date-time" })),
  isDismissible: t.Optional(t.Boolean()),
  showOncePerSession: t.Optional(t.Boolean()),
});
const UpdateAnnouncementBody = t.Partial(CreateAnnouncementBody);

// Q&A
const AskQuestionBody = t.Object({
  questionText: t.String({ minLength: 1, maxLength: 2000 }),
  questionType: t.Optional(t.String()),
  askedByName: t.Optional(t.String({ maxLength: 100 })),
  askedByEmail: t.Optional(t.String({ format: "email" })),
});
const AnswerQuestionBody = t.Object({
  answerText: t.String({ minLength: 1, maxLength: 5000 }),
});
const VoteQuestionBody = t.Object({
  isHelpful: t.Boolean(),
});

// Saved Items
const SaveItemBody = t.Object({
  shopId: t.String({ format: "uuid" }),
  shopProductId: t.String({ format: "uuid" }),
  shopProductVariantId: t.Optional(t.String({ format: "uuid" })),
  source: t.Optional(t.String()),
  collectionName: t.Optional(t.String({ maxLength: 100 })),
  notes: t.Optional(t.String({ maxLength: 500 })),
  notifyOnPriceDrop: t.Optional(t.Boolean()),
  notifyOnBackInStock: t.Optional(t.Boolean()),
  targetPrice: t.Optional(t.Integer({ minimum: 0 })),
  desiredQuantity: t.Optional(t.Integer({ minimum: 1 })),
});

// Product Links
const CreateProductLinkBody = t.Object({
  sourceProductId: t.String({ format: "uuid" }),
  linkedProductId: t.String({ format: "uuid" }),
  linkType: t.Optional(t.Union([
    t.Literal("frequently_bought_together"), t.Literal("customers_also_bought"),
    t.Literal("alternative"), t.Literal("accessory"),
    t.Literal("replacement"), t.Literal("upgrade"),
    t.Literal("related"), t.Literal("similar"),
  ])),
  linkSource: t.Optional(t.Union([
    t.Literal("manual"), t.Literal("auto_purchase"),
    t.Literal("auto_view"), t.Literal("auto_cart"),
    t.Literal("ai_suggested"),
  ])),
  displayOrder: t.Optional(t.Integer({ minimum: 0 })),
  customLabel: t.Optional(t.String({ maxLength: 200 })),
  isActive: t.Optional(t.Boolean()),
});
const UpdateProductLinkBody = t.Partial(
  t.Omit(CreateProductLinkBody, ["sourceProductId", "linkedProductId"]),
);

// Daily Picks
const CreateDailyPickBody = t.Object({
  pickDate: t.Optional(t.String()),
  title: t.Optional(t.String({ maxLength: 200 })),
  description: t.Optional(t.String()),
  dailyMessage: t.Optional(t.String()),
  bannerImageKey: t.Optional(t.String({ maxLength: 500 })),
  displayStyle: t.Optional(t.Union([
    t.Literal("carousel"), t.Literal("grid"), t.Literal("list"),
  ])),
  maxProducts: t.Optional(t.Integer({ minimum: 1, maximum: 50 })),
  isActive: t.Optional(t.Boolean()),
  isPublished: t.Optional(t.Boolean()),
  scheduleStartTime: t.Optional(t.String()),
  scheduleEndTime: t.Optional(t.String()),
});
const UpdateDailyPickBody = t.Partial(CreateDailyPickBody);
const AddDailyPickProductBody = t.Object({
  shopProductId: t.String({ format: "uuid" }),
  displayOrder: t.Optional(t.Integer({ minimum: 0 })),
  customTitle: t.Optional(t.String({ maxLength: 200 })),
  productNote: t.Optional(t.String()),
  highlightText: t.Optional(t.String({ maxLength: 100 })),
  specialPrice: t.Optional(t.Integer({ minimum: 1 })),
  specialPriceLabel: t.Optional(t.String({ maxLength: 100 })),
  badgeText: t.Optional(t.String({ maxLength: 50 })),
  badgeColor: t.Optional(t.String({ maxLength: 20 })),
  maxQuantityForPick: t.Optional(t.Integer({ minimum: 1 })),
});

// Coupons
const CreateCouponBody = t.Object({
  code: t.String({ minLength: 1, maxLength: 50 }),
  internalName: t.Optional(t.String({ maxLength: 255 })),
  description: t.Optional(t.String()),
  discountType: t.Union([
    t.Literal("percentage"), t.Literal("fixed_amount"),
    t.Literal("free_shipping"), t.Literal("buy_x_get_y"),
    t.Literal("tiered"),
  ]),
  discountValue: t.Integer({ minimum: 1 }),
  maxDiscountAmount: t.Optional(t.Integer({ minimum: 1 })),
  minPurchaseAmount: t.Optional(t.Integer({ minimum: 0 })),
  minQuantity: t.Optional(t.Integer({ minimum: 1 })),
  target: t.Optional(t.Union([
    t.Literal("all"), t.Literal("specific_products"),
    t.Literal("categories"), t.Literal("collections"),
    t.Literal("brands"), t.Literal("new_customers"),
    t.Literal("first_purchase"), t.Literal("abandoned_cart"),
  ])),
  scope: t.Optional(t.Union([
    t.Literal("order_total"), t.Literal("shipping"),
    t.Literal("specific_items"), t.Literal("subscription"),
  ])),
  startDate: t.String({ format: "date-time" }),
  endDate: t.Optional(t.String({ format: "date-time" })),
  timezone: t.Optional(t.String({ maxLength: 50 })),
  usageRestriction: t.Optional(t.Union([
    t.Literal("once_per_customer"), t.Literal("once_per_order"),
    t.Literal("unlimited"), t.Literal("limited_total"),
    t.Literal("limited_per_user"),
  ])),
  totalUsageLimit: t.Optional(t.Integer({ minimum: 1 })),
  perUserUsageLimit: t.Optional(t.Integer({ minimum: 1 })),
  isStackable: t.Optional(t.Boolean()),
  priority: t.Optional(t.Integer({ minimum: 0 })),
  isPublic: t.Optional(t.Boolean()),
  requiresAuthentication: t.Optional(t.Boolean()),
  conditions: t.Optional(t.Record(t.String(), t.Unknown())),
  campaignId: t.Optional(t.String({ maxLength: 100 })),
});
const UpdateCouponBody = t.Partial(t.Omit(CreateCouponBody, ["code", "discountType"]));
const ValidateCouponBody = t.Object({
  code: t.String({ minLength: 1, maxLength: 50 }),
  shopId: t.String({ format: "uuid" }),
  orderTotal: t.Optional(t.Integer({ minimum: 0 })),
  productIds: t.Optional(t.Array(t.String({ format: "uuid" }))),
});
const AddCouponProductBody = t.Object({
  productId: t.String({ format: "uuid" }),
  variantId: t.Optional(t.String({ format: "uuid" })),
});
const AddCouponCollectionBody = t.Object({
  collectionId: t.String({ format: "uuid" }),
});
const AddCouponCategoryBody = t.Object({
  categoryId: t.String({ format: "uuid" }),
});

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

export const publicCatalogRoutes = new Elysia({ tags: ["Brands"] })
  // ── Brands ──
  .get("/brands", ({ query }) =>
    BrandController.list(
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
      { isFeatured: query.isFeatured === "true" ? true : undefined },
    ), {
    query: t.Object({
      ...PaginationQuery.properties,
      isFeatured: t.Optional(t.String()),
    }),
    detail: { summary: "List brands (public)", tags: ["Brands"] },
  })

  .get("/brands/:id", ({ params }) =>
    BrandController.getById(params.id), {
    params: UUIDParam,
    detail: { summary: "Get brand by ID", tags: ["Brands"] },
  })

  .get("/brands/s/:slug", ({ params }) =>
    BrandController.getBySlug(params.slug), {
    detail: { summary: "Get brand by slug", tags: ["Brands"] },
  })

  // ── Master Products ──
  .get("/master-products", ({ query }) =>
    MasterProductController.list(
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
      {
        categoryId: query.categoryId,
        brandId: query.brandId,
        status: query.status,
      },
    ), {
    query: t.Object({
      ...PaginationQuery.properties,
      categoryId: t.Optional(t.String({ format: "uuid" })),
      brandId: t.Optional(t.String({ format: "uuid" })),
      status: t.Optional(t.String()),
    }),
    detail: { summary: "List master products (public)", tags: ["Master Products"] },
  })

  .get("/master-products/:id", ({ params }) =>
    MasterProductController.getById(params.id), {
    params: UUIDParam,
    detail: { summary: "Get master product by ID", tags: ["Master Products"] },
  })

  .get("/master-products/s/:slug", ({ params }) =>
    MasterProductController.getBySlug(params.slug), {
    detail: { summary: "Get master product by slug", tags: ["Master Products"] },
  })

  // ── Shop Products (public browsing) ──
  .get("/shops/:id/products", ({ params, query }) =>
    ShopProductController.listByShop(
      params.id,
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
      { status: query.status, isFeatured: query.isFeatured === "true" ? true : undefined },
    ), {
    params: ShopIdParam,
    query: t.Object({
      ...PaginationQuery.properties,
      status: t.Optional(t.String()),
      isFeatured: t.Optional(t.String()),
    }),
    detail: { summary: "List shop products (public)", tags: ["Shop Products"] },
  })

  .get("/shops/:id/products/:productId", ({ params }) =>
    ShopProductController.getById(params.productId), {
    params: ShopIdAndProductIdParam,
    detail: { summary: "Get shop product by ID", tags: ["Shop Products"] },
  })

  .get("/shops/:id/products/s/:slug", ({ params }) =>
    ShopProductController.getBySlug(params.id, params.slug), {
    params: t.Object({ id: t.String({ format: "uuid" }), slug: t.String() }),
    detail: { summary: "Get shop product by slug", tags: ["Shop Products"] },
  })

  // ── Collections (public) ──
  .get("/shops/:id/collections", ({ params, query }) =>
    CollectionController.listByShop(
      params.id,
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
    ), {
    params: ShopIdParam,
    query: PaginationQuery,
    detail: { summary: "List shop collections (public)", tags: ["Collections"] },
  })

  .get("/shops/:id/collections/:collectionId", ({ params }) =>
    CollectionController.getById(params.collectionId), {
    params: ShopIdAndCollectionIdParam,
    detail: { summary: "Get collection details", tags: ["Collections"] },
  })

  // ── Bundles (public) ──
  .get("/shops/:id/bundles", ({ params, query }) =>
    BundleController.listByShop(
      params.id,
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
    ), {
    params: ShopIdParam,
    query: PaginationQuery,
    detail: { summary: "List shop bundles (public)", tags: ["Bundles"] },
  })

  .get("/shops/:id/bundles/:bundleId", ({ params }) =>
    BundleController.getById(params.bundleId), {
    params: ShopIdAndBundleIdParam,
    detail: { summary: "Get bundle details", tags: ["Bundles"] },
  })

  // ── Announcements (public) ──
  .get("/shops/:id/announcements", ({ params }) =>
    AnnouncementController.listActive(params.id), {
    params: ShopIdParam,
    detail: { summary: "List active announcements", tags: ["Announcements"] },
  })

  // ── Q&A (public) ──
  .get("/shops/:id/products/:productId/questions", ({ params, query }) =>
    QAController.listByProduct(
      params.productId,
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
    ), {
    params: ShopIdAndProductIdParam,
    query: PaginationQuery,
    detail: { summary: "List product questions (public)", tags: ["Product Q&A"] },
  })

  // ── Pricing (public) ──
  .get("/shops/:id/products/:productId/price", ({ params, query }) =>
    PriceController.getActivePrice(params.productId, {
      variantId: query.variantId,
      currency: query.currency,
    }), {
    params: ShopIdAndProductIdParam,
    query: t.Object({
      variantId: t.Optional(t.String({ format: "uuid" })),
      currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
    }),
    detail: { summary: "Get active price for a product (public)", tags: ["Product Pricing"] },
  })

  // ── Product Links (public) ──
  .get("/shops/:id/products/:productId/links", ({ params, query }) =>
    ProductLinkController.listByProduct(params.productId, { linkType: query.linkType }), {
    params: ShopIdAndProductIdParam,
    query: t.Object({ linkType: t.Optional(t.String()) }),
    detail: { summary: "List product links (public)", tags: ["Product Links"] },
  })

  // ── Daily Picks (public) ──
  .get("/shops/:id/daily-picks/today", ({ params }) =>
    DailyPickController.getToday(params.id), {
    params: ShopIdParam,
    detail: { summary: "Get today's daily pick", tags: ["Daily Picks"] },
  })

  .get("/shops/:id/daily-picks/:pickId", ({ params }) =>
    DailyPickController.getById(params.pickId), {
    params: ShopIdAndPickIdParam,
    detail: { summary: "Get daily pick by ID", tags: ["Daily Picks"] },
  })

  .get("/shops/:id/daily-picks/:pickId/products", ({ params }) =>
    DailyPickController.listProducts(params.pickId), {
    params: ShopIdAndPickIdParam,
    detail: { summary: "List daily pick products", tags: ["Daily Picks"] },
  })

  .get("/shops/:id/daily-picks", ({ params, query }) =>
    DailyPickController.listByShop(
      params.id,
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
    ), {
    params: ShopIdParam,
    query: PaginationQuery,
    detail: { summary: "List daily picks (public)", tags: ["Daily Picks"] },
  })

  // ── Coupons (public, limited) ──
  .get("/shops/:id/coupons", ({ params, query }) =>
    CouponController.listByShop(
      params.id,
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
      { status: "active" },
    ), {
    params: ShopIdParam,
    query: PaginationQuery,
    detail: { summary: "List active coupons (public)", tags: ["Coupons"] },
  });

// =============================================================================
// PROTECTED ROUTES (shop owners + authenticated users)
// =============================================================================

export const protectedCatalogRoutes = new Elysia()
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  // ── Shop Products CRUD ──
  .post("/shops/:id/products", ({ params, body, actor, ip }) =>
    ShopProductController.create(params.id, body as any, { user: actor, ip }), {
    params: ShopIdParam,
    body: CreateShopProductBody,
    detail: { summary: "Add product to shop", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  .patch("/shops/:id/products/:productId", ({ params, body, actor, ip }) =>
    ShopProductController.update(params.productId, body as any, { user: actor, ip }), {
    params: ShopIdAndProductIdParam,
    body: UpdateShopProductBody,
    detail: { summary: "Update shop product", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  .delete("/shops/:id/products/:productId", ({ params, actor, ip }) =>
    ShopProductController.softDelete(params.productId, { user: actor, ip }), {
    params: ShopIdAndProductIdParam,
    detail: { summary: "Delete shop product", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  .patch("/shops/:id/products/:productId/stock", ({ params, body, actor, ip }) =>
    ShopProductController.updateStock(params.productId, body as any, { user: actor, ip }), {
    params: ShopIdAndProductIdParam,
    body: UpdateStockBody,
    detail: { summary: "Update stock quantity", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  .patch("/shops/:id/products/:productId/status", ({ params, body, actor, ip }) =>
    ShopProductController.updateStatus(params.productId, body.status, { user: actor, ip }), {
    params: ShopIdAndProductIdParam,
    body: StatusBody,
    detail: { summary: "Update product status", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  // ── Variants ──
  .post("/shops/:id/products/:productId/variants", ({ params, body, actor, ip }) =>
    ShopProductController.addVariant(params.productId, body as any, { user: actor, ip }), {
    params: ShopIdAndProductIdParam,
    body: CreateShopVariantBody,
    detail: { summary: "Add variant", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  .patch("/product-variants/:id", ({ params, body, actor, ip }) =>
    ShopProductController.updateVariant(params.id, body as any, { user: actor, ip }), {
    params: UUIDParam,
    body: t.Partial(CreateShopVariantBody),
    detail: { summary: "Update variant", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  .delete("/product-variants/:id", ({ params, actor, ip }) =>
    ShopProductController.removeVariant(params.id, { user: actor, ip }), {
    params: UUIDParam,
    detail: { summary: "Remove variant", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  // ── Images ──
  .post("/shops/:id/products/:productId/images", ({ params, body, actor, ip }) =>
    ShopProductController.addImage(params.productId, body as any, { user: actor, ip }), {
    params: ShopIdAndProductIdParam,
    body: AddProductImageBody,
    detail: { summary: "Add product image", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  .delete("/product-images/:id", ({ params, actor, ip }) =>
    ShopProductController.removeImage(params.id, { user: actor, ip }), {
    params: UUIDParam,
    detail: { summary: "Remove product image", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  .patch("/product-images/:id/primary", ({ params, body, actor, ip }) =>
    ShopProductController.setPrimaryImage(params.id, body.shopProductId, { user: actor, ip }), {
    params: UUIDParam,
    body: t.Object({ shopProductId: t.String({ format: "uuid" }) }),
    detail: { summary: "Set primary image", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  })

  // ── Pricing ──
  .post("/shops/:id/products/:productId/price", ({ params, body, actor, ip }) =>
    PriceController.setPrice(params.productId, body as any, { user: actor, ip }), {
    params: ShopIdAndProductIdParam,
    body: SetPriceBody,
    detail: { summary: "Set/update product price", tags: ["Product Pricing"], security: [{ bearerAuth: [] }] },
  })

  .get("/shops/:id/products/:productId/price-history", ({ params, query }) =>
    PriceController.listHistory(
      params.productId,
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
    ), {
    params: ShopIdAndProductIdParam,
    query: PaginationQuery,
    detail: { summary: "List price history", tags: ["Product Pricing"], security: [{ bearerAuth: [] }] },
  })

  .post("/shops/:id/products/:productId/pricing-tiers", ({ params, body, actor, ip }) =>
    PriceController.addTier(params.productId, body as any, { user: actor, ip }), {
    params: ShopIdAndProductIdParam,
    body: CreatePricingTierBody,
    detail: { summary: "Add bulk pricing tier", tags: ["Product Pricing"], security: [{ bearerAuth: [] }] },
  })

  .delete("/pricing-tiers/:id", ({ params, actor, ip }) =>
    PriceController.removeTier(params.id, { user: actor, ip }), {
    params: UUIDParam,
    detail: { summary: "Remove pricing tier", tags: ["Product Pricing"], security: [{ bearerAuth: [] }] },
  })

  // ── Collections ──
  .post("/shops/:id/collections", ({ params, body, actor, ip }) =>
    CollectionController.create(params.id, body as any, { user: actor, ip }), {
    params: ShopIdParam,
    body: CreateCollectionBody,
    detail: { summary: "Create collection", tags: ["Collections"], security: [{ bearerAuth: [] }] },
  })

  .patch("/shops/:id/collections/:collectionId", ({ params, body, actor, ip }) =>
    CollectionController.update(params.collectionId, body as any, { user: actor, ip }), {
    params: ShopIdAndCollectionIdParam,
    body: UpdateCollectionBody,
    detail: { summary: "Update collection", tags: ["Collections"], security: [{ bearerAuth: [] }] },
  })

  .delete("/shops/:id/collections/:collectionId", ({ params, actor, ip }) =>
    CollectionController.delete(params.collectionId, { user: actor, ip }), {
    params: ShopIdAndCollectionIdParam,
    detail: { summary: "Delete collection", tags: ["Collections"], security: [{ bearerAuth: [] }] },
  })

  .post("/shops/:id/collections/:collectionId/products", ({ params, body, actor, ip }) =>
    CollectionController.addProduct(params.collectionId, body as any, { user: actor, ip }), {
    params: ShopIdAndCollectionIdParam,
    body: AddCollectionProductBody,
    detail: { summary: "Add product to collection", tags: ["Collections"], security: [{ bearerAuth: [] }] },
  })

  .delete("/shops/:id/collections/:collectionId/products/:pid", ({ params, actor, ip }) =>
    CollectionController.removeProduct(params.collectionId, params.pid, { user: actor, ip }), {
    params: t.Object({
      id: t.String({ format: "uuid" }),
      collectionId: t.String({ format: "uuid" }),
      pid: t.String({ format: "uuid" }),
    }),
    detail: { summary: "Remove product from collection", tags: ["Collections"], security: [{ bearerAuth: [] }] },
  })

  // ── Bundles ──
  .post("/shops/:id/bundles", ({ params, body, actor, ip }) =>
    BundleController.create(params.id, body as any, { user: actor, ip }), {
    params: ShopIdParam,
    body: CreateBundleBody,
    detail: { summary: "Create bundle", tags: ["Bundles"], security: [{ bearerAuth: [] }] },
  })

  .patch("/shops/:id/bundles/:bundleId", ({ params, body, actor, ip }) =>
    BundleController.update(params.bundleId, body as any, { user: actor, ip }), {
    params: ShopIdAndBundleIdParam,
    body: UpdateBundleBody,
    detail: { summary: "Update bundle", tags: ["Bundles"], security: [{ bearerAuth: [] }] },
  })

  .delete("/shops/:id/bundles/:bundleId", ({ params, actor, ip }) =>
    BundleController.delete(params.bundleId, { user: actor, ip }), {
    params: ShopIdAndBundleIdParam,
    detail: { summary: "Delete bundle", tags: ["Bundles"], security: [{ bearerAuth: [] }] },
  })

  .post("/shops/:id/bundles/:bundleId/items", ({ params, body, actor, ip }) =>
    BundleController.addItem(params.bundleId, body as any, { user: actor, ip }), {
    params: ShopIdAndBundleIdParam,
    body: AddBundleItemBody,
    detail: { summary: "Add item to bundle", tags: ["Bundles"], security: [{ bearerAuth: [] }] },
  })

  .delete("/bundle-items/:id", ({ params, actor, ip }) =>
    BundleController.removeItem(params.id, { user: actor, ip }), {
    params: UUIDParam,
    detail: { summary: "Remove bundle item", tags: ["Bundles"], security: [{ bearerAuth: [] }] },
  })

  // ── Announcements ──
  .post("/shops/:id/announcements", ({ params, body, actor, ip }) =>
    AnnouncementController.create(params.id, body as any, { user: actor, ip }), {
    params: ShopIdParam,
    body: CreateAnnouncementBody,
    detail: { summary: "Create announcement", tags: ["Announcements"], security: [{ bearerAuth: [] }] },
  })

  .patch("/shops/:id/announcements/:announcementId", ({ params, body, actor, ip }) =>
    AnnouncementController.update(params.announcementId, body as any, { user: actor, ip }), {
    params: ShopIdAndAnnouncementIdParam,
    body: UpdateAnnouncementBody,
    detail: { summary: "Update announcement", tags: ["Announcements"], security: [{ bearerAuth: [] }] },
  })

  .delete("/shops/:id/announcements/:announcementId", ({ params, actor, ip }) =>
    AnnouncementController.delete(params.announcementId, { user: actor, ip }), {
    params: ShopIdAndAnnouncementIdParam,
    detail: { summary: "Delete announcement", tags: ["Announcements"], security: [{ bearerAuth: [] }] },
  })

  // ── Q&A ──
  .post("/shops/:id/products/:productId/questions", ({ params, body, actor, ip }) =>
    QAController.askQuestion(params.productId, body as any, { user: actor, ip }), {
    params: ShopIdAndProductIdParam,
    body: AskQuestionBody,
    detail: { summary: "Ask a question", tags: ["Product Q&A"], security: [{ bearerAuth: [] }] },
  })

  .patch("/questions/:id/answer", ({ params, body, actor, ip }) =>
    QAController.answerQuestion(params.id, body as any, { user: actor, ip }), {
    params: UUIDParam,
    body: AnswerQuestionBody,
    detail: { summary: "Answer a question (shop owner)", tags: ["Product Q&A"], security: [{ bearerAuth: [] }] },
  })

  .post("/questions/:id/vote", ({ params, body, actor, ip }) =>
    QAController.vote(params.id, body as any, { user: actor, ip }), {
    params: UUIDParam,
    body: VoteQuestionBody,
    detail: { summary: "Vote on a question", tags: ["Product Q&A"], security: [{ bearerAuth: [] }] },
  })

  // ── Saved Items ──
  .post("/saved-items", ({ body, actor, ip }) =>
    SavedItemController.save(body as any, { user: actor, ip }), {
    body: SaveItemBody,
    detail: { summary: "Save product for later", tags: ["Saved Items"], security: [{ bearerAuth: [] }] },
  })

  .delete("/saved-items/:id", ({ params, actor, ip }) =>
    SavedItemController.unsave(params.id, { user: actor, ip }), {
    params: UUIDParam,
    detail: { summary: "Remove saved item", tags: ["Saved Items"], security: [{ bearerAuth: [] }] },
  })

  .get("/saved-items", ({ query, actor, ip }) =>
    SavedItemController.list(
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
      { user: actor, ip },
    ), {
    query: PaginationQuery,
    detail: { summary: "List saved items", tags: ["Saved Items"], security: [{ bearerAuth: [] }] },
  })

  // ── Product Links ──
  .post("/shops/:id/product-links", ({ params, body, actor, ip }) =>
    ProductLinkController.create(params.id, body as any, { user: actor, ip }), {
    params: ShopIdParam,
    body: CreateProductLinkBody,
    detail: { summary: "Create product link", tags: ["Product Links"], security: [{ bearerAuth: [] }] },
  })

  .get("/shops/:id/product-links", ({ params, query }) =>
    ProductLinkController.listByShop(
      params.id,
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
    ), {
    params: ShopIdParam,
    query: PaginationQuery,
    detail: { summary: "List shop product links", tags: ["Product Links"], security: [{ bearerAuth: [] }] },
  })

  .patch("/product-links/:id", ({ params, body, actor, ip }) =>
    ProductLinkController.update(params.id, body as any, { user: actor, ip }), {
    params: UUIDParam,
    body: UpdateProductLinkBody,
    detail: { summary: "Update product link", tags: ["Product Links"], security: [{ bearerAuth: [] }] },
  })

  .delete("/product-links/:id", ({ params, actor, ip }) =>
    ProductLinkController.delete(params.id, { user: actor, ip }), {
    params: UUIDParam,
    detail: { summary: "Delete product link", tags: ["Product Links"], security: [{ bearerAuth: [] }] },
  })

  // ── Daily Picks ──
  .post("/shops/:id/daily-picks", ({ params, body, actor, ip }) =>
    DailyPickController.create(params.id, body as any, { user: actor, ip }), {
    params: ShopIdParam,
    body: CreateDailyPickBody,
    detail: { summary: "Create daily pick", tags: ["Daily Picks"], security: [{ bearerAuth: [] }] },
  })

  .patch("/shops/:id/daily-picks/:pickId", ({ params, body, actor, ip }) =>
    DailyPickController.update(params.pickId, body as any, { user: actor, ip }), {
    params: ShopIdAndPickIdParam,
    body: UpdateDailyPickBody,
    detail: { summary: "Update daily pick", tags: ["Daily Picks"], security: [{ bearerAuth: [] }] },
  })

  .delete("/shops/:id/daily-picks/:pickId", ({ params, actor, ip }) =>
    DailyPickController.delete(params.pickId, { user: actor, ip }), {
    params: ShopIdAndPickIdParam,
    detail: { summary: "Delete daily pick", tags: ["Daily Picks"], security: [{ bearerAuth: [] }] },
  })

  .post("/shops/:id/daily-picks/:pickId/products", ({ params, body, actor, ip }) =>
    DailyPickController.addProduct(params.pickId, body as any, { user: actor, ip }), {
    params: ShopIdAndPickIdParam,
    body: AddDailyPickProductBody,
    detail: { summary: "Add product to daily pick", tags: ["Daily Picks"], security: [{ bearerAuth: [] }] },
  })

  .delete("/shops/:id/daily-picks/:pickId/products/:pid", ({ params, actor, ip }) =>
    DailyPickController.removeProduct(params.pickId, params.pid, { user: actor, ip }), {
    params: t.Object({
      id: t.String({ format: "uuid" }),
      pickId: t.String({ format: "uuid" }),
      pid: t.String({ format: "uuid" }),
    }),
    detail: { summary: "Remove product from daily pick", tags: ["Daily Picks"], security: [{ bearerAuth: [] }] },
  })

  // ── Coupons ──
  .post("/shops/:id/coupons", ({ params, body, actor, ip }) =>
    CouponController.create(params.id, body as any, { user: actor, ip }), {
    params: ShopIdParam,
    body: CreateCouponBody,
    detail: { summary: "Create coupon", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  .get("/shops/:id/coupons/manage", ({ params, query }) =>
    CouponController.listByShop(
      params.id,
      { page: Number(query.page) || 1, limit: Number(query.limit) || 20 },
      { status: query.status },
    ), {
    params: ShopIdParam,
    query: t.Object({
      ...PaginationQuery.properties,
      status: t.Optional(t.String()),
    }),
    detail: { summary: "List coupons (shop owner)", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  .get("/coupons/:id", ({ params }) =>
    CouponController.getById(params.id), {
    params: UUIDParam,
    detail: { summary: "Get coupon by ID", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  .patch("/coupons/:id", ({ params, body, actor, ip }) =>
    CouponController.update(params.id, body as any, { user: actor, ip }), {
    params: UUIDParam,
    body: UpdateCouponBody,
    detail: { summary: "Update coupon", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  .patch("/coupons/:id/deactivate", ({ params, actor, ip }) =>
    CouponController.deactivate(params.id, { user: actor, ip }), {
    params: UUIDParam,
    detail: { summary: "Deactivate coupon", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  .post("/coupons/validate", ({ body, actor, ip }) =>
    CouponController.validate(body as any, { user: actor, ip }), {
    body: ValidateCouponBody,
    detail: { summary: "Validate coupon code", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  // Coupon associations
  .post("/coupons/:id/products", ({ params, body, actor, ip }) =>
    CouponController.addProduct(params.id, body.productId, { user: actor, ip }, body.variantId), {
    params: UUIDParam,
    body: AddCouponProductBody,
    detail: { summary: "Link product to coupon", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  .delete("/coupons/:id/products/:pid", ({ params, actor, ip }) =>
    CouponController.removeProduct(params.id, params.pid, { user: actor, ip }), {
    params: t.Object({
      id: t.String({ format: "uuid" }),
      pid: t.String({ format: "uuid" }),
    }),
    detail: { summary: "Unlink product from coupon", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  .post("/coupons/:id/collections", ({ params, body, actor, ip }) =>
    CouponController.addCollection(params.id, body.collectionId, { user: actor, ip }), {
    params: UUIDParam,
    body: AddCouponCollectionBody,
    detail: { summary: "Link collection to coupon", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  .delete("/coupons/:id/collections/:cid", ({ params, actor, ip }) =>
    CouponController.removeCollection(params.id, params.cid, { user: actor, ip }), {
    params: t.Object({
      id: t.String({ format: "uuid" }),
      cid: t.String({ format: "uuid" }),
    }),
    detail: { summary: "Unlink collection from coupon", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  .post("/coupons/:id/categories", ({ params, body, actor, ip }) =>
    CouponController.addCategory(params.id, body.categoryId, { user: actor, ip }), {
    params: UUIDParam,
    body: AddCouponCategoryBody,
    detail: { summary: "Link category to coupon", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  })

  .delete("/coupons/:id/categories/:catId", ({ params, actor, ip }) =>
    CouponController.removeCategory(params.id, params.catId, { user: actor, ip }), {
    params: t.Object({
      id: t.String({ format: "uuid" }),
      catId: t.String({ format: "uuid" }),
    }),
    detail: { summary: "Unlink category from coupon", tags: ["Coupons"], security: [{ bearerAuth: [] }] },
  });

// =============================================================================
// ADMIN ROUTES
// =============================================================================

export const adminCatalogRoutes = new Elysia({ prefix: "/admin" })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .derive(({ actor }) => {
    if (!actor.roles.includes("admin")) throw AuthErrors.Common.unauthorized("Admin access required");
    return {};
  })

  // ── Brands (admin) ──
  .post("/brands", ({ body, actor, ip }) =>
    BrandController.create(body as any, { user: actor, ip }), {
    body: CreateBrandBody,
    detail: { summary: "Create brand (admin)", tags: ["Brands"], security: [{ bearerAuth: [] }] },
  })

  .patch("/brands/:id", ({ params, body, actor, ip }) =>
    BrandController.update(params.id, body as any, { user: actor, ip }), {
    params: UUIDParam,
    body: UpdateBrandBody,
    detail: { summary: "Update brand (admin)", tags: ["Brands"], security: [{ bearerAuth: [] }] },
  })

  .delete("/brands/:id", ({ params, actor, ip }) =>
    BrandController.delete(params.id, { user: actor, ip }), {
    params: UUIDParam,
    detail: { summary: "Delete brand (admin)", tags: ["Brands"], security: [{ bearerAuth: [] }] },
  })

  .post("/brands/:id/categories", ({ params, body, actor, ip }) =>
    BrandController.addCategory(params.id, body as any, { user: actor, ip }), {
    params: UUIDParam,
    body: AddBrandCategoryBody,
    detail: { summary: "Link category to brand (admin)", tags: ["Brands"], security: [{ bearerAuth: [] }] },
  })

  .delete("/brands/:id/categories/:catId", ({ params, actor, ip }) =>
    BrandController.removeCategory(params.id, params.catId, { user: actor, ip }), {
    params: t.Object({ id: t.String({ format: "uuid" }), catId: t.String({ format: "uuid" }) }),
    detail: { summary: "Unlink category from brand (admin)", tags: ["Brands"], security: [{ bearerAuth: [] }] },
  })

  // ── Master Products (admin) ──
  .post("/master-products", ({ body, actor, ip }) =>
    MasterProductController.create(body as any, { user: actor, ip }), {
    body: CreateMasterProductBody,
    detail: { summary: "Create master product (admin)", tags: ["Master Products"], security: [{ bearerAuth: [] }] },
  })

  .patch("/master-products/:id", ({ params, body, actor, ip }) =>
    MasterProductController.update(params.id, body as any, { user: actor, ip }), {
    params: UUIDParam,
    body: UpdateMasterProductBody,
    detail: { summary: "Update master product (admin)", tags: ["Master Products"], security: [{ bearerAuth: [] }] },
  })

  .patch("/master-products/:id/status", ({ params, body, actor, ip }) =>
    MasterProductController.updateStatus(params.id, body.status, { user: actor, ip }), {
    params: UUIDParam,
    body: StatusBody,
    detail: { summary: "Update master product status (admin)", tags: ["Master Products"], security: [{ bearerAuth: [] }] },
  })

  .post("/master-products/:id/variants", ({ params, body, actor, ip }) =>
    MasterProductController.addVariant(params.id, body as any, { user: actor, ip }), {
    params: UUIDParam,
    body: CreateMasterVariantBody,
    detail: { summary: "Add variant to master product (admin)", tags: ["Master Products"], security: [{ bearerAuth: [] }] },
  })

  .post("/master-products/:id/images", ({ params, body, actor, ip }) =>
    MasterProductController.addImage(params.id, body as any, { user: actor, ip }), {
    params: UUIDParam,
    body: AddProductImageBody,
    detail: { summary: "Add image to master product (admin)", tags: ["Master Products"], security: [{ bearerAuth: [] }] },
  })

  // ── Shop Product admin overrides ──
  .patch("/shop-products/:id/status", ({ params, body, actor, ip }) =>
    ShopProductController.adminUpdateStatus(params.id, body.status, { user: actor, ip }), {
    params: UUIDParam,
    body: StatusBody,
    detail: { summary: "Force shop product status (admin)", tags: ["Shop Products"], security: [{ bearerAuth: [] }] },
  });

// =============================================================================
// COMPOSED PLUGIN
// =============================================================================

export const catalogPlugin = new Elysia({ name: "catalog-plugin" })
  .use(publicCatalogRoutes)
  .use(protectedCatalogRoutes)
  .use(adminCatalogRoutes);
