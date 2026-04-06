import { Elysia } from "elysia";

import {
  CityController,
  PincodeController,
  ServiceableZoneController,
  platformController,
} from "./platform.controller";

import { resolveRequestContext, authenticate, PaginationQuerySchema, parsePagination } from "../../shared";
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
  CreatePincodeBody,
  UpdatePincodeBody,
  ServiceabilityCheckBody,
  CreateZoneBody,
  UpdateZoneBody,
  PolyfillZoneBody,
  UUIDParam,
  CityIdParam,
  SetActiveBody,
  CityListQuerySchema,
  CityGetByIdOrSlugParamSchema,
  PincodeListQuerySchema,
  SyncZoneWithBoundaryBody,
  ZoneListQuerySchema,
} from "./platform.schema";

// ── resolveRequestContext ───────────────────────────────────────────────────

export const publicGeoRoutes = new Elysia({ prefix: "/platform/geo" })
  .derive(resolveRequestContext)
  .get("/reverse-geocode", platformController.reverseGeocode, {
    query: ReverseGeocodeQuery,
    detail: {
      tags: ["Platform"],
      summary: "Reverse Geocode Coordinates",
      description:
        "Converts a latitude and longitude into a structured human-readable address.",
    },
  })
  .get("/geocode", platformController.geocode, {
    query: GeocodeQuery,
    detail: {
      tags: ["Platform"],
      summary: "Geocode Address",
      description:
        "Converts a given address string into coordinates and formatted address fields.",
    },
  })
  .get("/autocomplete", platformController.autocomplete, {
    query: AutocompleteQuery,
    detail: {
      tags: ["Platform"],
      summary: "Address Autocomplete (Mapbox)",
      description:
        "Provides predicted address suggestions for an input string using Mapbox SearchBox API.",
    },
  })
  .get("/retrieve/:mapboxId", platformController.retrieve, {
    params: RetrieveParam,
    query: RetrieveQuery,
    detail: {
      tags: ["Platform"],
      summary: "Retrieve Place Details (Mapbox)",
      description:
        "Retrieves precise coordinates and address components for a Mapbox suggest ID.",
    },
  })
  .post(
    "/serviceability/check",
    ({ body }) => PincodeController.checkServiceability(body as any),
    {
      body: ServiceabilityCheckBody,
      detail: {
        tags: ["Platform"],
        summary: "Check delivery serviceability",
        description:
          "Check if a pincode or coordinates are within a serviceable area",
      },
    },
  )

export const protectedBankingRoutes = new Elysia({ prefix: "/platform/banking" })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get("/ifsc/:ifsc", platformController.fetchIfsc, {
    params: IfscParam,
    detail: {
      tags: ["Platform"],
      summary: "Fetch Bank Details from IFSC",
      description: "Resolves a given 11-character Indian IFSC code.",
      security: [{ bearerAuth: [] }],
    },
  })


export const publicCityRoutes = new Elysia({ prefix: "/platform/cities" })
  .get("/all", ({ query }) => CityController.list({ ...query, filter: "active" }), {
    query: PaginationQuerySchema,
    detail: {
      tags: ["Platform"],
      summary: "List active cities",
      description: "Returns all active cities on the platform",
    },
  })

