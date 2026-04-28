/**
 * platform.repository.ts
 *
 * Data-access layer — one repository class per domain aggregate.
 */

import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { DB } from "../../db/index";

import {
  citiesTable,
  serviceableH3ZonesTable,
} from "../../db/schema";

import type {
  CityInsert,
  ServiceableH3Zone,
  ServiceableH3ZoneInsert,
  ServiceablePincodeInsert,
} from "../../db/schema";

import type { Pagination } from "../../shared";
import { clean, applyPagination, applyCursorPagination } from "../../shared";
import type { CityMapItem, CityPublic } from "./platform.schema";

// =============================================================================
// Shared types
// =============================================================================

export type ActiveFilter = "all" | "active" | "inactive";

type CityUpdate = Partial<CityInsert>;
type ServiceableH3ZoneUpdate = Partial<ServiceableH3ZoneInsert>;


// =============================================================================
// Helpers
// =============================================================================

const cityPublicColumns = {
  id: citiesTable.id,
  name: citiesTable.name,
  slug: citiesTable.slug,
  state: citiesTable.state,
  stateCode: citiesTable.stateCode,
  district: citiesTable.district,
  country: citiesTable.country,
  countryCode: citiesTable.countryCode,
  isActive: citiesTable.isActive,
  centroidLat: citiesTable.centroidLat,
  centroidLng: citiesTable.centroidLng,
  timezone: citiesTable.timezone,
  launchedAt: citiesTable.launchedAt,
  metadata: sql<Record<string, unknown> | null>`${citiesTable.metadata}`,
  createdAt: citiesTable.createdAt,
  updatedAt: citiesTable.updatedAt,
} as const;

/**
 * Builds an isActive condition from an ActiveFilter value.
 * Returns undefined for "all" (no filtering needed).
 */
function activeCondition(
  column: typeof citiesTable.isActive | typeof serviceableH3ZonesTable.isActive,
  filter?: ActiveFilter,
) {
  if (filter === "active") return eq(column, true);
  if (filter === "inactive") return eq(column, false);
  return undefined; // "all" or undefined → no condition
}

// =============================================================================
// 1. CityRepository
// =============================================================================

export class CityRepository {
  constructor(private readonly db: DB) { }

