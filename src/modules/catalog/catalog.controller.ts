/**
 * modules/catalog/catalog.controller.ts
 *
 * Thin HTTP layer for the catalog module.
 * Follows ShopController conventions: abstract class, static methods, actor helper.
 */

import type { AuthUser } from "../../middleware/auth.middleware";
import { ok, created, paginatedRaw } from "../../core/response";
import {
  BrandService,
  MasterProductService,
  ShopProductService,
  ShopProductPriceService,
  CollectionService,
  BundleService,
  AnnouncementService,
  QAService,
  SavedItemService,
  ProductLinkService,
  DailyPickService,
  CouponService,
} from "./catalog.service";
import type {
  CreateBrandRequest,
  UpdateBrandRequest,
  AddBrandCategoryRequest,
  CreateMasterProductRequest,
  UpdateMasterProductRequest,
  CreateMasterVariantRequest,
  AddProductImageRequest,
  CreateShopProductRequest,
  UpdateShopProductRequest,
  UpdateStockRequest,
  CreateShopVariantRequest,
  SetShopProductPriceRequest,
  CreatePricingTierRequest,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  AddCollectionProductRequest,
  CreateBundleRequest,
  UpdateBundleRequest,
  AddBundleItemRequest,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  AskQuestionRequest,
  AnswerQuestionRequest,
  VoteQuestionRequest,
  SaveItemRequest,
  CreateProductLinkRequest,
  UpdateProductLinkRequest,
  CreateDailyPickRequest,
  UpdateDailyPickRequest,
  AddDailyPickProductRequest,
  CreateCouponRequest,
  UpdateCouponRequest,
  ValidateCouponRequest,
  Pagination,
} from "./catalog.schema";

// ── Context ──────────────────────────────────────────────────────────────────

interface Ctx {
  user: AuthUser;
  ip: string;
}

function actor(ctx: Ctx) {
  return {
    actorId: ctx.user.id,
    actorRoles: ctx.user.roles,
  };
}

// =============================================================================
// 1. BRAND CONTROLLER
// =============================================================================

export abstract class BrandController {
  static async create(body: CreateBrandRequest, ctx: Ctx) {
    const brand = await BrandService.create(body, actor(ctx));
    return created(brand);
  }

  static async getById(id: string) {
    const brand = await BrandService.getById(id);
    return ok(brand);
  }

  static async getBySlug(slug: string) {
    const brand = await BrandService.getBySlug(slug);
    return ok(brand);
  }

  static async list(pagination: Pagination, filters?: { search?: string; isFeatured?: boolean }) {
    const result = await BrandService.list(pagination, filters);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async update(id: string, body: UpdateBrandRequest, ctx: Ctx) {
    const brand = await BrandService.update(id, body, actor(ctx));
    return ok(brand);
  }

  static async delete(id: string, ctx: Ctx) {
    await BrandService.delete(id, actor(ctx));
    return ok({ deleted: true });
  }

  static async addCategory(brandId: string, body: AddBrandCategoryRequest, ctx: Ctx) {
    const result = await BrandService.addCategory(brandId, body, actor(ctx));
    return created(result);
  }

  static async removeCategory(brandId: string, categoryId: string, ctx: Ctx) {
    await BrandService.removeCategory(brandId, categoryId, actor(ctx));
    return ok({ deleted: true });
  }
}

// =============================================================================
// 2. MASTER PRODUCT CONTROLLER
// =============================================================================

export abstract class MasterProductController {
  static async create(body: CreateMasterProductRequest, ctx: Ctx) {
    const product = await MasterProductService.create(body, actor(ctx));
    return created(product);
  }

  static async getById(id: string) {
    const product = await MasterProductService.getById(id);
    return ok(product);
  }

  static async getBySlug(slug: string) {
    const product = await MasterProductService.getBySlug(slug);
    return ok(product);
  }

