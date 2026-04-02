/**
 * modules/shop/shop.service.ts
 *
 * Business logic layer for the shop module.
 */

import { sql } from "drizzle-orm";
import type { DB } from "../../db/index";
import { ShopErrors } from "./shop.errors";
import {
  BranchRepository,
  CategoryRepository,
  HoursRepository,
  ShopRepository,
  ShopTypeRepository,
} from "./shop.repository";
import type {
  CreateBranchRequest,
  CreateShopRequest,
  Pagination,
  SetOperatingHoursRequest,
  UpdateBranchRequest,
  UpdateShopRequest,
} from "./shop.schema";
import { coordsToH3Multi } from "../../utils/h3";

// ── Actor types ──────────────────────────────────────────────────────────────

interface Actor {
  actorId: string;
  actorRoles: string[];
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. SHOP SERVICE
// ═════════════════════════════════════════════════════════════════════════════

export class ShopServiceImpl {
  constructor(
    private readonly db: DB,
    private readonly shopRepo: ShopRepository,
    private readonly branchRepo: BranchRepository,
  ) { }

  async create(data: CreateShopRequest, actor: Actor) {
    // Generate slug from name
    const baseSlug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check slug uniqueness within shop type? 
    // Actually, shopsTable has unique index on (shop_type_id, slug)
    let slug = baseSlug;
    let counter = 1;
    while (await this.shopRepo.findBySlug(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Check username uniqueness
    if (await this.shopRepo.findByUsername(data.username)) {
      throw ShopErrors.Shop.alreadyExists("Username already taken");
    }

    return await this.shopRepo.create({
      ...data,
      slug,
      ownerId: actor.actorId,
      status: "draft",
    });
  }

  async getById(id: string) {
    const shop = await this.shopRepo.findById(id);
    if (!shop) throw ShopErrors.Shop.notFound();
    return shop;
  }

  async getBySlug(slug: string) {
    const shop = await this.shopRepo.findBySlug(slug);
    if (!shop) throw ShopErrors.Shop.notFound();
    return shop;
  }

  async list(pagination: Pagination) {
    return await this.shopRepo.list(pagination);
  }

  async update(id: string, data: UpdateShopRequest, actor: Actor) {
    const shop = await this.getById(id);
    if (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin")) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    // prevent users from changing status/owner via normal update
    const { status, ownerId, ...allowedData } = data as any;

    let h3;
    if (allowedData.latitude !== undefined && allowedData.longitude !== undefined) {
      h3 = coordsToH3Multi(allowedData.latitude, allowedData.longitude);
    }

    return await this.shopRepo.update(id, { ...allowedData, h3 });
  }

  async updateStatus(id: string, status: string, actor: Actor) {
    if (!actor.actorRoles.includes("admin")) {
      throw ShopErrors.Shop.ownershipRequired("Admin access required for status updates");
    }

    const shop = await this.getById(id);
    return await this.shopRepo.update(id, { status } as any);
  }

  async softDelete(id: string, actor: Actor) {
    const shop = await this.getById(id);
    if (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin")) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    // Cascade delete branches
    const branches = await this.branchRepo.listByShop(id);
    for (const b of branches) {
      await this.branchRepo.delete(b.id);
    }

    return await this.shopRepo.softDelete(id);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. BRANCH SERVICE
// ═════════════════════════════════════════════════════════════════════════════

export class BranchServiceImpl {
  constructor(
    private readonly db: DB,
    private readonly branchRepo: BranchRepository,
    private readonly shopRepo: ShopRepository,
  ) { }

  async create(shopId: string, data: CreateBranchRequest, actor: Actor) {
    const shop = await this.shopRepo.findById(shopId);
    if (!shop) throw ShopErrors.Shop.notFound();
    if (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin")) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    const h3 = coordsToH3Multi(data.latitude, data.longitude);
    return await this.branchRepo.create({ ...data, shopId, h3 });
  }

  async listByShop(shopId: string) {
    return await this.branchRepo.listByShop(shopId);
  }

  async getById(id: string) {
    const branch = await this.branchRepo.findById(id);
    if (!branch) throw ShopErrors.Branch.notFound();
    return branch;
  }

  async update(id: string, data: UpdateBranchRequest, actor: Actor) {
    const branch = await this.getById(id);
    const shop = await this.shopRepo.findById(branch.shopId);
    if (!shop || (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin"))) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    // prevent status override
    const { isActive, ...allowedData } = data as any;

    let h3;
    if (allowedData.latitude !== undefined && allowedData.longitude !== undefined) {
      h3 = coordsToH3Multi(allowedData.latitude, allowedData.longitude);
    }

    return await this.branchRepo.update(id, { ...allowedData, h3 });
  }

  async delete(id: string, actor: Actor) {
    const branch = await this.getById(id);
    const shop = await this.shopRepo.findById(branch.shopId);
    if (!shop || (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin"))) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    return await this.branchRepo.delete(id);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. HOURS SERVICE
// ═════════════════════════════════════════════════════════════════════════════

export class HoursServiceImpl {
  constructor(
    private readonly db: DB,
    private readonly hoursRepo: HoursRepository,
    private readonly shopRepo: ShopRepository,
  ) { }

  async setHours(shopId: string, data: SetOperatingHoursRequest, actor: Actor) {
    const shop = await this.shopRepo.findById(shopId);
    if (!shop) throw ShopErrors.Shop.notFound();
    if (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin")) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    return await this.db.transaction(async (tx) => {
      const results = [];
      for (const h of data.hours) {
        // Note: HoursRepository needs a way to use the transaction 'tx'
        // Alternatively, we can pass 'tx' to the upsert method if we refactor it.
        // For now, I'll pass it if the repo supports it, or I'll use the tx directly.
        results.push(await this.hoursRepo.upsert({
          ...h,
          shopId,
          isClosed: h.isClosed ?? false,
          isOvernight: h.isOvernight ?? false,
        }, tx));
      }
      return results;
    });
  }

  async listByShop(shopId: string) {
    return await this.hoursRepo.listByShop(shopId);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. CATEGORY SERVICE
// ═════════════════════════════════════════════════════════════════════════════

export class CategoryServiceImpl {
  constructor(private readonly categoryRepo: CategoryRepository) { }

  async list() {
    return await this.categoryRepo.list();
  }

  async getById(id: string) {
    const cat = await this.categoryRepo.findById(id);
    if (!cat) throw ShopErrors.Category.notFound();
    return cat;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. SHOP TYPE SERVICE
// ═════════════════════════════════════════════════════════════════════════════

export class ShopTypeServiceImpl {
  constructor(private readonly typeRepo: ShopTypeRepository) { }

  async list() {
    return await this.typeRepo.list();
  }

  async getById(id: string) {
    const type = await this.typeRepo.findById(id);
    if (!type) throw ShopErrors.Common.notFound("Shop type not found");
    return type;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

import { db } from "../../db/index";

const shopRepo = new ShopRepository(db);
const branchRepo = new BranchRepository(db);
const typeRepo = new ShopTypeRepository(db);
const categoryRepo = new CategoryRepository(db);
const hoursRepo = new HoursRepository(db);

export const ShopService = new ShopServiceImpl(db, shopRepo, branchRepo);
export const BranchService = new BranchServiceImpl(db, branchRepo, shopRepo);
export const CategoryService = new CategoryServiceImpl(categoryRepo);
export const ShopTypeService = new ShopTypeServiceImpl(typeRepo);
export const HoursService = new HoursServiceImpl(db, hoursRepo, shopRepo);
