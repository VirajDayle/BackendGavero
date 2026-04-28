import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { sql, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { geographyPolygon } from "../shared/types";

// =============================================================================
// CITIES & SERVICEABLE PINCODES
// =============================================================================

export const citiesTable = table(
  "cities",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 100 }).notNull(),
    slug: t.varchar("slug", { length: 120 }).notNull(),
    district: t.varchar("district", { length: 100 }),
    state: t.varchar("state", { length: 100 }).notNull(),

    // ISO 3166-2 e.g. "MP" for Madhya Pradesh
    stateCode: t.varchar("state_code", { length: 3 }),

    country: t.varchar("country", { length: 100 }).default("India").notNull(),

    // ISO 3166-1 alpha-2
    countryCode: t.char("country_code", { length: 2 }).default("IN").notNull(),

    // Plain floats for map centring — no spatial queries needed on centroid
    centroidLat: t.doublePrecision("centroid_lat"),
    centroidLng: t.doublePrecision("centroid_lng"),
    boundary: geographyPolygon("boundary").notNull(),

    timezone: t
      .varchar("timezone", { length: 60 })
      .default("Asia/Kolkata")
      .notNull(),

    isActive: t.boolean("is_active").default(true).notNull(),
    launchedAt: t.timestamp("launched_at", { withTimezone: true }),

    metadata: t.jsonb("metadata").default(sql`'{}'::jsonb`),

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
    t.uniqueIndex("cities_slug_uq_idx").on(tbl.slug),
    t.index("cities_state_idx").on(tbl.state),
    t.index("cities_active_idx").on(tbl.isActive),

    t.check(
      "cities_centroid_lat_chk",
      sql`centroid_lat IS NULL OR (centroid_lat BETWEEN -90 AND 90)`,
    ),
    t.check(
      "cities_centroid_lng_chk",
      sql`centroid_lng IS NULL OR (centroid_lng BETWEEN -180 AND 180)`,
    ),
  ],
);

// =============================================================================
// SERVICEABLE H3 ZONES  — primary serviceability gate (r7 cells)
//
// Each row represents one H3 resolution-7 hexagonal cell (~5 km²) that
// the platform actively services. Serviceability is determined by a single
// B-tree lookup: h3.latLngToCell(lat, lng, 7) → findByH3Index().
// No PostGIS geometry math on the hot path.
// =============================================================================

export const serviceableH3ZonesTable = table(
  "serviceable_h3_zones",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    // H3 index of resolutio 8
    h3Index: t.varchar("h3_index", { length: 15 }).notNull(),

    cityId: t
      .uuid("city_id")
      .notNull()
      .references(() => citiesTable.id, { onDelete: "cascade" }),

    // Human-readable label for admin UI e.g. "Koramangala", "Bandra West"
    label: t.varchar("label", { length: 150 }),

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
    // One zone per H3 cell — globally unique
    t.uniqueIndex("serviceable_h3_zones_h3_uq_idx").on(tbl.h3Index),

    // Hot path: city + active filter for admin listing
    t.index("serviceable_h3_zones_city_active_idx").on(tbl.cityId, tbl.isActive),

    // Admin: all zones for a city
    t.index("serviceable_h3_zones_city_idx").on(tbl.cityId),
  ],
);

// =============================================================================
// SERVICEABLE PINCODES  — metadata reference only (NOT the serviceability gate)
//
// Used post-serviceability for displaying locality names, delivery lead times,
// and address enrichment. Do NOT use for serviceability checks — use
// serviceable_h3_zones for that.
// =============================================================================

export const serviceablePincodesTable = table(
  "serviceable_pincodes",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    pincode: t.varchar("pincode", { length: 10 }).notNull(),

    cityId: t
      .uuid("city_id")
      .notNull()
      .references(() => citiesTable.id, { onDelete: "restrict" }),

    localityName: t.varchar("locality_name", { length: 150 }),

    // boundary column removed — serviceability is now H3-based.
    // PostGIS ST_Within queries are no longer on the hot path.

    isActive: t.boolean("is_active").default(true).notNull(),
    deliveryLeadTimeMins: t.smallint("delivery_lead_time_mins"),

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
    t.uniqueIndex("serviceable_pincodes_pincode_uq_idx").on(tbl.pincode),
    t.index("serviceable_pincodes_city_idx").on(tbl.cityId),
    t.index("serviceable_pincodes_active_idx").on(tbl.isActive),
  ],
);
// =============================================================================
// Model Types
// =============================================================================

export type City = InferSelectModel<typeof citiesTable>;
export type CityInsert = InferInsertModel<typeof citiesTable>;

export type ServiceableH3Zone = InferSelectModel<typeof serviceableH3ZonesTable>;
export type ServiceableH3ZoneInsert = InferInsertModel<typeof serviceableH3ZonesTable>;

export type ServiceablePincode = InferSelectModel<typeof serviceablePincodesTable>;
export type ServiceablePincodeInsert = InferInsertModel<typeof serviceablePincodesTable>;
