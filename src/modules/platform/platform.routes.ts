// No imports from platform.schema.ts for TypeBox validation
import { Elysia, t } from "elysia";
import {
  CityController,
  PincodeController,
  platformController,
} from "./platform.controller";
import { jwtAuthPlugin } from "../../middleware/auth.middleware";
import type { AuthUser } from "../../middleware/auth.middleware";
import { AuthErrors } from "../auth/auth.errors";

// ── Shared TypeBox schemas ───────────────────────────────────────────────────

export const reverseGeocodeQuerySchema = t.Object({
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

export const geocodeQuerySchema = t.Object({
  address: t.String({
    description: "Address string to geocode into coordinates",
    minLength: 3,
  }),
});

export const autocompleteQuerySchema = t.Object({
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

export const retrieveParamSchema = t.Object({
  mapboxId: t.String({
    description: "The mapbox_id to retrieve details for",
    minLength: 1,
  }),
});

export const retrieveQuerySchema = t.Object({
  sessionToken: t.Optional(
    t.String({
      description: "UUID for grouping suggests and retrieve into one session",
      format: "uuid",
    }),
  ),
});

export const ifscParamSchema = t.Object({
  ifsc: t.String({
    description: "The 11-character Indian Financial System Code (IFSC)",
    pattern: "^[A-Z]{4}0[A-Z0-9]{6}$",
    default: "HDFC0000001",
    error: "Invalid IFSC code format",
  }),
});

export const cityUpdateBodySchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  slug: t.Optional(
    t.String({ minLength: 1, maxLength: 120, pattern: "^[a-z0-9-]+$" }),
  ),
  state: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  stateCode: t.Optional(t.String({ minLength: 1, maxLength: 3 })),
  countryCode: t.Optional(t.String({ minLength: 2, maxLength: 2 })),
  centroidLat: t.Optional(t.Number({ minimum: -90, maximum: 90 })),
  centroidLng: t.Optional(t.Number({ minimum: -180, maximum: 180 })),
  timezone: t.Optional(t.String({ minLength: 1, maxLength: 60 })),
  metadata: t.Optional(t.Record(t.String(), t.Unknown())),
});

export const createServiceablePincodeBodySchema = t.Object({
  pincode: t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
  cityId: t.String({ format: "uuid" }),
  localityName: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
  deliveryLeadTimeMins: t.Optional(t.Integer({ minimum: 1 })),
});

export const updateServiceablePincodeBodySchema = t.Partial(
  t.Omit(createServiceablePincodeBodySchema, ["cityId"]),
);

// ── Shared TypeBox primitives ─────────────────────────────────────────────────

const UUIDParam = t.Object({ id: t.String({ format: "uuid" }) });
const CityIdParam = t.Object({ cityId: t.String({ format: "uuid" }) });

const ServiceabilityCheckBody = t.Union([
  t.Object({
    type: t.Literal("coordinates"),
    latitude: t.Numeric({ minimum: -90, maximum: 90 }),
    longitude: t.Numeric({ minimum: -180, maximum: 180 }),
  }),
  t.Object({
    type: t.Literal("pincode"),
    pincode: t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
  }),
]);

const SetActiveBody = t.Object({
  isActive: t.Boolean(),
});

const PaginationQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 50 })),
});

const cityParam = t.Object({
  name: t.String(),
  slug: t.String(),
  state: t.String(),
});

// ── resolveRequestContext ─────────────────────────────────────────────────────

function resolveRequestContext({
  request,
  server,
}: {
  request: Request;
  server: { requestIP(req: Request): { address: string } | null } | null;
}) {
  const ip = server?.requestIP(request)?.address ?? "unknown";
  return { ip };
}

// ── authenticate ──────────────────────────────────────────────────────────────

function authenticate(ctx: { user?: AuthUser; [key: string]: unknown }): {
  actor: AuthUser;
} {
  if (!ctx.user) throw AuthErrors.Common.unauthorized();
  return { actor: ctx.user };
}

