/**
 * modules/shop/shop.service.ts
 *
 * Business logic layer for the shop module.
 */

import { sql } from "drizzle-orm";
import type { DB } from "../../db/index";
import { ShopErrors } from "./shop.errors";
import { uniqueSlug } from "../../utils/slug";

import {
  BranchRepository,
  CategoryRepository,
  HoursRepository,
  PreCategoryRepository,
  ShopRepository,
  ShopTypeRepository,
} from "./shop.repository";

import { AuditLogRepository } from "../auth/auth.repository";

import type {
  CreateBranchRequest,
  CreateCategoryRequest,
  CreatePreCategoryRequest,
  CreateShopRequest,
  CreateShopTypeRequest,
  Pagination,
  SetOperatingHoursRequest,
  UpdateBranchRequest,
  UpdateShopRequest,
} from "./shop.schema";

import { coordsToH3Multi } from "../../utils/h3";
import {
  categoriesTable,
  preCategoriesTable,
  shopsTable,
  shopTypeTable,
} from "../../db/schema";
import { AddressRepository } from "../profile/profile.repository";

// ── Actor types ──────────────────────────────────────────────────────────────

type ActorMeta = { actorId: string; actorRoles: string[]; ip: string };
type AdminMeta = ActorMeta;

export interface ShopRepositories {
  auditRepo: AuditLogRepository;
  shopTypeRepo: ShopTypeRepository;
  preCategoryRepo: PreCategoryRepository;
  categoryRepo: CategoryRepository;
  shopRepo: ShopRepository;
  branchRepo: BranchRepository;
  hoursRepo: HoursRepository;
  addressRepo: AddressRepository;
}

export class ShopTypeServiceImpl {
  constructor(private readonly repos: ShopRepositories) { }

  async list() {
    return await this.repos.shopTypeRepo.list();
  }

  async getById(id: string) {
    const type = await this.repos.shopTypeRepo.findById(id);
    if (!type) throw ShopErrors.Common.notFound("Shop type not found");
    return type;
  }

  async create(data: CreateShopTypeRequest, adminMeta: AdminMeta) {
    const existing = await this.repos.shopTypeRepo.findByName(data.name);
    if (existing) throw ShopErrors.ShopType.alreadyExist();

    const slug = await uniqueSlug(data.name, shopTypeTable, shopTypeTable.slug);

    const created = await this.repos.shopTypeRepo.create({
      name: data.name,
      slug,
      iconKey: data.iconKey,
    });

    await this.repos.auditRepo.create({
      action: "create_shop_type",
      actorId: adminMeta.actorId,
      actorRole: adminMeta.actorRoles[0] as any,
      actorIp: adminMeta.ip,
      resourceId: created.id,
      resource: "shop_type",
      metadata: { name: data.name, slug },
    });

    return created;
  }
}

export class PreCategoryServiceImpl {
  constructor(private readonly repos: ShopRepositories) { }

  async list() {
    return await this.repos.preCategoryRepo.list();
  }

  async getById(id: string) {
    const cat = await this.repos.preCategoryRepo.findById(id);
    if (!cat) throw ShopErrors.PreCategory.notFound();
    return cat;
  }

  async create(data: CreatePreCategoryRequest, adminMeta: AdminMeta) {
    const existing = await this.repos.preCategoryRepo.findByName(data.name);
    if (existing) throw ShopErrors.PreCategory.alreadyExists();

    const slug = await uniqueSlug(
      data.name,
      preCategoriesTable,
      preCategoriesTable.slug,
    );

    const created = await this.repos.preCategoryRepo.create({
      name: data.name,
      slug,
      description: data.description,
      iconKey: data.iconKey,
      sortOrder: data.sortOrder,
    });

    await this.repos.auditRepo.create({
      action: "create_pre_category",
      actorId: adminMeta.actorId,
      actorRole: adminMeta.actorRoles[0] as any,
      actorIp: adminMeta.ip,
      resourceId: created.id,
      resource: "pre_category",
      metadata: { name: data.name, slug },
    });

    return created;
  }
}

export class CategoryServiceImpl {
  constructor(private readonly repos: ShopRepositories) { }

  async listByShop(shopId: string) {
    return await this.repos.categoryRepo.listByShop(shopId);
  }

  async getById(id: string) {
    const cat = await this.repos.categoryRepo.findById(id);
    if (!cat) throw ShopErrors.Category.notFound();
    return cat;
  }

