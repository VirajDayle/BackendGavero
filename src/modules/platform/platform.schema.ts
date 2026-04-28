/**
 * platform.schema.ts
 *
 * ⚠️  SINGLE SOURCE OF TRUTH for the Platform module.
 *
 * All TypeBox route schemas, TS types, Zod cross-field schemas, and response-shaping
 * mappers live here.
 *
 * Import rules:
 *  - platform.routes.ts     → imports TypeBox schemas (XxxBody / XxxQuery)
 *  - platform.controller.ts → imports TS types
 *  - platform.service.ts    → imports TS types + Zod schemas
 */

import { t, type Static } from "elysia";
import { z } from "zod";
import type { City, ServiceableH3Zone } from "../../db/schema";
import { PaginationQuerySchema } from "../../shared";
import type { Polygon } from "geojson";

// ─────────────────────────────────────────────────────────────────────────────
// 0. Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts an `as const` string array into a TypeBox t.Union of t.Literal.
 */
function toUnion<T extends readonly string[]>(arr: T) {
  return t.Union(arr.map((v) => t.Literal(v)) as any);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Shared TypeBox primitives
// ─────────────────────────────────────────────────────────────────────────────

/** UUID parameter for resource lookups */
export const UUIDParam = t.Object({
  id: t.String({ format: "uuid" }),
});

/** UUID parameter for city-scoped lookups */
export const CityIdParam = t.Object({
  cityId: t.String({ format: "uuid" }),
});

/** Generic activation toggle */
export const SetActiveBody = t.Object({
  isActive: t.Boolean(),
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Route body / param schemas (TypeBox)
// ─────────────────────────────────────────────────────────────────────────────

// ── Geolocation ──────────────────────────────────────────────────────────────

/** Query for reverse geocoding coordinates */
export const ReverseGeocodeQuery = t.Object({
  lat: t.Numeric({
    description: "Latitude coordinate",
    minimum: -90,
    maximum: 90,
  }),
  lng: t.Numeric({
    description: "Longitude coordinate",
    minimum: -180,
    maximum: 180,
  }),
});

/** Query for geocoding a raw address string */
export const GeocodeQuery = t.Object({
  address: t.String({
    description: "Address string to geocode into coordinates",
    minLength: 3,
  }),
});

/** Query for address autocomplete suggestions */
export const AutocompleteQuery = t.Object({
  input: t.String({
    description: "Partial input to fetch address autocomplete suggestions",
    minLength: 2,
  }),
  sessionToken: t.Optional(
    t.String({
      description: "UUID for grouping suggests and retrieve into one session",
      format: "uuid",
    }),
  ),
});

/** Parameter for retrieving specific place details */
export const RetrieveParam = t.Object({
  mapboxId: t.String({
    description: "The mapbox_id to retrieve details for",
    minLength: 1,
  }),
});

/** Query for place detail retrieval (supports session tracking) */
export const RetrieveQuery = t.Object({
  sessionToken: t.Optional(
    t.String({
      description: "UUID for grouping suggests and retrieve into one session",
      format: "uuid",
    }),
  ),
});

/** Parameter for Indian Bank IFSC lookup */
export const IfscParam = t.Object({
  ifsc: t.String({
    description: "The 11-character Indian Financial System Code (IFSC)",
    pattern: "^[A-Z]{4}0[A-Z0-9]{6}$",
    default: "HDFC0000001",
    error: "Invalid IFSC code format",
  }),
});

// ── Cities ────────────────────────────────────────────────────────────────────

/** Body for creating a new city */
export const CreateCityBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  slug: t.String({ minLength: 1, maxLength: 120, pattern: "^[a-z0-9-]+$" }),
  state: t.String({ minLength: 1, maxLength: 100 }),
  district: t.Optional(t.String({ maxLength: 100 })),
  stateCode: t.Optional(t.String({ minLength: 1, maxLength: 3 })),
  countryCode: t.Optional(t.String({ minLength: 2, maxLength: 2 })),
  centroidLat: t.Optional(t.Number({ minimum: -90, maximum: 90 })),
  centroidLng: t.Optional(t.Number({ minimum: -180, maximum: 180 })),
  timezone: t.Optional(t.String({ minLength: 1, maxLength: 60 })),
  metadata: t.Optional(t.Record(t.String(), t.Unknown())),

  boundary: t.Object({
    type: t.Literal("Polygon"),
    coordinates: t.Array(
      t.Array(
        t.Tuple([
          t.Number({ minimum: -180, maximum: 180 }), // lng
          t.Number({ minimum: -90, maximum: 90 }),   // lat
        ])
      )
    ),
  }),
});

/** Body for updating an existing city */
export const UpdateCityBody = t.Partial(CreateCityBody);

/** Query for listing cities with optional state filtering */
export const CityListQuerySchema = t.Object({
  ...PaginationQuerySchema.properties,
  filter: t.Optional(
    t.Union([t.Literal("all"), t.Literal("active"), t.Literal("inactive")], {
      default: "all",
    })
  ),
  stateCode: t.Optional(t.String()),
});

/** Parameter for lookup by either UUID or URL slug */
export const CityGetByIdOrSlugParamSchema = t.Object({
  idOrSlug: t.String(),
});

// ── Zones (H3) ───────────────────────────────────────────────────────────────

/** Body for checking serviceability at a specific point */
export const ServiceabilityCheckBody = t.Object({
  latitude: t.Numeric({ minimum: -90, maximum: 90 }),
  longitude: t.Numeric({ minimum: -180, maximum: 180 }),
});

/** Body for manual creation of a single H3 zone */
export const CreateZoneBody = t.Object({
  h3Index: t.String({ minLength: 15, maxLength: 15 }),
  cityId: t.String({ format: "uuid" }),
  label: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
});

/** Body for updating zone metadata (h3Index/cityId remain immutable) */
export const UpdateZoneBody = t.Partial(
  t.Omit(CreateZoneBody, ["cityId", "h3Index"]),
);

/** Body for bulk creation of H3 zones from a polygon */
export const PolyfillZoneBody = t.Object({
  cityId: t.String({ format: "uuid" }),
  boundary: t.Object({
    type: t.Literal("Polygon"),
    coordinates: t.Array(
      t.Array(
        t.Tuple([
          t.Number({ minimum: -180, maximum: 180 }), // lng
          t.Number({ minimum: -90, maximum: 90 }),   // lat
        ])
      )
    ),
  }),
  label: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
});

/** Body for syncing city zones with a polygon boundary */
export const SyncZoneWithBoundaryBody = t.Object({
  boundary: t.Object({
    type: t.Literal("Polygon"),
    coordinates: t.Array(
      t.Array(
        t.Tuple([
          t.Number({ minimum: -180, maximum: 180 }), // lng
          t.Number({ minimum: -90, maximum: 90 }),   // lat
        ])
      )
    ),
  }),
});

/** Query for listing zones in a city */
export const ZoneListQuerySchema = t.Object({
  ...PaginationQuerySchema.properties,
  filter: t.Optional(
    t.Union([t.Literal("all"), t.Literal("active"), t.Literal("inactive")], {
      default: "all",
    })
  ),
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TypeScript types — derived from TypeBox via Static<>
// ─────────────────────────────────────────────────────────────────────────────

export type ReverseGeocodeQuery = Static<typeof ReverseGeocodeQuery>;
export type GeocodeQuery = Static<typeof GeocodeQuery>;
export type AutocompleteQuery = Static<typeof AutocompleteQuery>;
export type RetrieveParam = Static<typeof RetrieveParam>;
export type RetrieveQuery = Static<typeof RetrieveQuery>;
export type IfscParam = Static<typeof IfscParam>;

export type CreateCity = Static<typeof CreateCityBody>;
export type UpdateCity = Static<typeof UpdateCityBody>;
export type CityListRequest = Static<typeof CityListQuerySchema>;
export type CityGetByIdOrSlugRequest = Static<typeof CityGetByIdOrSlugParamSchema>;

export type ServiceabilityCheck = Static<typeof ServiceabilityCheckBody>;
export type CreateZoneBody = Static<typeof CreateZoneBody>;
export type UpdateZoneBody = Static<typeof UpdateZoneBody>;
export type PolyfillZoneBody = Static<typeof PolyfillZoneBody>;
export type SyncZoneWithBoundaryBody = Static<typeof SyncZoneWithBoundaryBody>;
export type ZoneListQuery = Static<typeof ZoneListQuerySchema>;

export type ActiveFilter = "all" | "active" | "inactive";

// ─────────────────────────────────────────────────────────────────────────────
// 4. Response shaping (Zod & Custom Types)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Public city profile sent to clients.
 */
export type CityPublic = {
  id: string;
  name: string;
  slug: string;
  state: string;
  stateCode: string | null;
  district: string | null;
  country: string;
  countryCode: string;
  isActive: boolean;
  centroidLat: number | null;
  centroidLng: number | null;
  timezone: string;
  launchedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * City profile including boundary geometry (for admin map views).
 */
export type CityMapItem = CityPublic & {
  boundary: Polygon;
};

/** Generic Polygon schema for GeoJSON compliance */
const geoJsonPolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.array(z.number()))), // number[][][] matches geojson.Polygon
});

/**
 * Public serviceable zone (H3) profile.
 */
export const serviceableH3ZonePublicSchema = z.object({
  id: z.uuid(),
  h3Index: z.string(),
  cityId: z.uuid(),
  label: z.string().nullable(),
  isActive: z.boolean(),
  boundary: geoJsonPolygonSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ServiceableH3ZonePublic = z.infer<
  typeof serviceableH3ZonePublicSchema
>;

/**
 * Maps a raw Drizzle zone record to the sanitized public profile.
 */
export function mapToZonePublic(
  zone: ServiceableH3Zone & { boundary: Polygon },
): ServiceableH3ZonePublic {
  return {
    id: zone.id,
    h3Index: zone.h3Index,
    cityId: zone.cityId,
    label: zone.label,
    isActive: zone.isActive,
    boundary: zone.boundary,
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
  };
}