  static async list(pagination: Pagination, filters?: { categoryId?: string; brandId?: string; status?: string }) {
    const result = await MasterProductService.list(pagination, filters);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async update(id: string, body: UpdateMasterProductRequest, ctx: Ctx) {
    const product = await MasterProductService.update(id, body, actor(ctx));
    return ok(product);
  }

  static async updateStatus(id: string, status: string, ctx: Ctx) {
    const product = await MasterProductService.updateStatus(id, status, actor(ctx));
    return ok(product);
  }

  static async addVariant(productId: string, body: CreateMasterVariantRequest, ctx: Ctx) {
    const variant = await MasterProductService.addVariant(productId, body, actor(ctx));
    return created(variant);
  }

  static async updateVariant(variantId: string, body: Partial<CreateMasterVariantRequest>, ctx: Ctx) {
    const variant = await MasterProductService.updateVariant(variantId, body, actor(ctx));
    return ok(variant);
  }

  static async removeVariant(variantId: string, ctx: Ctx) {
    await MasterProductService.removeVariant(variantId, actor(ctx));
    return ok({ deleted: true });
  }

  static async addImage(productId: string, body: AddProductImageRequest, ctx: Ctx) {
    const image = await MasterProductService.addImage(productId, body, actor(ctx));
    return created(image);
  }

  static async removeImage(imageId: string, ctx: Ctx) {
    await MasterProductService.removeImage(imageId, actor(ctx));
    return ok({ deleted: true });
  }
}

// =============================================================================
// 3. SHOP PRODUCT CONTROLLER
// =============================================================================

export abstract class ShopProductController {
  static async create(shopId: string, body: CreateShopProductRequest, ctx: Ctx) {
    const product = await ShopProductService.create(shopId, body, actor(ctx));
    return created(product);
  }

  static async getById(id: string) {
    const product = await ShopProductService.getById(id);
    return ok(product);
  }

  static async getBySlug(shopId: string, slug: string) {
    const product = await ShopProductService.getBySlug(shopId, slug);
    return ok(product);
  }

  static async listByShop(shopId: string, pagination: Pagination, filters?: { status?: string; isFeatured?: boolean }) {
    const result = await ShopProductService.listByShop(shopId, pagination, filters);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async update(id: string, body: UpdateShopProductRequest, ctx: Ctx) {
    const product = await ShopProductService.update(id, body, actor(ctx));
    return ok(product);
  }

  static async updateStatus(id: string, status: string, ctx: Ctx) {
    const product = await ShopProductService.updateStatus(id, status, actor(ctx));
    return ok(product);
  }

  static async adminUpdateStatus(id: string, status: string, ctx: Ctx) {
    const product = await ShopProductService.adminUpdateStatus(id, status, actor(ctx));
    return ok(product);
  }

  static async softDelete(id: string, ctx: Ctx) {
    await ShopProductService.softDelete(id, actor(ctx));
    return ok({ deleted: true });
  }

  static async updateStock(id: string, body: UpdateStockRequest, ctx: Ctx) {
    const product = await ShopProductService.updateStock(id, body, actor(ctx));
    return ok(product);
  }

  static async addVariant(shopProductId: string, body: CreateShopVariantRequest, ctx: Ctx) {
    const variant = await ShopProductService.addVariant(shopProductId, body, actor(ctx));
    return created(variant);
  }

  static async updateVariant(variantId: string, body: Partial<CreateShopVariantRequest>, ctx: Ctx) {
    const variant = await ShopProductService.updateVariant(variantId, body, actor(ctx));
    return ok(variant);
  }

  static async removeVariant(variantId: string, ctx: Ctx) {
    await ShopProductService.removeVariant(variantId, actor(ctx));
    return ok({ deleted: true });
  }

  static async addImage(shopProductId: string, body: AddProductImageRequest, ctx: Ctx) {
    const image = await ShopProductService.addImage(shopProductId, body, actor(ctx));
    return created(image);
  }

  static async removeImage(imageId: string, ctx: Ctx) {
    await ShopProductService.removeImage(imageId, actor(ctx));
    return ok({ deleted: true });
  }

  static async setPrimaryImage(imageId: string, shopProductId: string, ctx: Ctx) {
    await ShopProductService.setPrimaryImage(imageId, shopProductId, actor(ctx));
    return ok({ updated: true });
  }
}

// =============================================================================
// 4. PRICE CONTROLLER
// =============================================================================

export abstract class PriceController {
  static async setPrice(shopProductId: string, body: SetShopProductPriceRequest, ctx: Ctx) {
    const price = await ShopProductPriceService.setPrice(shopProductId, body, actor(ctx));
    return ok(price);
  }

  static async getActivePrice(shopProductId: string, query?: { variantId?: string; currency?: string }) {
    const price = await ShopProductPriceService.getActivePrice(
      shopProductId,
      query?.variantId,
      query?.currency,
    );
    return ok(price);
  }

  static async listHistory(shopProductId: string, pagination: Pagination) {
    const result = await ShopProductPriceService.listPriceHistory(shopProductId, pagination);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async addTier(shopProductId: string, body: CreatePricingTierRequest, ctx: Ctx) {
    const tier = await ShopProductPriceService.addPricingTier(shopProductId, body, actor(ctx));
    return created(tier);
  }

  static async removeTier(tierId: string, ctx: Ctx) {
    await ShopProductPriceService.removePricingTier(tierId, actor(ctx));
    return ok({ deleted: true });
  }
}

// =============================================================================
// 5. COLLECTION CONTROLLER
// =============================================================================

export abstract class CollectionController {
  static async create(shopId: string, body: CreateCollectionRequest, ctx: Ctx) {
    const collection = await CollectionService.create(shopId, body, actor(ctx));
    return created(collection);
  }