  async create(shopId: string, data: CreateCategoryRequest, actor: ActorMeta) {
    const shop = await this.repos.shopRepo.findById(shopId);
    if (!shop) throw ShopErrors.Shop.notFound();

    const existing = await this.repos.categoryRepo.findByName(shopId, data.name);
    if (existing) throw ShopErrors.Category.alreadyExists();

    let level = 1;
    if (data.parentId) {
      const parent = await this.repos.categoryRepo.findById(data.parentId);
      if (!parent) throw ShopErrors.Category.parentNotFound();
      if (parent.shopId !== shopId) throw ShopErrors.Category.parentNotFound();
      if (parent.level >= 3) throw ShopErrors.Category.depthExceeded();
      level = parent.level + 1;
    }

    const slug = await uniqueSlug(
      data.name,
      categoriesTable,
      categoriesTable.slug,
      shopId,
    );

    const created = await this.repos.categoryRepo.create({
      shopId,
      parentId: data.parentId,
      name: data.name,
      slug,
      description: data.description,
      imageKey: data.imageKey,
      level,
      sortOrder: data.sortOrder,
    });

    await this.repos.auditRepo.create({
      action: "create_category",
      actorId: actor.actorId,
      actorRole: actor.actorRoles[0] as any,
      actorIp: actor.ip,
      resourceId: created.id,
      resource: "category",
      metadata: { name: data.name, slug, shopId },
    });

    return created;
  }
}


export class ShopServiceImpl {
  constructor(
    private readonly db: DB,
    private readonly repos: ShopRepositories,
  ) { }

  async create(data: CreateShopRequest, actor: ActorMeta) {
    // Generate slug from name
    const slug = await uniqueSlug(data.name, shopsTable, shopsTable.slug);

    // Check username uniqueness
    if (await this.repos.shopRepo.findByUsername(data.username)) {
      throw ShopErrors.Shop.alreadyExists("Username already taken");
    }

    const address = await this.repos.addressRepo.findById(data.primaryAddressId);

    const created = await this.repos.shopRepo.create({
      ...data,
      slug,
      ownerId: actor.actorId,
      status: "draft",


    });

    await this.repos.auditRepo.create({
      action: "create_shop",
      actorId: actor.actorId,
      actorRole: actor.actorRoles[0] as any,
      actorIp: actor.ip,
      resourceId: created.id,
      resource: "shop",
      metadata: { name: data.name, slug, username: data.username },
    });

    return created;
  }

  async getById(id: string) {
    const shop = await this.repos.shopRepo.findById(id);
    if (!shop) throw ShopErrors.Shop.notFound();
    return shop;
  }

  async getBySlug(slug: string) {
    const shop = await this.repos.shopRepo.findBySlug(slug);
    if (!shop) throw ShopErrors.Shop.notFound();
    return shop;
  }

  async list(pagination: Pagination) {
    return await this.repos.shopRepo.list(pagination);
  }

