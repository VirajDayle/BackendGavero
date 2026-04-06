/**
 * modules/catalog/catalog.repository.ts
 *
 * Data-access layer for the catalog module — Phase 1 (core products).
 * Follows ShopRepository conventions: DB injection, clean(), applyPagination().
 */

import { and, desc, eq, isNull, sql, asc, count } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { DB } from "../../db/index";
import type { Pagination } from "./catalog.schema";
import { clean, applyPagination } from "../../shared";

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
  questionVotesTable,
  savedForLaterTable,
  productPriceHistoryTable,
  shopCouponsTable,
  couponProductsTable,
  couponCollectionsTable,
  couponCategoriesTable,
  couponUsageHistoryTable,
  couponValidationAttemptsTable,
} from "../../db/schema";

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

type Brand = InferSelectModel<typeof brandTable>;
type BrandInsert = InferInsertModel<typeof brandTable>;

type BrandCategory = InferSelectModel<typeof brandCategoriesTable>;
type BrandCategoryInsert = InferInsertModel<typeof brandCategoriesTable>;

type MasterProduct = InferSelectModel<typeof masterProductTable>;
type MasterProductInsert = InferInsertModel<typeof masterProductTable>;

type MasterVariant = InferSelectModel<typeof masterProductVariantTable>;
type MasterVariantInsert = InferInsertModel<typeof masterProductVariantTable>;

type MasterImage = InferSelectModel<typeof masterProductImagesTable>;
type MasterImageInsert = InferInsertModel<typeof masterProductImagesTable>;

type ShopProduct = InferSelectModel<typeof shopProductTable>;
type ShopProductInsert = InferInsertModel<typeof shopProductTable>;

type ShopVariant = InferSelectModel<typeof shopProductVariantTable>;
type ShopVariantInsert = InferInsertModel<typeof shopProductVariantTable>;

type ShopImage = InferSelectModel<typeof shopProductImagesTable>;
type ShopImageInsert = InferInsertModel<typeof shopProductImagesTable>;

type ShopPrice = InferSelectModel<typeof shopProductPriceTable>;
type ShopPriceInsert = InferInsertModel<typeof shopProductPriceTable>;

type PricingTier = InferSelectModel<typeof shopProductPricingTiersTable>;
type PricingTierInsert = InferInsertModel<typeof shopProductPricingTiersTable>;

type Collection = InferSelectModel<typeof shopCollectionsTable>;
type CollectionInsert = InferInsertModel<typeof shopCollectionsTable>;

type CollectionProduct = InferSelectModel<typeof shopCollectionProductsTable>;
type CollectionProductInsert = InferInsertModel<typeof shopCollectionProductsTable>;

type Bundle = InferSelectModel<typeof productBundlesTable>;
type BundleInsert = InferInsertModel<typeof productBundlesTable>;

type BundleItem = InferSelectModel<typeof bundleItemsTable>;
type BundleItemInsert = InferInsertModel<typeof bundleItemsTable>;

type Question = InferSelectModel<typeof productQuestionsTable>;
type QuestionInsert = InferInsertModel<typeof productQuestionsTable>;

type Announcement = InferSelectModel<typeof shopAnnouncementsTable>;
type AnnouncementInsert = InferInsertModel<typeof shopAnnouncementsTable>;

type SavedItem = InferSelectModel<typeof savedForLaterTable>;
type SavedItemInsert = InferInsertModel<typeof savedForLaterTable>;

type PriceHistory = InferSelectModel<typeof productPriceHistoryTable>;
type PriceHistoryInsert = InferInsertModel<typeof productPriceHistoryTable>;

type ProductLink = InferSelectModel<typeof productLinksTable>;
type ProductLinkInsert = InferInsertModel<typeof productLinksTable>;

type DailyPickRow = InferSelectModel<typeof dailyPicksTable>;
type DailyPickInsert = InferInsertModel<typeof dailyPicksTable>;

type DailyPickProduct = InferSelectModel<typeof dailyPickProductsTable>;
type DailyPickProductInsert = InferInsertModel<typeof dailyPickProductsTable>;

type CouponRow = InferSelectModel<typeof shopCouponsTable>;
type CouponInsert = InferInsertModel<typeof shopCouponsTable>;

type CouponProduct = InferSelectModel<typeof couponProductsTable>;
type CouponProductInsert = InferInsertModel<typeof couponProductsTable>;

type CouponCollection = InferSelectModel<typeof couponCollectionsTable>;
type CouponCollectionInsert = InferInsertModel<typeof couponCollectionsTable>;

type CouponCategory = InferSelectModel<typeof couponCategoriesTable>;
type CouponCategoryInsert = InferInsertModel<typeof couponCategoriesTable>;

type CouponUsageHistory = InferSelectModel<typeof couponUsageHistoryTable>;
type CouponUsageInsert = InferInsertModel<typeof couponUsageHistoryTable>;

