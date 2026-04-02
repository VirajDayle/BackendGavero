# Catalog Module — Complete Implementation Plan

> **Goal**: Design the full catalog module layer (`catalog.errors.ts`, `catalog.schema.ts`, `catalog.repository.ts`, `catalog.service.ts`, `catalog.controller.ts`, `catalog.routes.ts`) consistent with the existing Auth/Shop/Profile architecture in Gavero.

The catalog schema ([db/models/catalog.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/db/models/catalog.ts)) spans 21 sections and 45+ tables. Rather than implementing every table at once, we organise the module into **logical sub-domains** with phased delivery. Phase 1 covers the core product lifecycle; later phases add merchandising, analytics, and loyalty features.

---

## Architecture Reference (from existing modules)

| Layer | Pattern | Example |
|---|---|---|
| **Errors** | Namespaced factory classes on [AppError](file:///home/viraj-dayle/Documents/code/gavero/backend/src/core/errors.ts#132-182), exported as `CatalogErrors` | [shop.errors.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.errors.ts), [profile.errors.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/profile/profile.errors.ts) |
| **Schema** | `drizzle-zod` (`createSelectSchema`, `createInsertSchema`) + hand-written request/response Zod schemas | [shop.schema.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.schema.ts) |
| **Repository** | Class-based, `DB` injected via constructor, [clean()](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.repository.ts#46-51) helper, [applyPagination()](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.repository.ts#52-55) | [shop.repository.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.repository.ts) |
| **Service** | Class-based impls (`*ServiceImpl`), repos injected. Singletons exported at bottom of file | [shop.service.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.service.ts) |
| **Controller** | `abstract class` with static methods, thin HTTP layer, delegates to services | [shop.controller.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.controller.ts) |
| **Routes** | Elysia groups: `public*Routes`, `protected*Routes`, `admin*Routes`, composed into a `catalogPlugin`. TypeBox bodies inline. | [shop.routes.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.routes.ts) |
| **App registration** | `app.use(catalogPlugin)` in [app.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/app.ts) | Line 250 |

---

## Phase Map

| Phase | Sub-domain | Tables Covered |
|---|---|---|
| **P1** | Brands | `brands`, `brand_categories` |
| **P1** | Master Products | `master_products`, `master_product_variants`, `master_product_images` |
| **P1** | Shop Products | `shop_products`, `shop_product_variants`, `shop_product_images` |
| **P1** | Pricing | `shop_product_prices`, `shop_product_pricing_tiers` |
| **P2** | Collections | `shop_collections`, `shop_collection_products` |
| **P2** | Bundles | `product_bundles`, `bundle_items` |
| **P2** | Product Links | `product_links`, `recommendation_queue` |
| **P2** | Daily Picks | `daily_picks`, `daily_pick_products` |
| **P3** | Filters | `product_filters`, `product_filter_values`, `filter_presets`, `filter_groups`, `filter_group_members` |
| **P3** | Q&A | `product_questions`, `question_votes` |
| **P3** | Announcements | `shop_announcements`, `announcement_dismissals` |
| **P3** | Stock Alerts | `stock_alerts`, `stock_alert_history` |
| **P4** | Saved / Wishlist | `saved_for_later`, `price_drop_alerts`, `back_in_stock_alerts`, `saved_item_collections` |
| **P4** | Price History | `product_price_history` |
| **P4** | Coupons | `shop_coupons`, `coupon_products/collections/categories`, `coupon_usage_history`, `coupon_code_batches`, `coupon_code_instances`, `coupon_validation_attempts` |
| **P5** | Coins / Loyalty | `shop_coins_config`, `customer_coins_balance`, `coins_transactions`, `coins_redemption_catalog`, `coins_redemptions`, `coins_expiration_ledger`, `coins_daily_checkins`, `customer_tier_history`, `coins_referrals` |
| **P5** | Analytics | `product_views`, `product_view_aggregates`, `product_interactions`, `product_comparisons`, `search_queries`, `search_suggestions`, `trending_*`, `product_popularity_scores` |
| **P5** | AI/Matching | `catalog_ai_recommendations`, `master_product_push_suggestions`, `master_product_matching_queue`, `duplicate_master_product_reports` |

---

## Proposed Changes

### Error Layer

#### [NEW] [catalog.errors.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/catalog/catalog.errors.ts)

Follows [profile.errors.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/profile/profile.errors.ts) pattern: private [meta()](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/profile/profile.errors.ts#13-16) helper, namespaced classes, exported as `CatalogErrors`.

**Error namespaces (Phase 1)**:

```
CatalogErrors.Common       — notFound, badRequest, forbidden, internal
CatalogErrors.Brand        — notFound, slugConflict, invalidHierarchy
CatalogErrors.MasterProduct — notFound, slugConflict, skuConflict, gtinConflict, invalidStatus
CatalogErrors.ShopProduct  — notFound, slugConflict, invalidSource, inventoryViolation, ownershipRequired
CatalogErrors.Variant      — notFound, skuConflict
CatalogErrors.Image        — notFound, limitExceeded
CatalogErrors.Price        — notFound, invalidDiscount, sellingExceedsMrp, overlappingActive
CatalogErrors.PricingTier  — overlappingRange, invalidTierType
```

**New ErrorCodes** to register in [core/errors.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/core/errors.ts):

```
BRAND_NOT_FOUND, BRAND_SLUG_CONFLICT, BRAND_INVALID_HIERARCHY,
MASTER_PRODUCT_NOT_FOUND, MASTER_PRODUCT_SLUG_CONFLICT, MASTER_PRODUCT_SKU_CONFLICT, MASTER_PRODUCT_GTIN_CONFLICT,
SHOP_PRODUCT_NOT_FOUND, SHOP_PRODUCT_SLUG_CONFLICT, SHOP_PRODUCT_INVALID_SOURCE, SHOP_PRODUCT_INVENTORY_VIOLATION,
VARIANT_NOT_FOUND, VARIANT_SKU_CONFLICT,
IMAGE_NOT_FOUND, IMAGE_LIMIT_EXCEEDED,
PRICE_NOT_FOUND, PRICE_INVALID_DISCOUNT, PRICE_SELLING_EXCEEDS_MRP, PRICE_OVERLAPPING_ACTIVE,
PRICING_TIER_OVERLAPPING, PRICING_TIER_INVALID_TYPE,
COLLECTION_NOT_FOUND, COLLECTION_SLUG_CONFLICT,
BUNDLE_NOT_FOUND, BUNDLE_SLUG_CONFLICT, BUNDLE_ITEM_CONFLICT,
COUPON_NOT_FOUND, COUPON_CODE_CONFLICT, COUPON_EXPIRED, COUPON_USAGE_EXCEEDED,
QUESTION_NOT_FOUND, ANNOUNCEMENT_NOT_FOUND,
STOCK_ALERT_NOT_FOUND, SAVED_ITEM_NOT_FOUND, SAVED_ITEM_DUPLICATE
```

---

### Schema / Validation Layer

#### [NEW] [catalog.schema.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/catalog/catalog.schema.ts)

Uses `drizzle-zod` + hand-crafted request schemas (same pattern as [shop.schema.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.schema.ts)).

**Shared primitives** (reuse across sub-domains):
```ts
const uuidSchema  = z.string().uuid();
const slugSchema  = z.string().min(1).max(200).regex(/^[a-z0-9-]+$/);
const paginationSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

**Brand schemas**:
- `createBrandRequestSchema` — `brandName`, `slug?` (auto-gen), `description?`, `parentBrandId?`, `metaTitle?`, `metaDescription?`
- `updateBrandRequestSchema` — partial of create
- `brandSelectSchema` — from `createSelectSchema(brandTable)`
- `addBrandCategoryRequestSchema` — `categoryId`, `isPrimary?`, `displayOrder?`

**Master Product schemas**:
- `createMasterProductRequestSchema` — [name](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.repository.ts#89-97), `slug?`, `leafCategoryId`, `brandId?`, `basePrice?`, `msrp?`, `description?`, `shortDescription?`, `globalSku?`, `gtin?`, `productCondition?`, `manufacturer?`, `countryOfOrigin?`, `attributes?`, `specifications?`, `tags?`, `keywords?`, physical dimensions
- `updateMasterProductRequestSchema` — partial
- `createMasterVariantRequestSchema` — `variantName`, `variantSku`, `attributes?`, overrides
- `addMasterProductImageRequestSchema` — `imageUrl`, `thumbnailUrl?`, `altText?`, `isPrimary?`, `displayOrder?`, dimensions

**Shop Product schemas**:
- `createShopProductRequestSchema` — `shopId`, `productSource`, `masterProductId?`, `name?`, `description?`, inventory fields, tax/shipping, display/marketing, status, SEO
- `updateShopProductRequestSchema` — partial
- `createShopVariantRequestSchema` — variant-specific fields
- `addShopProductImageRequestSchema` — image fields
- `setShopProductPriceRequestSchema` — `mrp`, `sellingPrice`, `costPrice?`, discount fields
- `createPricingTierRequestSchema` — tier-specific fields

**Collection schemas**:
- `createCollectionRequestSchema` — `collectionName`, `slug?`, `description?`, `collectionType`, `autoRules?`, display/SEO
- `addCollectionProductRequestSchema` — `shopProductId`, `displayOrder?`

**Bundle schemas**:
- `createBundleRequestSchema` — full bundle config
- `addBundleItemRequestSchema` — product + variant + quantity

---

### Repository Layer

#### [NEW] [catalog.repository.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/catalog/catalog.repository.ts)

One repository class per sub-domain, all following [ShopRepository](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.repository.ts#60-165) conventions:
- Constructor takes `private readonly db: DB`
- [clean()](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.repository.ts#46-51) helper for stripping `undefined` values
- [applyPagination()](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.repository.ts#52-55) helper
- Consistent [findById](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.repository.ts#63-75), [findBySlug](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.repository.ts#76-88), [list](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/profile/profile.controller.ts#84-93), [create](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.controller.ts#86-90), [update](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/profile/profile.controller.ts#351-366), [softDelete](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/profile/profile.controller.ts#261-265)/`hardDelete` method names

**Phase 1 repositories**:

```
BrandRepository
  - findById(id) → Brand | null
  - findBySlug(slug) → Brand | null
  - list(pagination, filters?) → { items, total }
  - create(data) → Brand
  - update(id, data) → Brand | null
  - delete(id) → void

BrandCategoryRepository
  - listByBrand(brandId) → BrandCategory[]
  - add(data) → BrandCategory
  - remove(brandId, categoryId) → void

MasterProductRepository
  - findById(id) → MasterProduct | null
  - findBySlug(slug) → MasterProduct | null
  - findBySku(sku) → MasterProduct | null
  - findByGtin(gtin) → MasterProduct | null
  - list(pagination, filters?) → { items, total }
  - create(data) → MasterProduct
  - update(id, data) → MasterProduct | null

MasterProductVariantRepository
  - findById(id) → Variant | null
  - listByProduct(masterProductId) → Variant[]
  - create(data) → Variant
  - update(id, data) → Variant | null
  - delete(id) → void

MasterProductImageRepository
  - findById(id) → Image | null
  - listByProduct(masterProductId) → Image[]
  - create(data) → Image
  - update(id, data) → Image | null
  - delete(id) → void
  - setPrimary(imageId, masterProductId) → void

ShopProductRepository
  - findById(id) → ShopProduct | null
  - findBySlug(shopId, slug) → ShopProduct | null
  - listByShop(shopId, pagination, filters?) → { items, total }
  - create(data) → ShopProduct
  - update(id, data) → ShopProduct | null
  - softDelete(id) → void

ShopProductVariantRepository
  - findById(id) → Variant | null
  - listByProduct(shopProductId) → Variant[]
  - create(data) → Variant
  - update(id, data) → Variant | null
  - delete(id) → void

ShopProductImageRepository
  - (same as master image repo, scoped to shop products)

ShopProductPriceRepository
  - findActivePrice(shopProductId, variantId?, currency?) → Price | null
  - listByProduct(shopProductId) → Price[]
  - create(data) → Price
  - update(id, data) → Price | null
  - deactivate(id) → void

PricingTierRepository
  - listByProduct(shopProductId) → Tier[]
  - create(data) → Tier
  - update(id, data) → Tier | null
  - delete(id) → void
```

**Phase 2 repositories**: `CollectionRepository`, `CollectionProductRepository`, `BundleRepository`, `BundleItemRepository`, `ProductLinkRepository`, `DailyPickRepository`.

---

### Service Layer

#### [NEW] [catalog.service.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/catalog/catalog.service.ts)

Follows [shop.service.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.service.ts) pattern: `*ServiceImpl` classes, repo injection, business logic, singletons exported at file bottom.

**Phase 1 services**:

```
BrandServiceImpl
  - create(data, actor) → Brand
    • Auto-generate slug from brandName
    • Validate parentBrandId exists if provided
    • Prevent self-referencing parent
  - getById(id) → Brand
  - list(pagination, filters?) → { items, total }
  - update(id, data, actor) → Brand
  - delete(id, actor) → void
  - addCategory(brandId, data, actor) → BrandCategory
  - removeCategory(brandId, categoryId, actor) → void

MasterProductServiceImpl
  - create(data, actor) → MasterProduct
    • Auto-generate slug
    • Validate unique SKU / GTIN
    • Validate leafCategoryId & brandId FK
    • Admin-only creation
  - getById(id) → MasterProduct
  - list(pagination, filters?) → { items, total }
  - update(id, data, actor) → MasterProduct
  - updateStatus(id, status, actor) → MasterProduct
  - addVariant(masterProductId, data, actor) → Variant
  - updateVariant(variantId, data, actor) → Variant
  - removeVariant(variantId, actor) → void
  - addImage(masterProductId, data, actor) → Image
  - removeImage(imageId, actor) → void
  - setPrimaryImage(imageId, masterProductId, actor) → void

ShopProductServiceImpl
  - create(shopId, data, actor) → ShopProduct
    • Validate shop ownership
    • Source = 'master' requires masterProductId, 'custom' forbids it
    • Auto-generate slug within shop scope
    • Copy initial price if master product has basePrice
  - getById(id) → ShopProduct
  - listByShop(shopId, pagination, filters?) → { items, total }
  - update(id, data, actor) → ShopProduct
    • Ownership check
    • Prevent status/source override via normal update
  - updateStatus(id, status, actor) → ShopProduct
  - softDelete(id, actor) → void
    • Ownership check, cascade soft-delete variants
  - updateStock(id, quantity, actor) → ShopProduct
    • Trigger stock alert if below threshold
  - addVariant(shopProductId, data, actor) → Variant
  - updateVariant(variantId, data, actor) → Variant
  - removeVariant(variantId, actor) → void
  - addImage(shopProductId, data, actor) → Image
  - removeImage(imageId, actor) → void
  - setPrimaryImage(imageId, shopProductId, actor) → void

ShopProductPriceServiceImpl
  - setPrice(shopProductId, data, actor) → Price
    • Validate selling ≤ MRP
    • Deactivate previous active price atomically
    • Record price history
  - getActivePrice(shopProductId, variantId?) → Price
  - listPriceHistory(shopProductId) → PriceHistory[]
  - addPricingTier(shopProductId, data, actor) → Tier
  - removePricingTier(tierId, actor) → void
```

**Singleton exports** (bottom of file):
```ts
import { db } from "../../db/index";

const brandRepo = new BrandRepository(db);
const brandCategoryRepo = new BrandCategoryRepository(db);
// ... all repos ...

export const BrandService = new BrandServiceImpl(db, brandRepo, brandCategoryRepo);
export const MasterProductService = new MasterProductServiceImpl(db, ...);
export const ShopProductService = new ShopProductServiceImpl(db, ...);
export const ShopProductPriceService = new ShopProductPriceServiceImpl(db, ...);
```

---

### Controller Layer

#### [NEW] [catalog.controller.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/catalog/catalog.controller.ts)

Follows [shop.controller.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.controller.ts): `abstract class` with `static async` methods, [Ctx](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/profile/profile.controller.ts#30-34) interface, [actor()](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.controller.ts#32-39) helper.

```
abstract class BrandController
  static create(body, ctx) → created(brand)
  static getById(id) → ok(brand)
  static list(pagination) → paginatedRaw(...)
  static update(id, body, ctx) → ok(brand)
  static delete(id, ctx) → ok({ deleted: true })
  static addCategory(brandId, body, ctx) → created(...)
  static removeCategory(brandId, categoryId, ctx) → ok({ deleted: true })

abstract class MasterProductController
  static create(body, ctx) → created(product)
  static getById(id) → ok(product)
  static list(pagination, filters) → paginatedRaw(...)
  static update(id, body, ctx) → ok(product)
  static updateStatus(id, status, ctx) → ok(product)
  static addVariant(productId, body, ctx) → created(variant)
  static updateVariant(variantId, body, ctx) → ok(variant)
  static removeVariant(variantId, ctx) → ok({ deleted: true })
  static addImage(productId, body, ctx) → created(image)
  static removeImage(imageId, ctx) → ok({ deleted: true })

abstract class ShopProductController
  static create(shopId, body, ctx) → created(product)
  static getById(id) → ok(product)
  static listByShop(shopId, pagination) → paginatedRaw(...)
  static update(id, body, ctx) → ok(product)
  static updateStatus(id, status, ctx) → ok(product)
  static softDelete(id, ctx) → ok({ deleted: true })
  static updateStock(id, body, ctx) → ok(product)
  static addVariant(productId, body, ctx) → created(variant)
  static addImage(productId, body, ctx) → created(image)

abstract class ShopProductPriceController
  static setPrice(shopProductId, body, ctx) → ok(price)
  static getActivePrice(shopProductId, query) → ok(price)
  static listPriceHistory(shopProductId, pagination) → paginatedRaw(...)
  static addPricingTier(shopProductId, body, ctx) → created(tier)
  static removePricingTier(tierId, ctx) → ok({ deleted: true })
```

---

### Route Layer

#### [NEW] [catalog.routes.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/catalog/catalog.routes.ts)

Follows [shop.routes.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.routes.ts): inline TypeBox schemas, [resolveRequestContext](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.routes.ts#83-103), [authenticate](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.routes.ts#106-112), `jwtAuthPlugin`, public/protected/admin split.

---

#### Public Routes (no auth)

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/brands` | `BrandController.list` | List brands (paginated, filterable) |
| `GET` | `/brands/:id` | `BrandController.getById` | Get brand by ID |
| `GET` | `/brands/s/:slug` | `BrandController.getBySlug` | Get brand by slug |
| `GET` | `/master-products` | `MasterProductController.list` | List master products (public catalog) |
| `GET` | `/master-products/:id` | `MasterProductController.getById` | Get master product details |
| `GET` | `/master-products/s/:slug` | `MasterProductController.getBySlug` | Get master product by slug |
| `GET` | `/shops/:shopId/products` | `ShopProductController.listByShop` | List shop products (public store) |
| `GET` | `/shops/:shopId/products/:id` | `ShopProductController.getById` | Get shop product detail |
| `GET` | `/shops/:shopId/products/s/:slug` | `ShopProductController.getBySlug` | Get shop product by slug |
| `GET` | `/shops/:shopId/collections` | `CollectionController.listByShop` | List collections |
| `GET` | `/shops/:shopId/collections/:id` | `CollectionController.getById` | Get collection detail |
| `GET` | `/shops/:shopId/bundles` | `BundleController.listByShop` | List bundles |
| `GET` | `/shops/:shopId/bundles/:id` | `BundleController.getById` | Get bundle detail |
| `GET` | `/shops/:shopId/daily-picks` | `DailyPickController.getToday` | Today's picks |
| `GET` | `/shops/:shopId/announcements` | `AnnouncementController.listActive` | Active announcements |
| `GET` | `/shops/:shopId/products/:id/questions` | `QAController.listByProduct` | Product Q&A |

---

#### Protected Routes (authenticated users — shop owners)

| Method | Path | Handler | Description |
|---|---|---|---|
| **Shop Products** |||
| `POST` | `/shops/:shopId/products` | `ShopProductController.create` | Add product to shop |
| `PATCH` | `/shops/:shopId/products/:id` | `ShopProductController.update` | Update shop product |
| `DELETE` | `/shops/:shopId/products/:id` | `ShopProductController.softDelete` | Soft-delete product |
| `PATCH` | `/shops/:shopId/products/:id/stock` | `ShopProductController.updateStock` | Adjust stock |
| **Variants** |||
| `POST` | `/shops/:shopId/products/:id/variants` | `ShopProductController.addVariant` | Add variant |
| `PATCH` | `/product-variants/:id` | `ShopProductController.updateVariant` | Update variant |
| `DELETE` | `/product-variants/:id` | `ShopProductController.removeVariant` | Remove variant |
| **Images** |||
| `POST` | `/shops/:shopId/products/:id/images` | `ShopProductController.addImage` | Add image |
| `DELETE` | `/product-images/:id` | `ShopProductController.removeImage` | Remove image |
| `PATCH` | `/product-images/:id/primary` | `ShopProductController.setPrimaryImage` | Set primary |
| **Pricing** |||
| `POST` | `/shops/:shopId/products/:id/price` | `PriceController.setPrice` | Set/update price |
| `GET` | `/shops/:shopId/products/:id/price` | `PriceController.getActivePrice` | Current price |
| `GET` | `/shops/:shopId/products/:id/price-history` | `PriceController.listHistory` | Price history |
| `POST` | `/shops/:shopId/products/:id/pricing-tiers` | `PriceController.addTier` | Add bulk tier |
| `DELETE` | `/pricing-tiers/:id` | `PriceController.removeTier` | Remove tier |
| **Collections** |||
| `POST` | `/shops/:shopId/collections` | `CollectionController.create` | Create collection |
| `PATCH` | `/shops/:shopId/collections/:id` | `CollectionController.update` | Update |
| `DELETE` | `/shops/:shopId/collections/:id` | `CollectionController.delete` | Delete |
| `POST` | `/shops/:shopId/collections/:id/products` | `CollectionController.addProduct` | Add product |
| `DELETE` | `/shops/:shopId/collections/:id/products/:pid` | `CollectionController.removeProduct` | Remove product |
| **Bundles** |||
| `POST` | `/shops/:shopId/bundles` | `BundleController.create` | Create bundle |
| `PATCH` | `/shops/:shopId/bundles/:id` | `BundleController.update` | Update |
| `DELETE` | `/shops/:shopId/bundles/:id` | `BundleController.delete` | Delete |
| `POST` | `/shops/:shopId/bundles/:id/items` | `BundleController.addItem` | Add item |
| `DELETE` | `/bundle-items/:id` | `BundleController.removeItem` | Remove item |
| **Daily Picks** |||
| `POST` | `/shops/:shopId/daily-picks` | `DailyPickController.create` | Create daily pick |
| `PATCH` | `/shops/:shopId/daily-picks/:id` | `DailyPickController.update` | Update |
| `POST` | `/shops/:shopId/daily-picks/:id/products` | `DailyPickController.addProduct` | Add product |
| **Coupons** |||
| `POST` | `/shops/:shopId/coupons` | `CouponController.create` | Create coupon |
| `PATCH` | `/shops/:shopId/coupons/:id` | `CouponController.update` | Update |
| `DELETE` | `/shops/:shopId/coupons/:id` | `CouponController.deactivate` | Deactivate |
| `GET` | `/shops/:shopId/coupons` | `CouponController.listByShop` | List coupons |
| `POST` | `/coupons/validate` | `CouponController.validate` | Validate code |
| **Announcements** |||
| `POST` | `/shops/:shopId/announcements` | `AnnouncementController.create` | Create |
| `PATCH` | `/shops/:shopId/announcements/:id` | `AnnouncementController.update` | Update |
| `DELETE` | `/shops/:shopId/announcements/:id` | `AnnouncementController.delete` | Delete |
| **Q&A** |||
| `POST` | `/shops/:shopId/products/:id/questions` | `QAController.askQuestion` | Ask question |
| `PATCH` | `/questions/:id/answer` | `QAController.answerQuestion` | Answer (shop owner) |
| `POST` | `/questions/:id/vote` | `QAController.vote` | Vote helpful/not |
| **Saved Items (customer)** |||
| `POST` | `/saved-items` | `SavedItemController.save` | Save product |
| `DELETE` | `/saved-items/:id` | `SavedItemController.unsave` | Remove saved |
| `GET` | `/saved-items` | `SavedItemController.list` | List saved items |

---

#### Admin Routes (admin role required)

| Method | Path | Handler | Description |
|---|---|---|---|
| **Brands** |||
| `POST` | `/admin/brands` | `BrandController.create` | Create brand |
| `PATCH` | `/admin/brands/:id` | `BrandController.update` | Update brand |
| `DELETE` | `/admin/brands/:id` | `BrandController.delete` | Delete brand |
| `POST` | `/admin/brands/:id/categories` | `BrandController.addCategory` | Link category |
| `DELETE` | `/admin/brands/:id/categories/:catId` | `BrandController.removeCategory` | Unlink category |
| `PATCH` | `/admin/brands/:id/verify` | `BrandController.verify` | Verify brand |
| **Master Products** |||
| `POST` | `/admin/master-products` | `MasterProductController.create` | Create |
| `PATCH` | `/admin/master-products/:id` | `MasterProductController.update` | Update |
| `PATCH` | `/admin/master-products/:id/status` | `MasterProductController.updateStatus` | Change status |
| `POST` | `/admin/master-products/:id/variants` | `MasterProductController.addVariant` | Add variant |
| `POST` | `/admin/master-products/:id/images` | `MasterProductController.addImage` | Add image |
| **Shop Product Admin** |||
| `PATCH` | `/admin/shop-products/:id/status` | `ShopProductController.adminUpdateStatus` | Force status |

---

#### Composed Plugin

```ts
export const catalogPlugin = new Elysia({ name: "catalog-plugin" })
  .use(publicCatalogRoutes)
  .use(protectedCatalogRoutes)
  .use(adminCatalogRoutes);
```

Registered in [app.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/app.ts):
```ts
.use(catalogPlugin)  // after shopPlugin
```

---

### Supporting Files

#### [MODIFY] [errors.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/core/errors.ts)

Add all new [ErrorCode](file:///home/viraj-dayle/Documents/code/gavero/backend/src/core/errors.ts#15-118) values to the [ErrorCode](file:///home/viraj-dayle/Documents/code/gavero/backend/src/core/errors.ts#15-118) union type (listed above).

#### [MODIFY] [app.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/app.ts)

- Import `catalogPlugin` from `./modules/catalog/catalog.routes`
- Add `.use(catalogPlugin)` after `.use(shopPlugin)`
- Add Swagger tags for Catalog sub-domains: `"Brands"`, `"Master Products"`, `"Shop Products"`, `"Product Pricing"`, `"Collections"`, `"Bundles"`, `"Daily Picks"`, `"Coupons"`, `"Product Q&A"`, `"Announcements"`, `"Saved Items"`, `"Stock Alerts"`

---

## Key Design Decisions

### 1. Ownership Model
- **Master products**: Admin-only CRUD (platform-level global catalog)
- **Shop products**: Shop owner CRUD (per-shop instances linking to master products or custom)
- **Brands**: Admin-only creation; shop owners can link via master products
- **Collections/Bundles/Daily Picks/Coupons/Announcements**: Shop owner CRUD (scoped to their shop)
- Ownership verified via `shop.ownerId === actor.actorId || actor.actorRoles.includes("admin")`

### 2. Slug Generation
- Auto-generated from name via kebab-case conversion (same as [shop.service.ts](file:///home/viraj-dayle/Documents/code/gavero/backend/src/modules/shop/shop.service.ts))
- Uniqueness enforced per scope: master products globally, shop products per-shop
- Counter suffix on collision

### 3. Price History Tracking
- Every `setPrice` call records the previous price in `product_price_history`
- Atomic deactivation of previous active price + activation of new price via DB transaction

### 4. Stock Alert Integration
- `updateStock` checks `lowStockThreshold` and creates/resolves `stock_alerts` entries
- Alert severity computed based on ratio: `current / threshold`

### 5. Phased Delivery
- P1 (core products) can ship independently — all other phases are additive
- Each phase adds new repository/service/controller classes to the same module files
- No circular dependencies between phases

---

## Verification Plan

### TypeScript Compilation
```bash
cd /home/viraj-dayle/Documents/code/gavero/backend && npx tsc --noEmit
```

### Smoke Test (dev server)
```bash
cd /home/viraj-dayle/Documents/code/gavero/backend && bun run dev
```
Verify the catalog routes appear in Swagger at `/docs`.

### Manual API Testing
After each phase, test the key flows via cURL / Swagger UI:

**P1 Brand flow**:
1. `POST /admin/brands` → create brand
2. `GET /brands` → verify listed
3. `PATCH /admin/brands/:id` → update
4. `POST /admin/brands/:id/categories` → link category

**P1 Master Product flow**:
1. `POST /admin/master-products` → create
2. `POST /admin/master-products/:id/variants` → add variant
3. `POST /admin/master-products/:id/images` → add image
4. `GET /master-products` → verify listed

**P1 Shop Product flow**:
1. `POST /shops/:shopId/products` → create from master (source=master)
2. `POST /shops/:shopId/products/:id/price` → set price
3. `PATCH /shops/:shopId/products/:id/stock` → adjust stock
4. `GET /shops/:shopId/products` → verify listed

**Error handling**:
- Verify 404 on nonexistent ID
- Verify 403 on non-owner update
- Verify 400 on `sellingPrice > mrp`
- Verify 409 on duplicate slug/SKU

> [!TIP]
> Suggest starting with P1 implementation immediately. Each subsequent phase adds complexity without blocking the core product lifecycle.
