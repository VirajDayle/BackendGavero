import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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

    boundary: geographyPolygon("boundary"),

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
