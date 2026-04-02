/**
 * modules/shop/shop.routes.ts
 *
 * Elysia routes for the shop module.
 */

import { UAParser } from "ua-parser-js";
import { Elysia, t } from "elysia";
import { jwtAuthPlugin } from "../../middleware/auth.middleware";
import type { AuthUser } from "../../middleware/auth.middleware";
import { AuthErrors } from "../auth/auth.errors";

import {
  ShopController,
  BranchController,
  CategoryController,
  ShopTypeController,
  HoursController,
} from "./shop.controller";

// ── Shared TypeBox primitives ─────────────────────────────────────────────────

const UUIDParam = t.Object({ id: t.String({ format: "uuid" }) });

const PaginationQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// ── Shop bodies ───────────────────────────────────────────────────────────────

const CreateShopBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 150 }),
  shopTypeId: t.String({ format: "uuid" }),
  username: t.String({ minLength: 3, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 1000 })),
  tagLine: t.Optional(t.String({ maxLength: 200 })),
});

const UpdateShopBody = t.Partial(CreateShopBody);

// ── Branch bodies ─────────────────────────────────────────────────────────────

const CreateBranchBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 150 }),
  phone: t.Optional(t.String({ minLength: 10, maxLength: 20 })),
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
  addressId: t.Optional(t.String({ format: "uuid" })),
});

const UpdateBranchBody = t.Partial(CreateBranchBody);

// ── Hours bodies ──────────────────────────────────────────────────────────────

const SetOperatingHoursBody = t.Object({
  hours: t.Array(t.Object({
    dayOfWeek: t.Integer({ minimum: 0, maximum: 6 }),
    openTime: t.String({ pattern: "^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$" }),
    closeTime: t.String({ pattern: "^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$" }),
    isClosed: t.Optional(t.Boolean({ default: false })),
    isOvernight: t.Optional(t.Boolean({ default: false })),
  })),
});

// ── resolveRequestContext ─────────────────────────────────────────────────────

type DeviceInfo = {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: string;
  userAgent: string;
  ip: string;
};

type RequestContext = {
  ip: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
};

function resolveRequestContext({
  request,
  server,
}: {
  request: Request;
  server: { requestIP(req: Request): { address: string } | null } | null;
}): RequestContext {
  const ip = server?.requestIP(request)?.address ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "";
  const parseResult = new UAParser(userAgent).getResult();
  const deviceInfo = {
    browser: parseResult.browser.name || "Unknown",
    browserVersion: parseResult.browser.version || "Unknown",
    os: parseResult.os.name || "Unknown",
    deviceType: parseResult.device.type || "desktop",
    userAgent,
    ip,
  };
  return { ip, userAgent, deviceInfo };
}

// ── authenticate ──────────────────────────────────────────────────────────────

function authenticate(ctx: { user?: AuthUser; [key: string]: unknown }): {
  actor: AuthUser;
} {
  if (!ctx.user) throw AuthErrors.Common.unauthorized();
  return { actor: ctx.user };
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═════════════════════════════════════════════════════════════════════════════

export const publicShopRoutes = new Elysia({ prefix: "/shops", tags: ["Shops"] })
  .get("/", ({ query }) => ShopController.list({
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 20,
  }), {
    query: PaginationQuery,
    detail: { summary: "List all shops (public)" },
  })

  .get("/:id", ({ params }) => ShopController.getById(params.id), {
    params: UUIDParam,
    detail: { summary: "Get shop by ID" },
  })

  .get("/s/:slug", ({ params }) => ShopController.getBySlug(params.slug), {
    detail: { summary: "Get shop by slug" },
  })

  .get("/:id/branches", ({ params }) => BranchController.listByShop(params.id), {
    params: UUIDParam,
    detail: { summary: "List branches of a shop" },
  });

export const publicCatalogRoutes = new Elysia({ tags: ["Catalog"] })
  .get("/shop-types", () => ShopTypeController.list(), {
    detail: { summary: "List all shop types" },
  })

  .get("/categories", () => CategoryController.list(), {
    detail: { summary: "List all pre-defined categories" },
  });

// ═════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES
// ═════════════════════════════════════════════════════════════════════════════

export const protectedShopRoutes = new Elysia({ prefix: "/shops", tags: ["Shops"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .post("/", ({ body, actor, ip }) => ShopController.create(body, { user: actor, ip }), {
    body: CreateShopBody,
    detail: { summary: "Create a new shop", security: [{ bearerAuth: [] }] },
  })

  .patch("/:id", ({ params, body, actor, ip }) => ShopController.update(params.id, body, { user: actor, ip }), {
    params: UUIDParam,
    body: UpdateShopBody,
    detail: { summary: "Update shop details", security: [{ bearerAuth: [] }] },
  })

  .delete("/:id", ({ params, actor, ip }) => ShopController.softDelete(params.id, { user: actor, ip }), {
    params: UUIDParam,
    detail: { summary: "Delete a shop", security: [{ bearerAuth: [] }] },
  })

  .post("/:id/branches", ({ params, body, actor, ip }) => BranchController.create(params.id, body, { user: actor, ip }), {
    params: UUIDParam,
    body: CreateBranchBody,
    detail: { summary: "Add a branch to a shop", security: [{ bearerAuth: [] }] },
  })

  .post("/:id/hours", ({ params, body, actor, ip }) => HoursController.setHours(params.id, body, { user: actor, ip }), {
    params: UUIDParam,
    body: SetOperatingHoursBody,
    detail: { summary: "Set operating hours for a shop", security: [{ bearerAuth: [] }] },
  })

  .get("/:id/hours", ({ params }) => HoursController.listByShop(params.id), {
    params: UUIDParam,
    detail: { summary: "Get operating hours for a shop", security: [{ bearerAuth: [] }] },
  });

export const protectedBranchRoutes = new Elysia({ prefix: "/branches", tags: ["Branches"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get("/:id", ({ params }) => BranchController.getById(params.id), {
    params: UUIDParam,
    detail: { summary: "Get branch details", security: [{ bearerAuth: [] }] },
  })

  .patch("/:id", ({ params, body, actor, ip }) => BranchController.update(params.id, body, { user: actor, ip }), {
    params: UUIDParam,
    body: UpdateBranchBody,
    detail: { summary: "Update branch details", security: [{ bearerAuth: [] }] },
  })

  .delete("/:id", ({ params, actor, ip }) => BranchController.delete(params.id, { user: actor, ip }), {
    params: UUIDParam,
    detail: { summary: "Delete a branch", security: [{ bearerAuth: [] }] },
  });

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═════════════════════════════════════════════════════════════════════════════

export const adminShopRoutes = new Elysia({ prefix: "/admin/shops", tags: ["Shops"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .derive(({ actor }) => {
    if (!actor.roles.includes("admin")) throw AuthErrors.Common.unauthorized("Admin access required");
    return {};
  })

  .patch("/:id/status", ({ params, body, actor, ip }) => ShopController.updateStatus(params.id, body.status, { user: actor, ip }), {
    params: UUIDParam,
    body: t.Object({
      status: t.String({ enum: ["draft", "pending", "active", "suspended", "rejected"] })
    }),
    detail: { summary: "Update shop status (Admin only)", security: [{ bearerAuth: [] }] },
  });

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSED PLUGIN
// ═════════════════════════════════════════════════════════════════════════════

export const shopPlugin = new Elysia({ name: "shop-plugin" })
  .use(publicShopRoutes)
  .use(publicCatalogRoutes)
  .use(protectedShopRoutes)
  .use(protectedBranchRoutes)
  .use(adminShopRoutes);
