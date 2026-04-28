/**
 * platform.routes.ts
 *
 * Routes for the Platform module.
 *
 * This module handles:
 * - Geolocation services (Mapbox integration)
 * - Banking utilities (IFSC lookup)
 * - City and H3 Zone management
 *
 * Public vs Protected Split:
 * - PUBLIC: Geo lookups, city listings, serviceability checks.
 * - PROTECTED: Banking lookups (auth required).
 * - ADMIN: CRUD operations for cities and H3 zones (admin role required).
 *
 * Security Rule: Routes MUST NOT import from services directly; always use the controller.
 */

import { Elysia } from "elysia";

import {
  CityController,
  ServiceableZoneController,
  platformController,
} from "./platform.controller";

import { resolveRequestContext, authenticate, PaginationQuerySchema, ROLES } from "../../shared";
import { jwtAuthPlugin } from "../../middleware/auth.middleware";
import { rbacGuard, rbacPlugin } from "../../middleware/rbac.middleware";

import {
  ReverseGeocodeQuery,
  GeocodeQuery,
  AutocompleteQuery,
  RetrieveParam,
  RetrieveQuery,
  IfscParam,
  CreateCityBody,
  UpdateCityBody,
  ServiceabilityCheckBody,
  CreateZoneBody,
  UpdateZoneBody,
  PolyfillZoneBody,
  UUIDParam,
  CityIdParam,
  SetActiveBody,
  CityListQuerySchema,
  CityGetByIdOrSlugParamSchema,
  SyncZoneWithBoundaryBody,
  ZoneListQuerySchema,
} from "./platform.schema";

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC GEO ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Public Geolocation Routes.
 * Interfaces with Mapbox for geocoding and address autocomplete.
 */
export const publicGeoRoutes = new Elysia({ prefix: "/platform/geo", tags: ["Platform"] })
  .derive(resolveRequestContext)

  /** Reverse Geocode: Lng/Lat → Address */
  .get("/reverse-geocode", platformController.reverseGeocode, {
    query: ReverseGeocodeQuery,
    detail: {
      summary: "Reverse Geocode Coordinates",
      description: "Converts a latitude and longitude into a structured human-readable address.",
    },
  })

  /** Forward Geocode: Address → Lng/Lat */
  .get("/geocode", platformController.geocode, {
    query: GeocodeQuery,
    detail: {
      summary: "Geocode Address",
      description: "Converts a given address string into coordinates and formatted address fields.",
    },
  })

  /** Autocomplete Suggestions */
  .get("/autocomplete", platformController.autocomplete, {
    query: AutocompleteQuery,
    detail: {
      summary: "Address Autocomplete (Mapbox)",
      description: "Provides predicted address suggestions for an input string using Mapbox SearchBox API.",
    },
  })

  /** Retrieve specific place details from Mapbox ID */
  .get("/retrieve/:mapboxId", platformController.retrieve, {
    params: RetrieveParam,
    query: RetrieveQuery,
    detail: {
      summary: "Retrieve Place Details (Mapbox)",
      description: "Retrieves precise coordinates and address components for a Mapbox suggest ID.",
    },
  })

// ═════════════════════════════════════════════════════════════════════════════
// PROTECTED BANKING ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Protected Banking Routes.
 * Requires a valid JWT. Resolves Indian bank details from IFSC.
 */
export const protectedBankingRoutes = new Elysia({ prefix: "/platform/banking", tags: ["Platform"] })
  .get("/ifsc/:ifsc", platformController.fetchIfsc, {
    params: IfscParam,
    detail: {
      summary: "Fetch Bank Details from IFSC",
      description: "Resolves a given 11-character Indian IFSC code.",
    },
  })

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC CITY & ZONE ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Public City Routes.
 * Lightweight listing for storefronts and onboarding.
 */
export const publicCityRoutes = new Elysia({ prefix: "/platform/cities", tags: ["Platform"] })

  /** Global list of all active cities */
  .get("/all", ({ query }) => CityController.list({ ...query, filter: "active" }), {
    query: PaginationQuerySchema,
    detail: {
      summary: "List active cities",
      description: "Returns all active cities on the platform",
    },
  })

/**
 * Public Zone Routes.
 * Consumer-facing serviceability checks.
 */
export const publicZoneRoutes = new Elysia({ prefix: "/platform/zones", tags: ["Platform"] })
  .derive(resolveRequestContext)

  /** Check if a point is within any H3 serviceable zone */
  .get(
    "/check-serviceability",
    ({ query }) => ServiceableZoneController.checkServiceability(query),
    {
      query: ServiceabilityCheckBody,
      detail: {
        summary: "Check delivery serviceability (H3-based)",
        description: "Check if coordinates are within a serviceable H3 zone",
      },
    },
  )

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN CITY ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Admin City Management.
 * Restricted to administrators.
 */