  async findById(id: string): Promise<CityPublic | null> {
    const [row] = await this.db
      .select(cityPublicColumns)
      .from(citiesTable)
      .where(eq(citiesTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findBySlug(slug: string): Promise<CityPublic | null> {
    const [row] = await this.db
      .select(cityPublicColumns)
      .from(citiesTable)
      .where(eq(citiesTable.slug, slug))
      .limit(1);

    return row ?? null;
  }

  async list(
    pagination: Pagination,
    opts: { filter?: ActiveFilter; stateCode?: string } = {},
  ): Promise<{ items: CityPublic[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);

    const cond = activeCondition(citiesTable.isActive, opts.filter);
    const conditions = [];
    if (cond) conditions.push(cond);
    if (opts.stateCode) conditions.push(eq(citiesTable.stateCode, opts.stateCode));
    const baseWhere = conditions.length > 0 ? and(...conditions) : undefined;

    const where = applyCursorPagination(
      citiesTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );
    const orderBy =
      pagination.order === "asc" ? asc(citiesTable.id) : desc(citiesTable.id);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(citiesTable)
      .where(baseWhere);

    const items = await this.db
      .select(cityPublicColumns)
      .from(citiesTable)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  async listWithBoundary(
    pagination: Pagination,
    opts: { filter?: ActiveFilter; stateCode?: string } = {},
  ): Promise<{ items: CityMapItem[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);

    const cond = activeCondition(citiesTable.isActive, opts.filter);
    const conditions = [];
    if (cond) conditions.push(cond);
    if (opts.stateCode) conditions.push(eq(citiesTable.stateCode, opts.stateCode));
    const baseWhere = conditions.length > 0 ? and(...conditions) : undefined;

    const where = applyCursorPagination(
      citiesTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );
    const orderBy =
      pagination.order === "asc" ? asc(citiesTable.id) : desc(citiesTable.id);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(citiesTable)
      .where(baseWhere);

    const rows = await this.db.execute(sql`
      SELECT
        id, name, slug, state, state_code, district, country, country_code,
        is_active, centroid_lat, centroid_lng, timezone, launched_at, metadata,
        created_at, updated_at,
        ST_AsGeoJSON(boundary)::jsonb AS boundary
      FROM cities
      WHERE ${where ?? sql`TRUE`}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `);

    return { items: rows.rows as CityMapItem[], total: countRow?.count ?? 0 };
  }

  // async listByState(
  //   state: string,
  //   opts: { filter?: ActiveFilter } = {},
  // ): Promise<CityPublic[]> {
  //   const conditions = [eq(citiesTable.state, state)];
  //   const cond = activeCondition(citiesTable.isActive, opts.filter);
  //   if (cond) conditions.push(cond);

  //   return this.db
  //     .select(cityPublicColumns)
  //     .from(citiesTable)
  //     .where(and(...conditions))
  //     .orderBy(citiesTable.name);
  // }

  // async listByStateWithBoundary(
  //   state: string,
  //   opts: { filter?: ActiveFilter } = {},
  // ): Promise<CityMapItem[]> {
  //   const conditions = [sql`state = ${state}`];
  //   if (opts.filter === "active") conditions.push(sql`is_active = true`);
  //   if (opts.filter === "inactive") conditions.push(sql`is_active = false`);

  //   const rows = await this.db.execute(sql`
  //     SELECT
  //       id, name, slug, state, state_code, district, country, country_code,
  //       is_active, centroid_lat, centroid_lng, timezone, launched_at, metadata,
  //       created_at, updated_at,
  //       ST_AsGeoJSON(boundary)::jsonb AS boundary
  //     FROM cities
  //     WHERE ${and(...conditions)}
  //   `);

  //   return rows.rows as CityMapItem[];
  // }

  // create/update/setActive re-fetch after write to avoid hex WKB from PostGIS
  async create(data: CityInsert): Promise<CityPublic> {
    const [row] = await this.db
      .insert(citiesTable)
      .values({ ...data, slug: data.slug.toLowerCase() })
      .returning({ id: citiesTable.id });

    return this.findById(row.id) as Promise<CityPublic>;
  }

  async update(id: string, data: CityUpdate): Promise<CityPublic | null> {
    await this.db
      .update(citiesTable)
      .set({
        ...clean(data),
        ...(data.slug ? { slug: data.slug.toLowerCase() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(citiesTable.id, id));

    return this.findById(id);
  }

  async setActive(id: string, isActive: boolean): Promise<CityPublic | null> {
    await this.db
      .update(citiesTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(citiesTable.id, id));

    return this.findById(id);
  }
}

// =============================================================================
// 2. ServiceableH3ZoneRepository
// =============================================================================

export class ServiceableH3ZoneRepository {
  constructor(private readonly db: DB) { }

  async findByH3Index(h3Index: string): Promise<ServiceableH3Zone | null> {
    const [row] = await this.db
      .select()
      .from(serviceableH3ZonesTable)
      .where(
        and(
          eq(serviceableH3ZonesTable.h3Index, h3Index),
          eq(serviceableH3ZonesTable.isActive, true),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findById(id: string): Promise<ServiceableH3Zone | null> {
    const [row] = await this.db
      .select()
      .from(serviceableH3ZonesTable)
      .where(eq(serviceableH3ZonesTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async listByCity(
    cityId: string,
    pagination: Pagination,
    opts: { filter?: ActiveFilter } = {},
  ): Promise<{ items: ServiceableH3Zone[]; total: number }> {
    const { limit, offset } = applyPagination(pagination.limit, pagination.page);

    const conditions = [eq(serviceableH3ZonesTable.cityId, cityId)];
    const cond = activeCondition(serviceableH3ZonesTable.isActive, opts.filter);
    if (cond) conditions.push(cond);

    const baseWhere = and(...conditions);
    const where = applyCursorPagination(
      serviceableH3ZonesTable.id,
      pagination.cursor,
      pagination.order,
      baseWhere,
    );
    const orderBy =
      pagination.order === "asc"
        ? asc(serviceableH3ZonesTable.id)
        : desc(serviceableH3ZonesTable.id);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceableH3ZonesTable)
      .where(baseWhere);

    const items = await this.db
      .select()
      .from(serviceableH3ZonesTable)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  async create(data: ServiceableH3ZoneInsert): Promise<ServiceableH3Zone> {
    const [row] = await this.db
      .insert(serviceableH3ZonesTable)
      .values(data)
      .returning();

    return row;
  }

  async bulkCreate(data: ServiceableH3ZoneInsert[]): Promise<void> {
    if (data.length === 0) return;
    await this.db
      .insert(serviceableH3ZonesTable)
      .values(data)
      .onConflictDoNothing();
  }

  async update(
    id: string,
    data: ServiceableH3ZoneUpdate,
  ): Promise<ServiceableH3Zone | null> {
    const [row] = await this.db
      .update(serviceableH3ZonesTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(serviceableH3ZonesTable.id, id))
      .returning();

    return row ?? null;
  }

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<ServiceableH3Zone | null> {
    const [row] = await this.db
      .update(serviceableH3ZonesTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(serviceableH3ZonesTable.id, id))
      .returning();

    return row ?? null;
  }

  async setActiveByCity(cityId: string, isActive: boolean): Promise<void> {
    await this.db
      .update(serviceableH3ZonesTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(serviceableH3ZonesTable.cityId, cityId));
  }

  async deleteZonesByCityAndLabelPattern(
    cityId: string,
    labelPattern: string,
  ): Promise<void> {
    await this.db
      .delete(serviceableH3ZonesTable)
      .where(
        and(
          eq(serviceableH3ZonesTable.cityId, cityId),
          sql`${serviceableH3ZonesTable.label} LIKE ${labelPattern}`,
        ),
      );
  }
}

// =============================================================================
// 3. ServiceablePincodeRepository
// =============================================================================

// export class ServiceablePincodeRepository {
// constructor(private readonly db: DB) { }

//   async findById(id: string): Promise<ServiceablePincode | null> {
//     const [row] = await this.db
//       .select()
//       .from(serviceablePincodesTable)
//       .where(eq(serviceablePincodesTable.id, id))
//       .limit(1);

//     return row ?? null;
//   }

//   async findByPincode(pincode: string): Promise<ServiceablePincode | null> {
//     const [row] = await this.db
//       .select()
//       .from(serviceablePincodesTable)
//       .where(eq(serviceablePincodesTable.pincode, pincode))
//       .limit(1);

//     return row ?? null;
//   }

//   async findActiveByPincode(pincode: string): Promise<ServiceablePincode | null> {
//     const [row] = await this.db
//       .select()
//       .from(serviceablePincodesTable)
//       .where(
//         and(
//           eq(serviceablePincodesTable.pincode, pincode),
//           eq(serviceablePincodesTable.isActive, true),
//         ),
//       )
//       .limit(1);

//     return row ?? null;
//   }

//   async list(
//     pagination: Pagination,
//     opts: { filter?: ActiveFilter } = {},
//   ): Promise<{ items: ServiceablePincode[]; total: number }> {
//     const { limit, offset } = applyPagination(pagination.limit, pagination.page);

//     const where = applyCursorPagination(
//       serviceablePincodesTable.id,
//       pagination.cursor,
//       pagination.order,
//       baseWhere,
//     );
//     const orderBy =
//       pagination.order === "asc"
//         ? asc(serviceablePincodesTable.id)
//         : desc(serviceablePincodesTable.id);

//     const [countRow] = await this.db
//       .select({ count: sql<number>`count(*)::int` })
//       .from(serviceablePincodesTable)
//       .where(baseWhere);

//     const items = await this.db
//       .select()
//       .from(serviceablePincodesTable)
//       .where(where)
//       .orderBy(orderBy)
//       .limit(limit)
//       .offset(offset);

//     return { items, total: countRow?.count ?? 0 };
//   }

//   async listByCity(
//     cityId: string,
//     pagination: Pagination,
//     opts: { activeOnly?: boolean } = {},
//   ): Promise<{ items: ServiceablePincode[]; total: number }> {
//     const { limit, offset } = applyPagination(pagination.limit, pagination.page);

//     const conditions = [eq(serviceablePincodesTable.cityId, cityId)];
//     if (opts.activeOnly) conditions.push(eq(serviceablePincodesTable.isActive, true));

//     const baseWhere = and(...conditions);
//     const where = applyCursorPagination(
//       serviceablePincodesTable.id,
//       pagination.cursor,
//       pagination.order,
//       baseWhere,
//     );
//     const orderBy =
//       pagination.order === "asc"
//         ? asc(serviceablePincodesTable.id)
//         : desc(serviceablePincodesTable.id);

//     const [countRow] = await this.db
//       .select({ count: sql<number>`count(*)::int` })
//       .from(serviceablePincodesTable)
//       .where(baseWhere);

//     const items = await this.db
//       .select()
//       .from(serviceablePincodesTable)
//       .where(where)
//       .orderBy(orderBy)
//       .limit(limit)
//       .offset(offset);

//     return { items, total: countRow?.count ?? 0 };
//   }

//   async create(data: ServiceablePincodeInsert): Promise<ServiceablePincode> {
//     const [row] = await this.db
//       .insert(serviceablePincodesTable)
//       .values(data)
//       .returning();

//     return row;
//   }

//   async update(
//     id: string,
//     data: ServiceablePincodeUpdate,
//   ): Promise<ServiceablePincode | null> {
//     const [row] = await this.db
//       .update(serviceablePincodesTable)
//       .set({ ...clean(data), updatedAt: new Date() })
//       .where(eq(serviceablePincodesTable.id, id))
//       .returning();

//     return row ?? null;
//   }

//   async setActive(
//     id: string,
//     isActive: boolean,
//   ): Promise<ServiceablePincode | null> {
//     const [row] = await this.db
//       .update(serviceablePincodesTable)
//       .set({ isActive, updatedAt: new Date() })
//       .where(eq(serviceablePincodesTable.id, id))
//       .returning();

//     return row ?? null;
//   }
// }