type CouponValidation = InferSelectModel<typeof couponValidationAttemptsTable>;
type CouponValidationInsert = InferInsertModel<typeof couponValidationAttemptsTable>;


// =============================================================================
// 1. BrandRepository
// =============================================================================

export class BrandRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<Brand | null> {
    const [row] = await this.db
      .select()
      .from(brandTable)
      .where(and(eq(brandTable.id, id), eq(brandTable.isActive, true)))
      .limit(1);
    return row ?? null;
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    const [row] = await this.db
      .select()
      .from(brandTable)
      .where(and(eq(brandTable.slug, slug), eq(brandTable.isActive, true)))
      .limit(1);
    return row ?? null;
  }

  async list(
    pagination: Pagination,
    filters?: { search?: string; isFeatured?: boolean },
  ): Promise<{ items: Brand[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const conditions = [eq(brandTable.isActive, true)];

    if (filters?.isFeatured !== undefined) {
      conditions.push(eq(brandTable.isFeatured, filters.isFeatured));
    }

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(brandTable)
        .where(and(...conditions))
        .orderBy(asc(brandTable.brandName))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(brandTable)
        .where(and(...conditions)),
    ]);

    return { items, total };
  }

  async create(data: BrandInsert): Promise<Brand> {
    const [row] = await this.db
      .insert(brandTable)
      .values(data)
      .returning();
    return row;
  }

  async update(id: string, data: Partial<BrandInsert>): Promise<Brand | null> {
    const [row] = await this.db
      .update(brandTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(brandTable.id, id))
      .returning();
    return row ?? null;
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(brandTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(brandTable.id, id));
  }
}

// =============================================================================
// 2. BrandCategoryRepository
// =============================================================================

export class BrandCategoryRepository {
  constructor(private readonly db: DB) {}

  async listByBrand(brandId: string): Promise<BrandCategory[]> {
    return this.db
      .select()
      .from(brandCategoriesTable)
      .where(eq(brandCategoriesTable.brandId, brandId))
      .orderBy(asc(brandCategoriesTable.displayOrder));
  }

  async add(data: BrandCategoryInsert): Promise<BrandCategory> {
    const [row] = await this.db
      .insert(brandCategoriesTable)
      .values(data)
      .returning();
    return row;
  }

  async remove(brandId: string, categoryId: string): Promise<void> {
    await this.db
      .delete(brandCategoriesTable)
      .where(
        and(
          eq(brandCategoriesTable.brandId, brandId),
          eq(brandCategoriesTable.categoryId, categoryId),
        ),
      );
  }
}

// =============================================================================
// 3. MasterProductRepository
// =============================================================================