export const adminCityRoute = new Elysia({ prefix: "/platform/admin/city" })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .use(rbacPlugin(["admin"]))
  .get("/cities", ({ query }) => CityController.list({ ...query, filter: query.filter ?? 'all' }), {
    query: CityListQuerySchema,
    detail: {
      tags: ["Platform Admin"],
      summary: "List all cities (Admin)",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/cities/mapped", ({ query }) => CityController.listWithBoundary({ ...query, filter: query.filter ?? 'all' }), {
    query: CityListQuerySchema,
    detail: {
      tags: ["Platform Admin"],
      summary: "List all cities with boundary (Admin)",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/idorslug/:idOrSlug", ({ params }) => CityController.getByIdOrSlug(params), {
    params: CityGetByIdOrSlugParamSchema,
    detail: {
      tags: ["Platform Admin"],
      summary: "Get city by id or slug (Admin)",
      security: [{ bearerAuth: [] }],
    },
  })
  .post(
    "/create",
    ({ body, actor, ip }) =>
      CityController.create(body, actor, { ip }),
    {
      body: CreateCityBody,
      detail: {
        tags: ["Platform Admin"],
        summary: "Create a city",
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .patch(
    "/update/:id",
    ({ params, body, actor, ip }) =>
      CityController.update(params.id, body, actor, { ip }),
    {
      params: UUIDParam,
      body: UpdateCityBody,
      detail: {
        tags: ["Platform Admin"],
        summary: "Update a city",
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .patch(
    "/active/:id",
    ({ params, body, actor, ip }) =>
      CityController.setActive(params.id, body.isActive, actor, { ip }),
    {
      params: UUIDParam,
      body: SetActiveBody,
      detail: {
        tags: ["Platform Admin"],
        summary: "Activate/Deactivate city",
        security: [{ bearerAuth: [] }],
      },
    },
  )

export const publicZoneRoutes = new Elysia({ prefix: "/platform/zones" })
  .derive(resolveRequestContext)
  .post(
    "/check-serviceability",
    ({ body }) => ServiceableZoneController.checkServiceability(body),
    {
      body: ServiceabilityCheckBody,
      detail: {
        tags: ["Platform"],
        summary: "Check delivery serviceability (H3-based)",
        description: "Check if coordinates are within a serviceable H3 zone",
      },
    },
  )

export const adminZoneRoutes = new Elysia({ prefix: "/platform/admin/zone" })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .use(rbacPlugin(["admin"]))
  .post("/", ({ body, actor, ip }) => ServiceableZoneController.create(body, actor, { ip }), {
    body: CreateZoneBody,
    detail: {
      tags: ["Platform Admin"],
      summary: "Add serviceable H3 zone",
      security: [{ bearerAuth: [] }],
    },
  })
  .patch("/:id", ({ params, body, actor, ip }) => ServiceableZoneController.update(params.id, body, actor, { ip }), {
    params: UUIDParam,
    body: UpdateZoneBody,
    detail: {
      tags: ["Platform Admin"],
      summary: "Update serviceable H3 zone",
      security: [{ bearerAuth: [] }],
    },
  })
  .patch("/:id/active", ({ params, body, actor, ip }) => ServiceableZoneController.setActive(params.id, body.isActive, actor, { ip }), {
    params: UUIDParam,
    body: SetActiveBody,
    detail: {
      tags: ["Platform Admin"],
      summary: "Activate/Deactivate H3 zone",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/by-city/:cityId", ({ params, query }) => ServiceableZoneController.listByCity(params.cityId, query as any), {
    params: CityIdParam,
    query: ZoneListQuerySchema,
    detail: {
      tags: ["Platform Admin"],
      summary: "List H3 zones by city",
      security: [{ bearerAuth: [] }],
    },
  })
  .post("/polyfill", ({ body, actor, ip }) => ServiceableZoneController.polyfill(body, actor, { ip }), {
    body: PolyfillZoneBody,
    detail: {
      tags: ["Platform Admin"],
      summary: "Bulk create H3 zones from polygon",
      description: "Takes a closed polygon and fills it with H3 r7 cells for a city.",
      security: [{ bearerAuth: [] }],
    },
  })
  .patch("/by-city/:cityId/active", ({ params, body, actor, ip }) => ServiceableZoneController.setActiveByCity(params.cityId, body.isActive, actor, { ip }), {
    params: CityIdParam,
    body: SetActiveBody,
    detail: {
      tags: ["Platform Admin"],
      summary: "Activate/Deactivate all zones in a city",
      security: [{ bearerAuth: [] }],
    },
  })
  .post("/by-city/:cityId/sync", ({ params, body, actor, ip }) => ServiceableZoneController.syncZonesWithBoundary(params.cityId, body, actor, { ip }), {
    params: CityIdParam,
    body: SyncZoneWithBoundaryBody,
    detail: {
      tags: ["Platform Admin"],
      summary: "Sync zones with city boundary",
      description: "Deletes old auto-zones and re-polyfills using the new boundary.",
      security: [{ bearerAuth: [] }],
    },
  });



export const adminPincodeRoute = new Elysia({ prefix: "/platform/admin/pincode" })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .use(rbacPlugin(["admin"]))
  .get("/pincodes", ({ query }) => PincodeController.list(query), {
    query: PincodeListQuerySchema,
    detail: {
      tags: ["Platform Admin"],
      summary: "List all pincodes (Admin)",
      security: [{ bearerAuth: [] }],
    },
  })
  .post(
    "/create",
    ({ body, actor, ip }) =>
      PincodeController.create(body as any, { user: actor, ip }),
    {
      body: CreatePincodeBody,
      detail: {
        tags: ["Platform Admin"],
        summary: "Create a pincode",
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .patch(
    "/update/:id",
    ({ params, body, actor, ip }) =>
      PincodeController.update(params.id, body as any, { user: actor, ip }),
    {
      params: UUIDParam,
      body: UpdatePincodeBody,
      detail: {
        tags: ["Platform Admin"],
        summary: "Update a pincode",
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .patch(
    "/active/:id",
    ({ params, body, actor, ip }) =>
      PincodeController.setActive(params.id, body.isActive, { user: actor, ip }),
    {
      params: UUIDParam,
      body: SetActiveBody,
      detail: {
        tags: ["Platform Admin"],
        summary: "Activate/Deactivate pincode",
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .get(
    "/by-city/:cityId",
    ({ params, query }) =>
      PincodeController.listByCity(params.cityId, query as any),
    {
      params: CityIdParam,
      query: PaginationQuerySchema,
      detail: {
        tags: ["Platform Admin"],
        summary: "List pincodes by city",
        security: [{ bearerAuth: [] }],
      },
    },
  );

export const platformPlugin = new Elysia({ name: "platform-plugin" })
  .use(publicGeoRoutes)
  .use(protectedBankingRoutes)
  .use(publicCityRoutes)
  .use(adminCityRoute)
  .use(adminPincodeRoute)
  .use(adminZoneRoutes);
