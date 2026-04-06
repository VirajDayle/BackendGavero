/**
 * modules/shop/shop.repository.ts
 *
 * Data-access layer for the shop module.
 */

import { and, desc, eq, gt, gte, isNull, lt, or, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { DB } from "../../db/index";
import type { Pagination } from "./shop.schema";
import { clean, applyPagination } from "../../shared";

import {
  shopBranchesTable,
  preCategoriesTable,
  shopHolidaysTable,
  shopHoursTable,
  shopsTable,
  shopTypeTable,
} from "../../db/schema";

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

type Shop = InferSelectModel<typeof shopsTable>;
type ShopInsert = InferInsertModel<typeof shopsTable>;
type ShopUpdate = Partial<ShopInsert>;

type Branch = InferSelectModel<typeof shopBranchesTable>;
type BranchInsert = InferInsertModel<typeof shopBranchesTable>;
type BranchUpdate = Partial<BranchInsert>;

type ShopType = InferSelectModel<typeof shopTypeTable>;
type ShopTypeInsert = InferInsertModel<typeof shopTypeTable>;

type ShopCategory = InferSelectModel<typeof preCategoriesTable>;
type ShopCategoryInsert = InferInsertModel<typeof preCategoriesTable>;

type OperatingHours = InferSelectModel<typeof shopHoursTable>;
type OperatingHoursInsert = InferInsertModel<typeof shopHoursTable>;


// ---------------------------------------------------------------------------
// 1. ShopRepository
// ---------------------------------------------------------------------------

export class ShopRepository {
  constructor(private readonly db: DB) { }

  async findById(id: string, opts: { includeDeleted?: boolean } = {}): Promise<Shop | null> {
    const conditions = [eq(shopsTable.id, id)];
    if (!opts.includeDeleted) conditions.push(isNull(shopsTable.deletedAt));

    const [row] = await this.db
      .select()
      .from(shopsTable)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  async findBySlug(slug: string, opts: { includeDeleted?: boolean } = {}): Promise<Shop | null> {
    const conditions = [eq(shopsTable.slug, slug)];
    if (!opts.includeDeleted) conditions.push(isNull(shopsTable.deletedAt));

    const [row] = await this.db
      .select()
      .from(shopsTable)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  async findByUsername(username: string): Promise<Shop | null> {
    const [row] = await this.db
      .select()
      .from(shopsTable)
      .where(and(eq(shopsTable.username, username), isNull(shopsTable.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  async list(pagination: Pagination): Promise<{ items: Shop[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(shopsTable)
      .where(isNull(shopsTable.deletedAt));

    const items = await this.db
      .select()
      .from(shopsTable)
      .where(isNull(shopsTable.deletedAt))
      .orderBy(desc(shopsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  async create(data: ShopInsert): Promise<Shop> {
    const [row] = await this.db
      .insert(shopsTable)
      .values(data)
      .returning();

    return row;
  }

  async update(
    id: string,
    data: ShopUpdate & {
      latitude?: number;
      longitude?: number;
      h3?: { res7: string; res9: string };
    },
  ): Promise<Shop | null> {
    const { latitude, longitude, h3, ...rest } = data;
    const updateData: any = { ...clean(rest), updatedAt: new Date() };

    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;
    }

    if (h3) {
      updateData.h3IndexRes7 = h3.res7;
      updateData.h3IndexRes9 = h3.res9;
    }

    const [row] = await this.db
      .update(shopsTable)
      .set(updateData)
      .where(and(eq(shopsTable.id, id), isNull(shopsTable.deletedAt)))
      .returning();

    return row ?? null;
  }

  async softDelete(id: string): Promise<Shop | null> {
    const [row] = await this.db
      .update(shopsTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(shopsTable.id, id), isNull(shopsTable.deletedAt)))
      .returning();

    return row ?? null;
  }
}

// ---------------------------------------------------------------------------
// 2. BranchRepository
// ---------------------------------------------------------------------------

export class BranchRepository {
  constructor(private readonly db: DB) { }

  async findById(id: string, opts: { includeDeleted?: boolean } = {}): Promise<Branch | null> {
    const conditions = [eq(shopBranchesTable.id, id)];
    if (!opts.includeDeleted) conditions.push(isNull(shopBranchesTable.deletedAt));

    const [row] = await this.db
      .select()
      .from(shopBranchesTable)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  async listByShop(shopId: string): Promise<Branch[]> {
    return this.db
      .select()
      .from(shopBranchesTable)
      .where(and(eq(shopBranchesTable.shopId, shopId), isNull(shopBranchesTable.deletedAt)))
      .orderBy(shopBranchesTable.name);
  }

  async create(
    data: BranchInsert & {
      latitude: number;
      longitude: number;
      h3?: { res7: string; res9: string };
    },
  ): Promise<Branch> {
    const { latitude, longitude, h3, ...rest } = data;
    const [row] = await this.db
      .insert(shopBranchesTable)
      .values({
        ...rest,
        location: sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`,
        h3IndexRes7: h3?.res7,
        h3IndexRes9: h3?.res9,
      } as any)
      .returning();

    return row;
  }

  async update(
    id: string,
    data: BranchUpdate & {
      latitude?: number;
      longitude?: number;
      h3?: { res7: string; res9: string };
    },
  ): Promise<Branch | null> {
    const { latitude, longitude, h3, ...rest } = data;
    const updateData: any = { ...clean(rest), updatedAt: new Date() };

    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;
    }

    if (h3) {
      updateData.h3IndexRes7 = h3.res7;
      updateData.h3IndexRes9 = h3.res9;
    }

    const [row] = await this.db
      .update(shopBranchesTable)
      .set(updateData)
      .where(and(eq(shopBranchesTable.id, id), isNull(shopBranchesTable.deletedAt)))
      .returning();

    return row ?? null;
  }

  async delete(id: string): Promise<Branch | null> {
    const [row] = await this.db
      .update(shopBranchesTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(shopBranchesTable.id, id), isNull(shopBranchesTable.deletedAt)))
      .returning();

    return row ?? null;
  }
}

// ---------------------------------------------------------------------------
// 3. ShopTypeRepository
// ---------------------------------------------------------------------------

export class ShopTypeRepository {
  constructor(private readonly db: DB) { }

  async list(): Promise<ShopType[]> {
    return this.db.select().from(shopTypeTable).orderBy(shopTypeTable.name);
  }

  async findById(id: string): Promise<ShopType | null> {
    const [row] = await this.db
      .select()
      .from(shopTypeTable)
      .where(eq(shopTypeTable.id, id))
      .limit(1);
    return row ?? null;
  }
}

// ---------------------------------------------------------------------------
// 4. CategoryRepository
// ---------------------------------------------------------------------------

export class CategoryRepository {
  constructor(private readonly db: DB) { }

  async list(): Promise<ShopCategory[]> {
    return this.db
      .select()
      .from(preCategoriesTable)
      .orderBy(preCategoriesTable.sortOrder, preCategoriesTable.name);
  }

  async findById(id: string): Promise<ShopCategory | null> {
    const [row] = await this.db
      .select()
      .from(preCategoriesTable)
      .where(eq(preCategoriesTable.id, id))
      .limit(1);
    return row ?? null;
  }
}

// ---------------------------------------------------------------------------
// 5. HoursRepository
// ---------------------------------------------------------------------------

export class HoursRepository {
  constructor(private readonly db: DB) { }

  async listByShop(shopId: string): Promise<OperatingHours[]> {
    return this.db
      .select()
      .from(shopHoursTable)
      .where(eq(shopHoursTable.shopId, shopId))
      .orderBy(shopHoursTable.dayOfWeek);
  }

  async upsert(data: OperatingHoursInsert, tx?: DB | any): Promise<OperatingHours> {
    const db = tx ?? this.db;
    const [row] = await db
      .insert(shopHoursTable)
      .values(data)
      .onConflictDoUpdate({
        target: [shopHoursTable.shopId, shopHoursTable.dayOfWeek],
        set: {
          openTime: data.openTime,
          closeTime: data.closeTime,
          isClosed: data.isClosed ?? false,
          isOvernight: data.isOvernight ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();

    return row;
  }
}