  async update(id: string, data: UpdateShopRequest, actor: ActorMeta) {
    const shop = await this.getById(id);
    if (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin")) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    // prevent users from changing status/owner via normal update
    const { status, ownerId, ...allowedData } = data as any;

    let h3;
    if (
      allowedData.latitude !== undefined &&
      allowedData.longitude !== undefined
    ) {
      h3 = coordsToH3Multi(allowedData.latitude, allowedData.longitude);
    }

    const updated = await this.repos.shopRepo.update(id, { ...allowedData, h3 });

    await this.repos.auditRepo.create({
      action: "update_shop",
      actorId: actor.actorId,
      actorRole: actor.actorRoles[0] as any,
      actorIp: actor.ip,
      resourceId: id,
      resource: "shop",
      metadata: { changes: Object.keys(allowedData) },
    });

    return updated;
  }

  async updateStatus(id: string, status: string, actor: ActorMeta) {
    if (!actor.actorRoles.includes("admin")) {
      throw ShopErrors.Shop.ownershipRequired(
        "Admin access required for status updates",
      );
    }

    const shop = await this.getById(id);
    const updated = await this.repos.shopRepo.update(id, { status } as any);

    await this.repos.auditRepo.create({
      action: "update_shop_status",
      actorId: actor.actorId,
      actorRole: actor.actorRoles[0] as any,
      actorIp: actor.ip,
      resourceId: id,
      resource: "shop",
      metadata: { from: shop.status, to: status },
    });

    return updated;
  }

  async softDelete(id: string, actor: ActorMeta) {
    const shop = await this.getById(id);
    if (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin")) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    // Cascade delete branches
    const branches = await this.repos.branchRepo.listByShop(id);
    for (const b of branches) {
      await this.repos.branchRepo.delete(b.id);
    }

    const deleted = await this.repos.shopRepo.softDelete(id);

    await this.repos.auditRepo.create({
      action: "delete_shop",
      actorId: actor.actorId,
      actorRole: actor.actorRoles[0] as any,
      actorIp: actor.ip,
      resourceId: id,
      resource: "shop",
      metadata: { name: shop.name, username: shop.username },
    });

    return deleted;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. BRANCH SERVICE
// ═════════════════════════════════════════════════════════════════════════════

export class BranchServiceImpl {
  constructor(private readonly repos: ShopRepositories) { }

  async create(shopId: string, data: CreateBranchRequest, actor: ActorMeta) {
    const shop = await this.repos.shopRepo.findById(shopId);
    if (!shop) throw ShopErrors.Shop.notFound();
    if (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin")) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    const h3 = coordsToH3Multi(data.latitude, data.longitude);
    return await this.repos.branchRepo.create({ ...data, shopId, h3 });
  }

  async listByShop(shopId: string) {
    return await this.repos.branchRepo.listByShop(shopId);
  }

  async getById(id: string) {
    const branch = await this.repos.branchRepo.findById(id);
    if (!branch) throw ShopErrors.Branch.notFound();
    return branch;
  }

  async update(id: string, data: UpdateBranchRequest, actor: ActorMeta) {
    const branch = await this.getById(id);
    const shop = await this.repos.shopRepo.findById(branch.shopId);
    if (
      !shop ||
      (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin"))
    ) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    // prevent status override
    const { isActive, ...allowedData } = data as any;

    let h3;
    if (
      allowedData.latitude !== undefined &&
      allowedData.longitude !== undefined
    ) {
      h3 = coordsToH3Multi(allowedData.latitude, allowedData.longitude);
    }

    return await this.repos.branchRepo.update(id, { ...allowedData, h3 });
  }

  async delete(id: string, actor: ActorMeta) {
    const branch = await this.getById(id);
    const shop = await this.repos.shopRepo.findById(branch.shopId);
    if (
      !shop ||
      (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin"))
    ) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    return await this.repos.branchRepo.delete(id);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. HOURS SERVICE
// ═════════════════════════════════════════════════════════════════════════════

export class HoursServiceImpl {
  constructor(
    private readonly db: DB,
    private readonly repos: ShopRepositories,
  ) { }

  async setHours(
    shopId: string,
    data: SetOperatingHoursRequest,
    actor: ActorMeta,
  ) {
    const shop = await this.repos.shopRepo.findById(shopId);
    if (!shop) throw ShopErrors.Shop.notFound();
    if (shop.ownerId !== actor.actorId && !actor.actorRoles.includes("admin")) {
      throw ShopErrors.Shop.ownershipRequired();
    }

    return await this.db.transaction(async (tx) => {
      const results = [];
      for (const h of data.hours) {
        results.push(
          await this.repos.hoursRepo.upsert(
            {
              ...h,
              shopId,
              isClosed: h.isClosed ?? false,
              isOvernight: h.isOvernight ?? false,
            },
            tx,
          ),
        );
      }
      return results;
    });
  }

  async listByShop(shopId: string) {
    return await this.repos.hoursRepo.listByShop(shopId);
  }
}

const auditRepo = new AuditLogRepository(db);
const shopRepo = new ShopRepository(db);
const branchRepo = new BranchRepository(db);
const shopTypeRepo = new ShopTypeRepository(db);
const preCategoryRepo = new PreCategoryRepository(db);
const categoryRepo = new CategoryRepository(db);
const hoursRepo = new HoursRepository(db);

const repos: ShopRepositories = {
  auditRepo,
  shopRepo,
  branchRepo,
  shopTypeRepo,
  preCategoryRepo,
  categoryRepo,
  hoursRepo,
};

export const ShopService = new ShopServiceImpl(db, repos);
export const BranchService = new BranchServiceImpl(repos);
export const ShopTypeService = new ShopTypeServiceImpl(repos);
export const PreCategoryService = new PreCategoryServiceImpl(repos);
export const CategoryService = new CategoryServiceImpl(repos);
export const HoursService = new HoursServiceImpl(db, repos);