export const adminCityRoute = new Elysia({ prefix: "/platform/admin/city", tags: ["Platform Admin"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .use(rbacPlugin([ROLES.ADMIN]))

  /** List cities (with status filters) */
  .get("/cities", ({ query }) => CityController.list({ ...query, filter: query.filter ?? 'all' }), {
    query: CityListQuerySchema,
    detail: {
      summary: "List all cities (Admin)",
      security: [{ bearerAuth: [] }],
    },
  })

  /** List cities with their GeoJSON boundary */
  .get("/cities/mapped", ({ query }) => CityController.listWithBoundary({ ...query, filter: query.filter ?? 'all' }), {
    query: CityListQuerySchema,
    detail: {
      summary: "List all cities with boundary (Admin)",
      security: [{ bearerAuth: [] }],
    },
  })

  /** Fetch a specific city by UUID or Slug */
  .get("/idorslug/:idOrSlug", ({ params }) => CityController.getByIdOrSlug(params), {
    params: CityGetByIdOrSlugParamSchema,
    detail: {
      summary: "Get city by id or slug (Admin)",
      security: [{ bearerAuth: [] }],
    },
  })

  /** Create a new city and auto-polyfill its zones */
  .post(
    "/create",
    ({ body, actor, ip }) => CityController.create(body, actor, { ip }),
    {
      body: CreateCityBody,
      detail: {
        summary: "Create a city",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  /** Update city metadata or boundary */
  .patch(
    "/update/:id",
    ({ params, body, actor, ip }) => CityController.update(params.id, body, actor, { ip }),
    {
      params: UUIDParam,
      body: UpdateCityBody,
      detail: {
        summary: "Update a city",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  /** Toggle city operational status */
  .patch(
    "/active/:id",
    ({ params, body, actor, ip }) => CityController.setActive(params.id, body.isActive, actor, { ip }),
    {
      params: UUIDParam,
      body: SetActiveBody,
      detail: {
        summary: "Activate/Deactivate city",
        security: [{ bearerAuth: [] }],
      },
    },
  )

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN ZONE ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Admin H3 Zone Management.
 * Granular control over serviceable areas.
 */
export const adminZoneRoutes = new Elysia({ prefix: "/platform/admin/zone", tags: ["Platform Admin"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .use(rbacPlugin([ROLES.ADMIN]))

  /** Manually add a single H3 cell */
  .post("/", ({ body, actor, ip }) => ServiceableZoneController.create(body, actor, { ip }), {
    body: CreateZoneBody,
    detail: {
      summary: "Add serviceable H3 zone",
      security: [{ bearerAuth: [] }],
    },
  })

  /** Update zone label */
  .patch("/:id", ({ params, body, actor, ip }) => ServiceableZoneController.update(params.id, body, actor, { ip }), {
    params: UUIDParam,
    body: UpdateZoneBody,
    detail: {
      summary: "Update serviceable H3 zone",
      security: [{ bearerAuth: [] }],
    },
  })

  /** Toggle single zone status */
  .patch("/:id/active", ({ params, body, actor, ip }) => ServiceableZoneController.setActive(params.id, body.isActive, actor, { ip }), {
    params: UUIDParam,
    body: SetActiveBody,
    detail: {
      summary: "Activate/Deactivate H3 zone",
      security: [{ bearerAuth: [] }],
    },
  })

  /** List all H3 zones for a specific city */
  .get("/by-city/:cityId", ({ params, query }) => ServiceableZoneController.listByCity(params.cityId, query as any), {
    params: CityIdParam,
    query: ZoneListQuerySchema,
    detail: {
      summary: "List H3 zones by city",
      security: [{ bearerAuth: [] }],
    },
  })

  /** Bulk create zones from a provided polygon boundary */
  .post("/polyfill", ({ body, actor, ip }) => ServiceableZoneController.polyfill(body, actor, { ip }), {
    body: PolyfillZoneBody,
    detail: {
      summary: "Bulk create H3 zones from polygon",
      description: "Takes a closed polygon and fills it with H3 cells for a city.",
      security: [{ bearerAuth: [] }],
    },
  })

  /** Toggle all zones within a city */
  .patch("/by-city/:cityId/active", ({ params, body, actor, ip }) => ServiceableZoneController.setActiveByCity(params.cityId, body.isActive, actor, { ip }), {
    params: CityIdParam,
    body: SetActiveBody,
    detail: {
      summary: "Activate/Deactivate all zones in a city",
      security: [{ bearerAuth: [] }],
    },
  })

  /** Re-polyfill city zones based on a new boundary */
  .post("/by-city/:cityId/sync", ({ params, body, actor, ip }) => ServiceableZoneController.syncZonesWithBoundary(params.cityId, body, actor, { ip }), {
    params: CityIdParam,
    body: SyncZoneWithBoundaryBody,
    detail: {
      summary: "Sync zones with city boundary",
      description: "Deletes old auto-zones and re-polyfills using the new boundary.",
      security: [{ bearerAuth: [] }],
    },
  });

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSITE PLUGIN
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Platform Module Plugin.
 * Composites geo, banking, city, and zone route groups.
 */
export const platformPlugin = new Elysia({ name: "platform-plugin" })
  .use(publicGeoRoutes)
  .use(protectedBankingRoutes)
  .use(publicCityRoutes)
  .use(publicZoneRoutes)
  .use(adminCityRoute)
  .use(adminZoneRoutes);