  static async getById(id: string) {
    const collection = await CollectionService.getById(id);
    return ok(collection);
  }

  static async listByShop(shopId: string, pagination: Pagination) {
    const result = await CollectionService.listByShop(shopId, pagination);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async update(id: string, body: UpdateCollectionRequest, ctx: Ctx) {
    const collection = await CollectionService.update(id, body, actor(ctx));
    return ok(collection);
  }

  static async delete(id: string, ctx: Ctx) {
    await CollectionService.delete(id, actor(ctx));
    return ok({ deleted: true });
  }

  static async addProduct(collectionId: string, body: AddCollectionProductRequest, ctx: Ctx) {
    const result = await CollectionService.addProduct(collectionId, body, actor(ctx));
    return created(result);
  }

  static async removeProduct(collectionId: string, shopProductId: string, ctx: Ctx) {
    await CollectionService.removeProduct(collectionId, shopProductId, actor(ctx));
    return ok({ deleted: true });
  }
}

// =============================================================================
// 6. BUNDLE CONTROLLER
// =============================================================================

export abstract class BundleController {
  static async create(shopId: string, body: CreateBundleRequest, ctx: Ctx) {
    const bundle = await BundleService.create(shopId, body, actor(ctx));
    return created(bundle);
  }

  static async getById(id: string) {
    const bundle = await BundleService.getById(id);
    return ok(bundle);
  }

  static async listByShop(shopId: string, pagination: Pagination) {
    const result = await BundleService.listByShop(shopId, pagination);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async update(id: string, body: UpdateBundleRequest, ctx: Ctx) {
    const bundle = await BundleService.update(id, body, actor(ctx));
    return ok(bundle);
  }

  static async delete(id: string, ctx: Ctx) {
    await BundleService.delete(id, actor(ctx));
    return ok({ deleted: true });
  }

  static async addItem(bundleId: string, body: AddBundleItemRequest, ctx: Ctx) {
    const item = await BundleService.addItem(bundleId, body, actor(ctx));
    return created(item);
  }

  static async removeItem(itemId: string, ctx: Ctx) {
    await BundleService.removeItem(itemId, actor(ctx));
    return ok({ deleted: true });
  }
}

// =============================================================================
// 7. ANNOUNCEMENT CONTROLLER
// =============================================================================

export abstract class AnnouncementController {
  static async create(shopId: string, body: CreateAnnouncementRequest, ctx: Ctx) {
    const announcement = await AnnouncementService.create(shopId, body, actor(ctx));
    return created(announcement);
  }

  static async listActive(shopId: string) {
    const announcements = await AnnouncementService.listActive(shopId);
    return ok(announcements);
  }

  static async update(id: string, body: UpdateAnnouncementRequest, ctx: Ctx) {
    const announcement = await AnnouncementService.update(id, body, actor(ctx));
    return ok(announcement);
  }

  static async delete(id: string, ctx: Ctx) {
    await AnnouncementService.delete(id, actor(ctx));
    return ok({ deleted: true });
  }
}

// =============================================================================
// 8. Q&A CONTROLLER
// =============================================================================

export abstract class QAController {
  static async listByProduct(shopProductId: string, pagination: Pagination) {
    const result = await QAService.listByProduct(shopProductId, pagination);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async askQuestion(shopProductId: string, body: AskQuestionRequest, ctx: Ctx) {
    const question = await QAService.askQuestion(shopProductId, body, actor(ctx));
    return created(question);
  }

  static async answerQuestion(questionId: string, body: AnswerQuestionRequest, ctx: Ctx) {
    const question = await QAService.answerQuestion(questionId, body, actor(ctx));
    return ok(question);
  }

  static async vote(questionId: string, body: VoteQuestionRequest, ctx: Ctx) {
    await QAService.vote(questionId, body, actor(ctx));
    return ok({ voted: true });
  }
}

// =============================================================================
// 9. SAVED ITEM CONTROLLER
// =============================================================================

export abstract class SavedItemController {
  static async save(body: SaveItemRequest, ctx: Ctx) {
    const item = await SavedItemService.save(body, actor(ctx));
    return created(item);
  }

  static async unsave(id: string, ctx: Ctx) {
    await SavedItemService.unsave(id, actor(ctx));
    return ok({ deleted: true });
  }

