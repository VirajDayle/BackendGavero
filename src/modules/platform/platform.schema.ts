/**
 * platform.schema.ts
 *
 * ⚠️  SINGLE SOURCE OF TRUTH for the Platform module.
 *
 * All TypeBox route schemas, Zod cross-field schemas, internal enum types,
 * and response-shaping mappers live here.
 */

import { t, type Static } from "elysia";
import { z } from "zod";
import type {
  City,
  ServiceablePincode,
  ServiceableH3Zone,
} from "../../db/schema";

// ─────────────────────────────────────────────────────────────────────────────
// 0. Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toUnion<T extends readonly string[]>(arr: T) {
  return t.Union(arr.map((v) => t.Literal(v)) as any);
}

import { PaginationQuerySchema } from "../../shared";
// ─────────────────────────────────────────────────────────────────────────────
// 1. Shared TypeBox primitives
// ─────────────────────────────────────────────────────────────────────────────

export const UUIDParam = t.Object({
  id: t.String({ format: "uuid" }),
});

export const CityIdParam = t.Object({
  cityId: t.String({ format: "uuid" }),
});

export const StateParam = t.Object({
  state: t.String({ minLength: 2, maxLength: 100 }),
});

export const SetActiveBody = t.Object({
  isActive: t.Boolean(),
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Route body / param schemas (TypeBox)
// ─────────────────────────────────────────────────────────────────────────────

// ── Location ─────────────────────────────────────────────────────────────────

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

export const GeocodeQuery = t.Object({
  address: t.String({
    description: "Address string to geocode into coordinates",
    minLength: 3,
  }),
});

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

export const RetrieveParam = t.Object({
  mapboxId: t.String({
    description: "The mapbox_id to retrieve details for",
    minLength: 1,
  }),
});

export const RetrieveQuery = t.Object({
  sessionToken: t.Optional(
    t.String({
      description: "UUID for grouping suggests and retrieve into one session",
      format: "uuid",
    }),
  ),
});

export const IfscParam = t.Object({
  ifsc: t.String({
    description: "The 11-character Indian Financial System Code (IFSC)",
    pattern: "^[A-Z]{4}0[A-Z0-9]{6}$",
    default: "HDFC0000001",
    error: "Invalid IFSC code format",
  }),
});

// ── Cities ────────────────────────────────────────────────────────────────────

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
export const UpdateCityBody = t.Partial(CreateCityBody);

// ── Pincodes ───────────────────────────────────────────────────────────────────

export const CreatePincodeBody = t.Object({
  pincode: t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
  cityId: t.String({ format: "uuid" }),
  localityName: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
  deliveryLeadTimeMins: t.Optional(t.Integer({ minimum: 1 })),
});

export const UpdatePincodeBody = t.Partial(CreatePincodeBody);

export const ServiceabilityCheckBody = t.Object({
  type: t.Literal("coordinates"),
  latitude: t.Numeric({ minimum: -90, maximum: 90 }),
  longitude: t.Numeric({ minimum: -180, maximum: 180 }),
});


// ── Zones ─────────────────────────────────────────────────────────────────────

export const CreateZoneBody = t.Object({
  h3Index: t.String({ minLength: 15, maxLength: 15 }),
  cityId: t.String({ format: "uuid" }),
  label: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
});

export const UpdateZoneBody = t.Partial(
  t.Omit(CreateZoneBody, ["cityId", "h3Index"]),
);

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
export type StateParam = Static<typeof StateParam>;

export type CreateCity = Static<typeof CreateCityBody>;
export type UpdateCity = Static<typeof UpdateCityBody>;

export type CreatePincodeBody = Static<typeof CreatePincodeBody>;
export type UpdatePincodeBody = Static<typeof UpdatePincodeBody>;
export type ServiceabilityCheck = Static<typeof ServiceabilityCheckBody>;

export type CreateZoneBody = Static<typeof CreateZoneBody>;
export type UpdateZoneBody = Static<typeof UpdateZoneBody>;
export type PolyfillZoneBody = Static<typeof PolyfillZoneBody>;
export type SyncZoneWithBoundaryBody = Static<typeof SyncZoneWithBoundaryBody>;
export type ZoneListQuery = Static<typeof ZoneListQuerySchema>;



// ─────────────────────────────────────────────────────────────────────────────
// 4. Response shaping (Zod)
// ─────────────────────────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid();

/**
 * Public city profile sent to clients.
*/
import type { Polygon } from "geojson";

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

export type CityMapItem = CityPublic & {
  boundary: Polygon;
};

/**
 * Public serviceable pincode.
*/
export const serviceablePincodePublicSchema = z.object({
  id: uuidSchema,
  pincode: z.string(),
  cityId: uuidSchema,
  localityName: z.string().nullable(),
  isActive: z.boolean(),
  deliveryLeadTimeMins: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ServiceablePincodePublic = z.infer<
  typeof serviceablePincodePublicSchema
>;

export function mapToPincodePublic(
  p: ServiceablePincode,
): ServiceablePincodePublic {
  return {
    id: p.id,
    pincode: p.pincode,
    cityId: p.cityId,
    localityName: p.localityName,
    isActive: p.isActive,
    deliveryLeadTimeMins: p.deliveryLeadTimeMins,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/**
 * Public serviceable zone (H3).
*/

const geoJsonPolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.array(z.number()))), // number[][][] matches geojson.Polygon
});

export const serviceableH3ZonePublicSchema = z.object({
  id: uuidSchema,
  h3Index: z.string(),
  cityId: uuidSchema,
  label: z.string().nullable(),
  isActive: z.boolean(),
  boundary: geoJsonPolygonSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ServiceableH3ZonePublic = z.infer<
  typeof serviceableH3ZonePublicSchema
>;

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

export const CityListQuerySchema = t.Object({
  ...PaginationQuerySchema.properties,
  filter: t.Optional(
    t.Union([t.Literal("all"), t.Literal("active"), t.Literal("inactive")], {
      default: "all",
    })
  ),
  stateCode: t.Optional(t.String()),
});

export const PincodeListQuerySchema = t.Object({
  ...PaginationQuerySchema.properties,
  filter: t.Optional(
    t.Union([t.Literal("all"), t.Literal("active"), t.Literal("inactive")], {
      default: "all",
    })
  ),
  cityId: t.Optional(t.String({ format: "uuid" })),
});

export const CityGetByIdOrSlugParamSchema = t.Object({
  idOrSlug: t.String(),
});

export type ActiveFilter = "all" | "active" | "inactive";

export type CityListRequest = Static<typeof CityListQuerySchema>;
export type CityGetByIdOrSlugRequest = Static<typeof CityGetByIdOrSlugParamSchema>;
export type PincodeList = Static<typeof PincodeListQuerySchema>;