export const platformPlugin = new Elysia({ prefix: "/platform" })
  .derive(resolveRequestContext)
  .group("/location", (app) =>
    app
      .get("/reverse-geocode", platformController.reverseGeocode, {
        query: reverseGeocodeQuerySchema,
        detail: {
          tags: ["Platform"],
          summary: "Reverse Geocode Coordinates",
          description:
            "Converts a latitude and longitude into a structured human-readable address.",
        },
      })
      .get("/geocode", platformController.geocode, {
        query: geocodeQuerySchema,
        detail: {
          tags: ["Platform"],
          summary: "Geocode Address",
          description:
            "Converts a given address string into coordinates and formatted address fields.",
        },
      })
      .get("/autocomplete", platformController.autocomplete, {
        query: autocompleteQuerySchema,
        detail: {
          tags: ["Platform"],
          summary: "Address Autocomplete (Mapbox)",
          description:
            "Provides predicted address suggestions for an input string using Mapbox SearchBox API.",
        },
      })
      .get("/retrieve/:mapboxId", platformController.retrieve, {
        params: retrieveParamSchema,
        query: retrieveQuerySchema,
        detail: {
          tags: ["Platform"],
          summary: "Retrieve Place Details (Mapbox)",
          description:
            "Retrieves precise coordinates and address components for a Mapbox suggest ID.",
        },
      })
      .get("/ifsc/:ifsc", platformController.fetchIfsc, {
        params: ifscParamSchema,
        detail: {
          tags: ["Platform"],
          summary: "Fetch Bank Details from IFSC",
          description: "Resolves a given 11-character Indian IFSC code.",
        },
      }),
  )

  // ── Public Cities & Serviceability ──────────────────────────────────────────
  .get("/cities", ({ query }) => CityController.list(query as any), {
    query: PaginationQuery,
    detail: {
      tags: ["Platform"],
      summary: "List active cities",
      description: "Returns all active cities on the platform",
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

  // ── Admin Cities & Pincodes ─────────────────────────────────────────────────
  .group("/admin", (app) =>
    app
      .use(jwtAuthPlugin)
      .derive(authenticate)
      .group("/cities", (app) =>
        app
          .post(
            "/",
            ({ body, actor, ip }) =>
              CityController.create(body as any, {
                user: actor,
                ip,
              }),
            {
              body: cityParam,
              detail: {
                tags: ["Platform Admin"],
                summary: "Create a city",
                security: [{ bearerAuth: [] }],
              },
            },
          )
          .patch(
            "/:id",
            ({ params, body, actor, ip }) =>
              CityController.update(params.id, body as any, {
                user: actor,
                ip,
              }),
            {
              params: UUIDParam,
              body: cityUpdateBodySchema,
              detail: {
                tags: ["Platform Admin"],
                summary: "Update a city",
                security: [{ bearerAuth: [] }],
              },
            },
          )
          .patch(
            "/:id/active",
            ({ params, body, actor, ip }) =>
              CityController.setActive(params.id, (body as any).isActive, {
                user: actor,
                ip,
              }),
            {
              params: UUIDParam,
              body: SetActiveBody,
              detail: {
                tags: ["Platform Admin"],
                summary: "Activate/Deactivate city",
                security: [{ bearerAuth: [] }],
              },
            },
          ),
      )
      .group("/pincodes", (app) =>
        app
          .post(
            "/",
            ({ body, actor, ip }) =>
              PincodeController.create(body as any, {
                user: actor,
                ip,
              }),
            {
              body: createServiceablePincodeBodySchema,
              detail: {
                tags: ["Platform Admin"],
                summary: "Add serviceable pincode",
                security: [{ bearerAuth: [] }],
              },
            },
          )
          .patch(
            "/:id",
            ({ params, body, actor, ip }) =>
              PincodeController.update(params.id, body as any, {
                user: actor,
                ip,
              }),
            {
              params: UUIDParam,
              body: updateServiceablePincodeBodySchema,
              detail: {
                tags: ["Platform Admin"],
                summary: "Update serviceable pincode",
                security: [{ bearerAuth: [] }],
              },
            },
          )
          .patch(
            "/:id/active",
            ({ params, body, actor, ip }) =>
              PincodeController.setActive(params.id, (body as any).isActive, {
                user: actor,
                ip,
              }),
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
              query: PaginationQuery,
              detail: {
                tags: ["Platform Admin"],
                summary: "List pincodes by city",
                security: [{ bearerAuth: [] }],
              },
            },
          ),
      ),
  );