  static async list(pagination: Pagination, ctx: Ctx) {
    const result = await SavedItemService.list(actor(ctx), pagination);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }
}

// =============================================================================
// 10. PRODUCT LINK CONTROLLER
// =============================================================================

export abstract class ProductLinkController {
  static async create(shopId: string, body: CreateProductLinkRequest, ctx: Ctx) {
    const link = await ProductLinkService.create(shopId, body, actor(ctx));
    return created(link);
  }

  static async listByProduct(productId: string, query?: { linkType?: string }) {
    const links = await ProductLinkService.listByProduct(productId, query?.linkType);
    return ok(links);
  }

  static async listByShop(shopId: string, pagination: Pagination) {
    const result = await ProductLinkService.listByShop(shopId, pagination);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async update(id: string, body: UpdateProductLinkRequest, ctx: Ctx) {
    const link = await ProductLinkService.update(id, body, actor(ctx));
    return ok(link);
  }

  static async delete(id: string, ctx: Ctx) {
    await ProductLinkService.delete(id, actor(ctx));
    return ok({ deleted: true });
  }
}

// =============================================================================
// 11. DAILY PICK CONTROLLER
// =============================================================================

export abstract class DailyPickController {
  static async create(shopId: string, body: CreateDailyPickRequest, ctx: Ctx) {
    const pick = await DailyPickService.create(shopId, body, actor(ctx));
    return created(pick);
  }

  static async getById(id: string) {
    const pick = await DailyPickService.getById(id);
    return ok(pick);
  }

  static async getToday(shopId: string) {
    const pick = await DailyPickService.getToday(shopId);
    return ok(pick);
  }

  static async listByShop(shopId: string, pagination: Pagination) {
    const result = await DailyPickService.listByShop(shopId, pagination);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async update(id: string, body: UpdateDailyPickRequest, ctx: Ctx) {
    const pick = await DailyPickService.update(id, body, actor(ctx));
    return ok(pick);
  }

  static async delete(id: string, ctx: Ctx) {
    await DailyPickService.delete(id, actor(ctx));
    return ok({ deleted: true });
  }

  static async addProduct(dailyPickId: string, body: AddDailyPickProductRequest, ctx: Ctx) {
    const result = await DailyPickService.addProduct(dailyPickId, body, actor(ctx));
    return created(result);
  }

  static async removeProduct(dailyPickId: string, shopProductId: string, ctx: Ctx) {
    await DailyPickService.removeProduct(dailyPickId, shopProductId, actor(ctx));
    return ok({ deleted: true });
  }

  static async listProducts(dailyPickId: string) {
    const products = await DailyPickService.listProducts(dailyPickId);
    return ok(products);
  }
}

// =============================================================================
// 12. COUPON CONTROLLER
// =============================================================================

export abstract class CouponController {
  static async create(shopId: string, body: CreateCouponRequest, ctx: Ctx) {
    const coupon = await CouponService.create(shopId, body, actor(ctx));
    return created(coupon);
  }

  static async getById(id: string) {
    const coupon = await CouponService.getById(id);
    return ok(coupon);
  }

  static async listByShop(shopId: string, pagination: Pagination, filters?: { status?: string }) {
    const result = await CouponService.listByShop(shopId, pagination, filters);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async update(id: string, body: UpdateCouponRequest, ctx: Ctx) {
    const coupon = await CouponService.update(id, body, actor(ctx));
    return ok(coupon);
  }

  static async deactivate(id: string, ctx: Ctx) {
    await CouponService.deactivate(id, actor(ctx));
    return ok({ deactivated: true });
  }

  static async validate(body: ValidateCouponRequest, ctx: Ctx) {
    const result = await CouponService.validate(body, actor(ctx));
    return ok(result);
  }

  static async addProduct(couponId: string, productId: string, ctx: Ctx, variantId?: string) {
    const result = await CouponService.addProduct(couponId, productId, actor(ctx), variantId);
    return created(result);
  }

  static async removeProduct(couponId: string, productId: string, ctx: Ctx) {
    await CouponService.removeProduct(couponId, productId, actor(ctx));
    return ok({ deleted: true });
  }

  static async addCollection(couponId: string, collectionId: string, ctx: Ctx) {
    const result = await CouponService.addCollection(couponId, collectionId, actor(ctx));
    return created(result);
  }

  static async removeCollection(couponId: string, collectionId: string, ctx: Ctx) {
    await CouponService.removeCollection(couponId, collectionId, actor(ctx));
    return ok({ deleted: true });
  }

  static async addCategory(couponId: string, categoryId: string, ctx: Ctx) {
    const result = await CouponService.addCategory(couponId, categoryId, actor(ctx));
    return created(result);
  }

  static async removeCategory(couponId: string, categoryId: string, ctx: Ctx) {
    await CouponService.removeCategory(couponId, categoryId, actor(ctx));
    return ok({ deleted: true });
  }
}
