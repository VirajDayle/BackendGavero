/**
 * modules/shop/shop.controller.ts
 *
 * Thin HTTP layer for the shop module.
 */

import type { AuthUser } from "../../middleware/auth.middleware";
import { ok, created, paginatedRaw } from "../../core/response";
import {
  ShopService,
  BranchService,
  CategoryService,
  ShopTypeService,
  HoursService,
} from "./shop.service";
import type {
  CreateShopRequest,
  CreateBranchRequest,
  SetOperatingHoursRequest,
  Pagination,
  UpdateShopRequest,
  UpdateBranchRequest,
} from "./shop.schema";

// ── Context type ──────────────────────────────────────────────────────────────

interface Ctx {
  user: AuthUser;
  ip: string;
}

function actor(ctx: Ctx) {
  return {
    actorId: ctx.user.id,
    actorRoles: ctx.user.roles,
    ip: ctx.ip,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. SHOP CONTROLLER
// ═════════════════════════════════════════════════════════════════════════════

export abstract class ShopController {
  static async create(body: CreateShopRequest, ctx: Ctx) {
    const shop = await ShopService.create(body, actor(ctx));
    return created(shop);
  }

  static async getById(id: string) {
    const shop = await ShopService.getById(id);
    return ok(shop);
  }

  static async getBySlug(slug: string) {
    const shop = await ShopService.getBySlug(slug);
    return ok(shop);
  }

  static async list(pagination: Pagination) {
    const result = await ShopService.list(pagination);
    return paginatedRaw(result.items, pagination.page, pagination.limit, result.total);
  }

  static async update(id: string, body: UpdateShopRequest, ctx: Ctx) {
    const shop = await ShopService.update(id, body, actor(ctx));
    return ok(shop);
  }

  static async softDelete(id: string, ctx: Ctx) {
    await ShopService.softDelete(id, actor(ctx));
    return ok({ deleted: true });
  }

  static async updateStatus(id: string, status: string, ctx: Ctx) {
    const shop = await ShopService.updateStatus(id, status, actor(ctx));
    return ok(shop);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. BRANCH CONTROLLER
// ═════════════════════════════════════════════════════════════════════════════

export abstract class BranchController {
  static async create(shopId: string, body: CreateBranchRequest, ctx: Ctx) {
    const branch = await BranchService.create(shopId, body, actor(ctx));
    return created(branch);
  }

  static async listByShop(shopId: string) {
    const branches = await BranchService.listByShop(shopId);
    return ok(branches);
  }

  static async getById(id: string) {
    const branch = await BranchService.getById(id);
    return ok(branch);
  }

  static async update(id: string, body: UpdateBranchRequest, ctx: Ctx) {
    const branch = await BranchService.update(id, body, actor(ctx));
    return ok(branch);
  }

  static async delete(id: string, ctx: Ctx) {
    await BranchService.delete(id, actor(ctx));
    return ok({ deleted: true });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. HOURS CONTROLLER
// ═════════════════════════════════════════════════════════════════════════════

export abstract class HoursController {
  static async setHours(shopId: string, body: SetOperatingHoursRequest, ctx: Ctx) {
    const hours = await HoursService.setHours(shopId, body, actor(ctx));
    return ok(hours);
  }

  static async listByShop(shopId: string) {
    const hours = await HoursService.listByShop(shopId);
    return ok(hours);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. CATEGORY CONTROLLER
// ═════════════════════════════════════════════════════════════════════════════

export abstract class CategoryController {
  static async list() {
    const categories = await CategoryService.list();
    return ok(categories);
  }

  static async getById(id: string) {
    const category = await CategoryService.getById(id);
    return ok(category);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. SHOP TYPE CONTROLLER
// ═════════════════════════════════════════════════════════════════════════════

export abstract class ShopTypeController {
  static async list() {
    const types = await ShopTypeService.list();
    return ok(types);
  }
}
