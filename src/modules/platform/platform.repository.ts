import {
  and,
  desc,
  eq,
  isNotNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { DB } from "../../db/index";

import {
  citiesTable,
  serviceablePincodesTable,
} from "../../db/schema";

// =============================================================================
// ROW TYPES
// =============================================================================

type City = InferSelectModel<typeof citiesTable>;
type CityInsert = InferInsertModel<typeof citiesTable>;
type CityUpdate = Partial<CityInsert>;

type ServiceablePincode = InferSelectModel<typeof serviceablePincodesTable>;
type ServiceablePincodeInsert = InferInsertModel<typeof serviceablePincodesTable>;
type ServiceablePincodeUpdate = Partial<ServiceablePincodeInsert>;

// =============================================================================
// HELPERS
// =============================================================================

function applyPagination(limit: number, page: number) {
  return { limit, offset: (page - 1) * limit };
}

/** Strip undefined values so Drizzle does not emit NULL for omitted fields. */
function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

// =============================================================================
// 1 — CITY REPOSITORY
// =============================================================================

export class CityRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<City | null> {
    const [row] = await this.db
      .select()
      .from(citiesTable)
      .where(eq(citiesTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findBySlug(slug: string): Promise<City | null> {
    const [row] = await this.db
      .select()
      .from(citiesTable)
      .where(eq(citiesTable.slug, slug))
      .limit(1);

    return row ?? null;
  }

  async list(opts: {
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: City[]; total: number }> {
    const conditions = opts.activeOnly ? [eq(citiesTable.isActive, true)] : [];
    const { limit, offset } = applyPagination(opts.limit ?? 50, opts.page ?? 1);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(citiesTable)
      .where(conditions.length ? and(...conditions) : undefined);

    const items = await this.db
      .select()
      .from(citiesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(citiesTable.name)
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  async listByState(state: string, opts: { activeOnly?: boolean } = {}): Promise<City[]> {
    const conditions = [eq(citiesTable.state, state)];
    if (opts.activeOnly) conditions.push(eq(citiesTable.isActive, true));

    return this.db
      .select()
      .from(citiesTable)
      .where(and(...conditions))
      .orderBy(citiesTable.name);
  }

  async create(data: CityInsert): Promise<City> {
    const [row] = await this.db
      .insert(citiesTable)
      .values({ ...data, slug: data.slug.toLowerCase() })
      .returning();

    return row;
  }

  async update(id: string, data: CityUpdate): Promise<City | null> {
    const [row] = await this.db
      .update(citiesTable)
      .set({
        ...clean(data),
        ...(data.slug ? { slug: data.slug.toLowerCase() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(citiesTable.id, id))
      .returning();

    return row ?? null;
  }

  async setActive(id: string, isActive: boolean): Promise<City | null> {
    const [row] = await this.db
      .update(citiesTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(citiesTable.id, id))
      .returning();

    return row ?? null;
  }
}

// =============================================================================
// 2 — SERVICEABLE PINCODE REPOSITORY
// =============================================================================

export class ServiceablePincodeRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<ServiceablePincode | null> {
    const [row] = await this.db
      .select()
      .from(serviceablePincodesTable)
      .where(eq(serviceablePincodesTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByPincode(pincode: string): Promise<ServiceablePincode | null> {
    const [row] = await this.db
      .select()
      .from(serviceablePincodesTable)
      .where(eq(serviceablePincodesTable.pincode, pincode))
      .limit(1);

    return row ?? null;
  }

  async findActiveByPincode(pincode: string): Promise<ServiceablePincode | null> {
    const [row] = await this.db
      .select()
      .from(serviceablePincodesTable)
      .where(
        and(
          eq(serviceablePincodesTable.pincode, pincode),
          eq(serviceablePincodesTable.isActive, true),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listByCity(
    cityId: string,
    opts: { activeOnly?: boolean; page?: number; limit?: number } = {},
  ): Promise<{ items: ServiceablePincode[]; total: number }> {
    const conditions = [eq(serviceablePincodesTable.cityId, cityId)];
    if (opts.activeOnly)
      conditions.push(eq(serviceablePincodesTable.isActive, true));

    const { limit, offset } = applyPagination(opts.limit ?? 50, opts.page ?? 1);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceablePincodesTable)
      .where(and(...conditions));

    const items = await this.db
      .select()
      .from(serviceablePincodesTable)
      .where(and(...conditions))
      .orderBy(serviceablePincodesTable.pincode)
      .limit(limit)
      .offset(offset);

    return { items, total: countRow?.count ?? 0 };
  }

  /**
   * Checks whether a GPS coordinate falls within any active serviceable pincode
   * boundary using ST_Within. Requires GIST index on `boundary`.
   */
  async findByCoordinates(
    lat: number,
    lng: number,
  ): Promise<ServiceablePincode | null> {
    const [row] = await this.db
      .select()
      .from(serviceablePincodesTable)
      .where(
        and(
          eq(serviceablePincodesTable.isActive, true),
          isNotNull(serviceablePincodesTable.boundary),
          sql`ST_Within(
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geometry,
            ${serviceablePincodesTable.boundary}::geometry
          )`,
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async create(data: ServiceablePincodeInsert): Promise<ServiceablePincode> {
    const [row] = await this.db
      .insert(serviceablePincodesTable)
      .values(data)
      .returning();

    return row;
  }

  async update(
    id: string,
    data: ServiceablePincodeUpdate,
  ): Promise<ServiceablePincode | null> {
    const [row] = await this.db
      .update(serviceablePincodesTable)
      .set({ ...clean(data), updatedAt: new Date() })
      .where(eq(serviceablePincodesTable.id, id))
      .returning();

    return row ?? null;
  }

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<ServiceablePincode | null> {
    const [row] = await this.db
      .update(serviceablePincodesTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(serviceablePincodesTable.id, id))
      .returning();

    return row ?? null;
  }
}