export class MasterProductRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<MasterProduct | null> {
    const [row] = await this.db
      .select()
      .from(masterProductTable)
      .where(eq(masterProductTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async findBySlug(slug: string): Promise<MasterProduct | null> {
    const [row] = await this.db
      .select()
      .from(masterProductTable)
      .where(eq(masterProductTable.slug, slug))
      .limit(1);
    return row ?? null;
  }

  async findBySku(sku: string): Promise<MasterProduct | null> {
    const [row] = await this.db
      .select()
      .from(masterProductTable)
      .where(eq(masterProductTable.globalSku, sku))
      .limit(1);
    return row ?? null;
  }

  async findByGtin(gtin: string): Promise<MasterProduct | null> {
    const [row] = await this.db
      .select()
      .from(masterProductTable)
      .where(eq(masterProductTable.gtin, gtin))
      .limit(1);
    return row ?? null;
  }

  async list(
    pagination: Pagination,
    filters?: { categoryId?: string; brandId?: string; status?: string },
  ): Promise<{ items: MasterProduct[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.categoryId) {
      conditions.push(eq(masterProductTable.leafCategoryId, filters.categoryId));
    }
    if (filters?.brandId) {
      conditions.push(eq(masterProductTable.brandId, filters.brandId));
    }
    if (filters?.status) {
      conditions.push(eq(masterProductTable.status, filters.status as any));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(masterProductTable)
        .where(where)
        .orderBy(desc(masterProductTable.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(masterProductTable).where(where),
    ]);

    return { items, total };
  }

  async create(data: MasterProductInsert): Promise<MasterProduct> {
    const [row] = await this.db
      .insert(masterProductTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<MasterProductInsert>,
  ): Promise<MasterProduct | null> {
    const [row] = await this.db
      .update(masterProductTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(masterProductTable.id, id))
      .returning();
    return row ?? null;
  }
}

// =============================================================================
// 4. MasterProductVariantRepository
// =============================================================================

export class MasterProductVariantRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<MasterVariant | null> {
    const [row] = await this.db
      .select()
      .from(masterProductVariantTable)
      .where(eq(masterProductVariantTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async listByProduct(masterProductId: string): Promise<MasterVariant[]> {
    return this.db
      .select()
      .from(masterProductVariantTable)
      .where(eq(masterProductVariantTable.masterProductId, masterProductId))
      .orderBy(asc(masterProductVariantTable.displayOrder));
  }

  async create(data: MasterVariantInsert): Promise<MasterVariant> {
    const [row] = await this.db
      .insert(masterProductVariantTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<MasterVariantInsert>,
  ): Promise<MasterVariant | null> {
    const [row] = await this.db
      .update(masterProductVariantTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(masterProductVariantTable.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(masterProductVariantTable)
      .where(eq(masterProductVariantTable.id, id));
  }
}

// =============================================================================
// 5. MasterProductImageRepository
// =============================================================================

export class MasterProductImageRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<MasterImage | null> {
    const [row] = await this.db
      .select()
      .from(masterProductImagesTable)
      .where(eq(masterProductImagesTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async listByProduct(masterProductId: string): Promise<MasterImage[]> {
    return this.db
      .select()
      .from(masterProductImagesTable)
      .where(eq(masterProductImagesTable.masterProductId, masterProductId))
      .orderBy(asc(masterProductImagesTable.displayOrder));
  }

  async countByProduct(masterProductId: string): Promise<number> {
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(masterProductImagesTable)
      .where(eq(masterProductImagesTable.masterProductId, masterProductId));
    return total;
  }

  async create(data: MasterImageInsert): Promise<MasterImage> {
    const [row] = await this.db
      .insert(masterProductImagesTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<MasterImageInsert>,
  ): Promise<MasterImage | null> {
    const [row] = await this.db
      .update(masterProductImagesTable)
      .set(clean(data))
      .where(eq(masterProductImagesTable.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(masterProductImagesTable)
      .where(eq(masterProductImagesTable.id, id));
  }

  /** Unset all isPrimary for a product, then set the given image as primary */
  async setPrimary(imageId: string, masterProductId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(masterProductImagesTable)
        .set({ isPrimary: false })
        .where(eq(masterProductImagesTable.masterProductId, masterProductId));
      await tx
        .update(masterProductImagesTable)
        .set({ isPrimary: true })
        .where(eq(masterProductImagesTable.id, imageId));
    });
  }
}

// =============================================================================
// 6. ShopProductRepository
// =============================================================================

export class ShopProductRepository {
  constructor(private readonly db: DB) {}

  async findById(
    id: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<ShopProduct | null> {
    const conditions = [eq(shopProductTable.id, id)];
    if (!opts.includeDeleted) conditions.push(isNull(shopProductTable.deletedAt));

    const [row] = await this.db
      .select()
      .from(shopProductTable)
      .where(and(...conditions))
      .limit(1);
    return row ?? null;
  }

  async findBySlug(
    shopId: string,
    slug: string,
  ): Promise<ShopProduct | null> {
    const [row] = await this.db
      .select()
      .from(shopProductTable)
      .where(
        and(
          eq(shopProductTable.shopId, shopId),
          eq(shopProductTable.slug, slug),
          isNull(shopProductTable.deletedAt),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listByShop(
    shopId: string,
    pagination: Pagination,
    filters?: { status?: string; isFeatured?: boolean; categoryId?: string },
  ): Promise<{ items: ShopProduct[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const conditions = [
      eq(shopProductTable.shopId, shopId),
      isNull(shopProductTable.deletedAt),
    ];

    if (filters?.status) {
      conditions.push(eq(shopProductTable.status, filters.status as any));
    }
    if (filters?.isFeatured !== undefined) {
      conditions.push(eq(shopProductTable.isFeatured, filters.isFeatured));
    }

    const where = and(...conditions);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(shopProductTable)
        .where(where)
        .orderBy(desc(shopProductTable.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(shopProductTable).where(where),
    ]);

    return { items, total };
  }

  async create(data: ShopProductInsert): Promise<ShopProduct> {
    const [row] = await this.db
      .insert(shopProductTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<ShopProductInsert>,
  ): Promise<ShopProduct | null> {
    const [row] = await this.db
      .update(shopProductTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(shopProductTable.id, id))
      .returning();
    return row ?? null;
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(shopProductTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(shopProductTable.id, id));
  }
}

// =============================================================================
// 7. ShopProductVariantRepository
// =============================================================================

export class ShopProductVariantRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<ShopVariant | null> {
    const [row] = await this.db
      .select()
      .from(shopProductVariantTable)
      .where(eq(shopProductVariantTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async listByProduct(shopProductId: string): Promise<ShopVariant[]> {
    return this.db
      .select()
      .from(shopProductVariantTable)
      .where(eq(shopProductVariantTable.shopProductId, shopProductId))
      .orderBy(asc(shopProductVariantTable.displayOrder));
  }

  async create(data: ShopVariantInsert): Promise<ShopVariant> {
    const [row] = await this.db
      .insert(shopProductVariantTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<ShopVariantInsert>,
  ): Promise<ShopVariant | null> {
    const [row] = await this.db
      .update(shopProductVariantTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(shopProductVariantTable.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(shopProductVariantTable)
      .where(eq(shopProductVariantTable.id, id));
  }
}

// =============================================================================
// 8. ShopProductImageRepository
// =============================================================================

export class ShopProductImageRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<ShopImage | null> {
    const [row] = await this.db
      .select()
      .from(shopProductImagesTable)
      .where(eq(shopProductImagesTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async listByProduct(shopProductId: string): Promise<ShopImage[]> {
    return this.db
      .select()
      .from(shopProductImagesTable)
      .where(eq(shopProductImagesTable.shopProductId, shopProductId))
      .orderBy(asc(shopProductImagesTable.displayOrder));
  }

  async countByProduct(shopProductId: string): Promise<number> {
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(shopProductImagesTable)
      .where(eq(shopProductImagesTable.shopProductId, shopProductId));
    return total;
  }

  async create(data: ShopImageInsert): Promise<ShopImage> {
    const [row] = await this.db
      .insert(shopProductImagesTable)
      .values(data)
      .returning();
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(shopProductImagesTable)
      .where(eq(shopProductImagesTable.id, id));
  }

  async setPrimary(imageId: string, shopProductId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(shopProductImagesTable)
        .set({ isPrimary: false })
        .where(eq(shopProductImagesTable.shopProductId, shopProductId));
      await tx
        .update(shopProductImagesTable)
        .set({ isPrimary: true })
        .where(eq(shopProductImagesTable.id, imageId));
    });
  }
}

// =============================================================================
// 9. ShopProductPriceRepository
// =============================================================================

export class ShopProductPriceRepository {
  constructor(private readonly db: DB) {}

  async findActivePrice(
    shopProductId: string,
    variantId?: string,
    currency = "INR",
  ): Promise<ShopPrice | null> {
    const conditions = [
      eq(shopProductPriceTable.shopProductId, shopProductId),
      eq(shopProductPriceTable.isActive, true),
      eq(shopProductPriceTable.currencyCode, currency),
    ];

    if (variantId) {
      conditions.push(
        eq(shopProductPriceTable.shopProductVariantId, variantId),
      );
    } else {
      conditions.push(isNull(shopProductPriceTable.shopProductVariantId));
    }

    const [row] = await this.db
      .select()
      .from(shopProductPriceTable)
      .where(and(...conditions))
      .limit(1);
    return row ?? null;
  }

  async listByProduct(shopProductId: string): Promise<ShopPrice[]> {
    return this.db
      .select()
      .from(shopProductPriceTable)
      .where(eq(shopProductPriceTable.shopProductId, shopProductId))
      .orderBy(desc(shopProductPriceTable.createdAt));
  }

  async create(data: ShopPriceInsert): Promise<ShopPrice> {
    const [row] = await this.db
      .insert(shopProductPriceTable)
      .values(data)
      .returning();
    return row;
  }

  async deactivate(id: string): Promise<void> {
    await this.db
      .update(shopProductPriceTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(shopProductPriceTable.id, id));
  }

  /** Deactivate old + create new atomically */
  async replaceActivePrice(
    shopProductId: string,
    newData: ShopPriceInsert,
    variantId?: string,
    currency = "INR",
  ): Promise<ShopPrice> {
    return this.db.transaction(async (tx) => {
      // Deactivate current active price
      const conditions = [
        eq(shopProductPriceTable.shopProductId, shopProductId),
        eq(shopProductPriceTable.isActive, true),
        eq(shopProductPriceTable.currencyCode, currency),
      ];
      if (variantId) {
        conditions.push(
          eq(shopProductPriceTable.shopProductVariantId, variantId),
        );
      } else {
        conditions.push(isNull(shopProductPriceTable.shopProductVariantId));
      }

      await tx
        .update(shopProductPriceTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(...conditions));

      // Insert new price
      const [row] = await tx
        .insert(shopProductPriceTable)
        .values({ ...newData, isActive: true })
        .returning();

      return row;
    });
  }
}

// =============================================================================
// 10. PricingTierRepository
// =============================================================================

export class PricingTierRepository {
  constructor(private readonly db: DB) {}

  async listByProduct(
    shopProductId: string,
    variantId?: string,
  ): Promise<PricingTier[]> {
    const conditions = [
      eq(shopProductPricingTiersTable.shopProductId, shopProductId),
      eq(shopProductPricingTiersTable.isActive, true),
    ];
    if (variantId) {
      conditions.push(
        eq(shopProductPricingTiersTable.shopProductVariantId, variantId),
      );
    }

    return this.db
      .select()
      .from(shopProductPricingTiersTable)
      .where(and(...conditions))
      .orderBy(asc(shopProductPricingTiersTable.minQuantity));
  }

  async create(data: PricingTierInsert): Promise<PricingTier> {
    const [row] = await this.db
      .insert(shopProductPricingTiersTable)
      .values(data)
      .returning();
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(shopProductPricingTiersTable)
      .where(eq(shopProductPricingTiersTable.id, id));
  }
}

// =============================================================================
// 11. CollectionRepository
// =============================================================================

export class CollectionRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<Collection | null> {
    const [row] = await this.db
      .select()
      .from(shopCollectionsTable)
      .where(
        and(
          eq(shopCollectionsTable.id, id),
          eq(shopCollectionsTable.isActive, true),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async findBySlug(shopId: string, slug: string): Promise<Collection | null> {
    const [row] = await this.db
      .select()
      .from(shopCollectionsTable)
      .where(
        and(
          eq(shopCollectionsTable.shopId, shopId),
          eq(shopCollectionsTable.slug, slug),
          eq(shopCollectionsTable.isActive, true),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listByShop(
    shopId: string,
    pagination: Pagination,
  ): Promise<{ items: Collection[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const where = and(
      eq(shopCollectionsTable.shopId, shopId),
      eq(shopCollectionsTable.isActive, true),
    );

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(shopCollectionsTable)
        .where(where)
        .orderBy(asc(shopCollectionsTable.displayOrder))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(shopCollectionsTable).where(where),
    ]);

    return { items, total };
  }

  async create(data: CollectionInsert): Promise<Collection> {
    const [row] = await this.db
      .insert(shopCollectionsTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<CollectionInsert>,
  ): Promise<Collection | null> {
    const [row] = await this.db
      .update(shopCollectionsTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(shopCollectionsTable.id, id))
      .returning();
    return row ?? null;
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(shopCollectionsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(shopCollectionsTable.id, id));
  }
}

// =============================================================================
// 12. CollectionProductRepository
// =============================================================================

export class CollectionProductRepository {
  constructor(private readonly db: DB) {}

  async listByCollection(collectionId: string): Promise<CollectionProduct[]> {
    return this.db
      .select()
      .from(shopCollectionProductsTable)
      .where(eq(shopCollectionProductsTable.collectionId, collectionId))
      .orderBy(asc(shopCollectionProductsTable.displayOrder));
  }

  async add(data: CollectionProductInsert): Promise<CollectionProduct> {
    const [row] = await this.db
      .insert(shopCollectionProductsTable)
      .values(data)
      .returning();
    return row;
  }

  async remove(collectionId: string, shopProductId: string): Promise<void> {
    await this.db
      .delete(shopCollectionProductsTable)
      .where(
        and(
          eq(shopCollectionProductsTable.collectionId, collectionId),
          eq(shopCollectionProductsTable.shopProductId, shopProductId),
        ),
      );
  }
}

// =============================================================================
// 13. BundleRepository
// =============================================================================

export class BundleRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<Bundle | null> {
    const [row] = await this.db
      .select()
      .from(productBundlesTable)
      .where(
        and(
          eq(productBundlesTable.id, id),
          eq(productBundlesTable.isActive, true),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listByShop(
    shopId: string,
    pagination: Pagination,
  ): Promise<{ items: Bundle[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const where = and(
      eq(productBundlesTable.shopId, shopId),
      eq(productBundlesTable.isActive, true),
    );

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(productBundlesTable)
        .where(where)
        .orderBy(desc(productBundlesTable.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(productBundlesTable).where(where),
    ]);

    return { items, total };
  }

  async create(data: BundleInsert): Promise<Bundle> {
    const [row] = await this.db
      .insert(productBundlesTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<BundleInsert>,
  ): Promise<Bundle | null> {
    const [row] = await this.db
      .update(productBundlesTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(productBundlesTable.id, id))
      .returning();
    return row ?? null;
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(productBundlesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(productBundlesTable.id, id));
  }
}

// =============================================================================
// 14. BundleItemRepository
// =============================================================================

export class BundleItemRepository {
  constructor(private readonly db: DB) {}

  async listByBundle(bundleId: string): Promise<BundleItem[]> {
    return this.db
      .select()
      .from(bundleItemsTable)
      .where(eq(bundleItemsTable.bundleId, bundleId))
      .orderBy(asc(bundleItemsTable.displayOrder));
  }

  async add(data: BundleItemInsert): Promise<BundleItem> {
    const [row] = await this.db
      .insert(bundleItemsTable)
      .values(data)
      .returning();
    return row;
  }

  async remove(id: string): Promise<void> {
    await this.db
      .delete(bundleItemsTable)
      .where(eq(bundleItemsTable.id, id));
  }
}

// =============================================================================
// 15. AnnouncementRepository
// =============================================================================

export class AnnouncementRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<Announcement | null> {
    const [row] = await this.db
      .select()
      .from(shopAnnouncementsTable)
      .where(eq(shopAnnouncementsTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async listActiveByShop(shopId: string): Promise<Announcement[]> {
    const now = new Date();
    return this.db
      .select()
      .from(shopAnnouncementsTable)
      .where(
        and(
          eq(shopAnnouncementsTable.shopId, shopId),
          eq(shopAnnouncementsTable.isActive, true),
          eq(shopAnnouncementsTable.isPublished, true),
          sql`${shopAnnouncementsTable.startDate} <= ${now}`,
          sql`(${shopAnnouncementsTable.endDate} IS NULL OR ${shopAnnouncementsTable.endDate} >= ${now})`,
        ),
      )
      .orderBy(desc(shopAnnouncementsTable.priority));
  }

  async create(data: AnnouncementInsert): Promise<Announcement> {
    const [row] = await this.db
      .insert(shopAnnouncementsTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<AnnouncementInsert>,
  ): Promise<Announcement | null> {
    const [row] = await this.db
      .update(shopAnnouncementsTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(shopAnnouncementsTable.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(shopAnnouncementsTable)
      .where(eq(shopAnnouncementsTable.id, id));
  }
}

// =============================================================================
// 16. QuestionRepository
// =============================================================================

export class QuestionRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<Question | null> {
    const [row] = await this.db
      .select()
      .from(productQuestionsTable)
      .where(eq(productQuestionsTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async listByProduct(
    shopProductId: string,
    pagination: Pagination,
  ): Promise<{ items: Question[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const where = and(
      eq(productQuestionsTable.shopProductId, shopProductId),
      eq(productQuestionsTable.status, "approved"),
    );

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(productQuestionsTable)
        .where(where)
        .orderBy(desc(productQuestionsTable.askedAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(productQuestionsTable)
        .where(where),
    ]);

    return { items, total };
  }

  async create(data: QuestionInsert): Promise<Question> {
    const [row] = await this.db
      .insert(productQuestionsTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<QuestionInsert>,
  ): Promise<Question | null> {
    const [row] = await this.db
      .update(productQuestionsTable)
      .set(clean(data))
      .where(eq(productQuestionsTable.id, id))
      .returning();
    return row ?? null;
  }

  async addVote(data: {
    questionId: string;
    userId: string;
    isHelpful: boolean;
  }): Promise<void> {
    await this.db
      .insert(questionVotesTable)
      .values(data)
      .onConflictDoUpdate({
        target: [questionVotesTable.questionId, questionVotesTable.userId],
        set: { isHelpful: data.isHelpful, votedAt: new Date() },
      });
  }
}

// =============================================================================
// 17. SavedItemRepository
// =============================================================================

export class SavedItemRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<SavedItem | null> {
    const [row] = await this.db
      .select()
      .from(savedForLaterTable)
      .where(eq(savedForLaterTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByUserAndProduct(
    userId: string,
    shopProductId: string,
    shopProductVariantId?: string,
  ): Promise<SavedItem | null> {
    const conditions = [
      eq(savedForLaterTable.userId, userId),
      eq(savedForLaterTable.shopProductId, shopProductId),
    ];
    if (shopProductVariantId) {
      conditions.push(
        eq(savedForLaterTable.shopProductVariantId, shopProductVariantId),
      );
    } else {
      conditions.push(isNull(savedForLaterTable.shopProductVariantId));
    }

    const [row] = await this.db
      .select()
      .from(savedForLaterTable)
      .where(and(...conditions))
      .limit(1);
    return row ?? null;
  }

  async listByUser(
    userId: string,
    pagination: Pagination,
  ): Promise<{ items: SavedItem[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const where = eq(savedForLaterTable.userId, userId);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(savedForLaterTable)
        .where(where)
        .orderBy(desc(savedForLaterTable.savedAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(savedForLaterTable).where(where),
    ]);

    return { items, total };
  }

  async create(data: SavedItemInsert): Promise<SavedItem> {
    const [row] = await this.db
      .insert(savedForLaterTable)
      .values(data)
      .returning();
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(savedForLaterTable)
      .where(eq(savedForLaterTable.id, id));
  }
}

// =============================================================================
// 18. PriceHistoryRepository
// =============================================================================

export class PriceHistoryRepository {
  constructor(private readonly db: DB) {}

  async create(data: PriceHistoryInsert): Promise<PriceHistory> {
    const [row] = await this.db
      .insert(productPriceHistoryTable)
      .values(data)
      .returning();
    return row;
  }

  async listByProduct(
    shopProductId: string,
    pagination: Pagination,
  ): Promise<{ items: PriceHistory[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const where = eq(productPriceHistoryTable.shopProductId, shopProductId);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(productPriceHistoryTable)
        .where(where)
        .orderBy(desc(productPriceHistoryTable.effectiveFrom))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(productPriceHistoryTable)
        .where(where),
    ]);

    return { items, total };
  }
}

// =============================================================================
// 19. ProductLinkRepository
// =============================================================================

export class ProductLinkRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<ProductLink | null> {
    const [row] = await this.db
      .select()
      .from(productLinksTable)
      .where(eq(productLinksTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByDirection(
    sourceProductId: string,
    linkedProductId: string,
    linkType: string,
  ): Promise<ProductLink | null> {
    const [row] = await this.db
      .select()
      .from(productLinksTable)
      .where(
        and(
          eq(productLinksTable.sourceProductId, sourceProductId),
          eq(productLinksTable.linkedProductId, linkedProductId),
          eq(productLinksTable.linkType, linkType as any),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listBySource(
    sourceProductId: string,
    linkType?: string,
  ): Promise<ProductLink[]> {
    const conditions = [
      eq(productLinksTable.sourceProductId, sourceProductId),
      eq(productLinksTable.isActive, true),
    ];
    if (linkType) {
      conditions.push(eq(productLinksTable.linkType, linkType as any));
    }

    return this.db
      .select()
      .from(productLinksTable)
      .where(and(...conditions))
      .orderBy(asc(productLinksTable.displayOrder));
  }

  async listByShop(
    shopId: string,
    pagination: Pagination,
  ): Promise<{ items: ProductLink[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const where = and(
      eq(productLinksTable.shopId, shopId),
      eq(productLinksTable.isActive, true),
    );

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(productLinksTable)
        .where(where)
        .orderBy(desc(productLinksTable.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(productLinksTable).where(where),
    ]);

    return { items, total };
  }

  async create(data: ProductLinkInsert): Promise<ProductLink> {
    const [row] = await this.db
      .insert(productLinksTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<ProductLinkInsert>,
  ): Promise<ProductLink | null> {
    const [row] = await this.db
      .update(productLinksTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(productLinksTable.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(productLinksTable)
      .where(eq(productLinksTable.id, id));
  }
}

// =============================================================================
// 20. DailyPickRepository
// =============================================================================

export class DailyPickRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<DailyPickRow | null> {
    const [row] = await this.db
      .select()
      .from(dailyPicksTable)
      .where(eq(dailyPicksTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByDate(shopId: string, pickDate: string): Promise<DailyPickRow | null> {
    const [row] = await this.db
      .select()
      .from(dailyPicksTable)
      .where(
        and(
          eq(dailyPicksTable.shopId, shopId),
          eq(dailyPicksTable.pickDate, pickDate),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async getToday(shopId: string): Promise<DailyPickRow | null> {
    const today = new Date().toISOString().split("T")[0];
    return this.findByDate(shopId, today);
  }

  async listByShop(
    shopId: string,
    pagination: Pagination,
  ): Promise<{ items: DailyPickRow[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const where = eq(dailyPicksTable.shopId, shopId);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(dailyPicksTable)
        .where(where)
        .orderBy(desc(dailyPicksTable.pickDate))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(dailyPicksTable).where(where),
    ]);

    return { items, total };
  }

  async create(data: DailyPickInsert): Promise<DailyPickRow> {
    const [row] = await this.db
      .insert(dailyPicksTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<DailyPickInsert>,
  ): Promise<DailyPickRow | null> {
    const [row] = await this.db
      .update(dailyPicksTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(dailyPicksTable.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(dailyPicksTable)
      .where(eq(dailyPicksTable.id, id));
  }
}

// =============================================================================
// 21. DailyPickProductRepository
// =============================================================================

export class DailyPickProductRepository {
  constructor(private readonly db: DB) {}

  async listByPick(dailyPickId: string): Promise<DailyPickProduct[]> {
    return this.db
      .select()
      .from(dailyPickProductsTable)
      .where(eq(dailyPickProductsTable.dailyPickId, dailyPickId))
      .orderBy(asc(dailyPickProductsTable.displayOrder));
  }

  async countByPick(dailyPickId: string): Promise<number> {
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(dailyPickProductsTable)
      .where(eq(dailyPickProductsTable.dailyPickId, dailyPickId));
    return total;
  }

  async findByPickAndProduct(
    dailyPickId: string,
    shopProductId: string,
  ): Promise<DailyPickProduct | null> {
    const [row] = await this.db
      .select()
      .from(dailyPickProductsTable)
      .where(
        and(
          eq(dailyPickProductsTable.dailyPickId, dailyPickId),
          eq(dailyPickProductsTable.shopProductId, shopProductId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async add(data: DailyPickProductInsert): Promise<DailyPickProduct> {
    const [row] = await this.db
      .insert(dailyPickProductsTable)
      .values(data)
      .returning();
    return row;
  }

  async remove(dailyPickId: string, shopProductId: string): Promise<void> {
    await this.db
      .delete(dailyPickProductsTable)
      .where(
        and(
          eq(dailyPickProductsTable.dailyPickId, dailyPickId),
          eq(dailyPickProductsTable.shopProductId, shopProductId),
        ),
      );
  }
}

// =============================================================================
// 22. CouponRepository
// =============================================================================

export class CouponRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<CouponRow | null> {
    const [row] = await this.db
      .select()
      .from(shopCouponsTable)
      .where(eq(shopCouponsTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByCode(shopId: string, code: string): Promise<CouponRow | null> {
    const [row] = await this.db
      .select()
      .from(shopCouponsTable)
      .where(
        and(
          eq(shopCouponsTable.shopId, shopId),
          eq(shopCouponsTable.code, code),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listByShop(
    shopId: string,
    pagination: Pagination,
    filters?: { status?: string },
  ): Promise<{ items: CouponRow[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);
    const conditions = [eq(shopCouponsTable.shopId, shopId)];

    if (filters?.status) {
      conditions.push(eq(shopCouponsTable.status, filters.status as any));
    }

    const where = and(...conditions);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(shopCouponsTable)
        .where(where)
        .orderBy(desc(shopCouponsTable.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(shopCouponsTable).where(where),
    ]);

    return { items, total };
  }

  async create(data: CouponInsert): Promise<CouponRow> {
    const [row] = await this.db
      .insert(shopCouponsTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<CouponInsert>,
  ): Promise<CouponRow | null> {
    const [row] = await this.db
      .update(shopCouponsTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(shopCouponsTable.id, id))
      .returning();
    return row ?? null;
  }

  async incrementUsage(id: string): Promise<void> {
    await this.db
      .update(shopCouponsTable)
      .set({
        usageCount: sql`${shopCouponsTable.usageCount} + 1`,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shopCouponsTable.id, id));
  }

  async deactivate(id: string): Promise<void> {
    await this.db
      .update(shopCouponsTable)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(shopCouponsTable.id, id));
  }
}

// =============================================================================
// 23. CouponAssociationRepository
// =============================================================================

export class CouponAssociationRepository {
  constructor(private readonly db: DB) {}

  // ── Products ──
  async addProduct(data: CouponProductInsert): Promise<CouponProduct> {
    const [row] = await this.db
      .insert(couponProductsTable)
      .values(data)
      .returning();
    return row;
  }

  async removeProduct(couponId: string, productId: string): Promise<void> {
    await this.db
      .delete(couponProductsTable)
      .where(
        and(
          eq(couponProductsTable.couponId, couponId),
          eq(couponProductsTable.productId, productId),
        ),
      );
  }

  async listProducts(couponId: string): Promise<CouponProduct[]> {
    return this.db
      .select()
      .from(couponProductsTable)
      .where(eq(couponProductsTable.couponId, couponId));
  }

  // ── Collections ──
  async addCollection(data: CouponCollectionInsert): Promise<CouponCollection> {
    const [row] = await this.db
      .insert(couponCollectionsTable)
      .values(data)
      .returning();
    return row;
  }

  async removeCollection(couponId: string, collectionId: string): Promise<void> {
    await this.db
      .delete(couponCollectionsTable)
      .where(
        and(
          eq(couponCollectionsTable.couponId, couponId),
          eq(couponCollectionsTable.collectionId, collectionId),
        ),
      );
  }

  // ── Categories ──
  async addCategory(data: CouponCategoryInsert): Promise<CouponCategory> {
    const [row] = await this.db
      .insert(couponCategoriesTable)
      .values(data)
      .returning();
    return row;
  }

  async removeCategory(couponId: string, categoryId: string): Promise<void> {
    await this.db
      .delete(couponCategoriesTable)
      .where(
        and(
          eq(couponCategoriesTable.couponId, couponId),
          eq(couponCategoriesTable.categoryId, categoryId),
        ),
      );
  }
}

// =============================================================================
// 24. CouponValidationRepository
// =============================================================================

export class CouponValidationRepository {
  constructor(private readonly db: DB) {}

  async record(data: CouponValidationInsert): Promise<CouponValidation> {
    const [row] = await this.db
      .insert(couponValidationAttemptsTable)
      .values(data)
      .returning();
    return row;
  }

  async countRecentByUser(
    userId: string,
    windowMinutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60_000);
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(couponValidationAttemptsTable)
      .where(
        and(
          eq(couponValidationAttemptsTable.userId, userId),
          sql`${couponValidationAttemptsTable.attemptedAt} >= ${since}`,
        ),
      );
    return total;
  }

  async countUsageByUser(couponId: string, userId: string): Promise<number> {
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(couponUsageHistoryTable)
      .where(
        and(
          eq(couponUsageHistoryTable.couponId, couponId),
          eq(couponUsageHistoryTable.userId, userId),
          eq(couponUsageHistoryTable.isSuccessful, true),
        ),
      );
    return total;
  }
}
