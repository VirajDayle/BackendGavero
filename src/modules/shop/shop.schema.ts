/**
 * modules/shop/shop.schema.ts
 *
 * Zod schemas for the shop module.
 * Used for validation (controller) and documentation (TypeBox conversion in routes).
 */

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import {
  shopsTable,
  shopBranchesTable,
  preCategoriesTable,
  shopHolidaysTable,
  shopHoursTable,
  shopTypeTable,
} from "../../db/schema";
import { Static, t } from "elysia";
import { min } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();
const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "Slug must be kebab-case");

// ---------------------------------------------------------------------------
// 1. Shop Types
// ---------------------------------------------------------------------------

export const shopTypeSelectSchema = createSelectSchema(shopTypeTable);
export type ShopType = z.infer<typeof shopTypeSelectSchema>;

export const shopTypeInsertSchema = createInsertSchema(shopTypeTable, {
  slug: () => slugSchema,
});
export type ShopTypeInsert = z.infer<typeof shopTypeInsertSchema>;

// ---------------------------------------------------------------------------
// 2. Shop Categories
// ---------------------------------------------------------------------------

export const shopCategorySelectSchema = createSelectSchema(preCategoriesTable);
export type ShopCategory = z.infer<typeof shopCategorySelectSchema>;

export const shopCategoryInsertSchema = createInsertSchema(preCategoriesTable, {
  slug: () => slugSchema,
});
export type ShopCategoryInsert = z.infer<typeof shopCategoryInsertSchema>;

// ---------------------------------------------------------------------------
// 3. Shops
// ---------------------------------------------------------------------------

export const shopSelectSchema = createSelectSchema(shopsTable, {
  settings: () => z.record(z.string(), z.unknown()).nullable(),
});
export type Shop = z.infer<typeof shopSelectSchema>;

export const shopInsertSchema = createInsertSchema(shopsTable, {
  slug: () => slugSchema,
  settings: () => z.record(z.string(), z.unknown()).optional(),
});
export type ShopInsert = z.infer<typeof shopInsertSchema>;

export const shopUpdateSchema = createUpdateSchema(shopsTable, {
  settings: () => z.record(z.string(), z.unknown()).optional(),
});
export type ShopUpdate = z.infer<typeof shopUpdateSchema>;

// ---------------------------------------------------------------------------
// 4. Branches
// ---------------------------------------------------------------------------

export const branchSelectSchema = createSelectSchema(shopBranchesTable, {
  settings: () => z.record(z.string(), z.unknown()).nullable(),
});
export type Branch = z.infer<typeof branchSelectSchema>;

export const branchInsertSchema = createInsertSchema(shopBranchesTable, {
  settings: () => z.record(z.string(), z.unknown()).optional(),
});
export type BranchInsert = z.infer<typeof branchInsertSchema>;

// ---------------------------------------------------------------------------
// 5. Operating Hours
// ---------------------------------------------------------------------------

export const shopOperatingHoursSelectSchema =
  createSelectSchema(shopHoursTable);
export type ShopOperatingHours = z.infer<typeof shopOperatingHoursSelectSchema>;

export const shopOperatingHoursInsertSchema =
  createInsertSchema(shopHoursTable);
export type ShopOperatingHoursInsert = z.infer<
  typeof shopOperatingHoursInsertSchema
>;

// ---------------------------------------------------------------------------
// 6. Request / Response Composite Schemas
// ---------------------------------------------------------------------------

export const createShopRequestSchema = z.object({
  name: z.string().min(1).max(150),
  shopTypeId: uuidSchema,
  username: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  tagLine: z.string().max(200).optional(),
  primaryAddressId: uuidSchema,
});
export type CreateShopRequest = z.infer<typeof createShopRequestSchema>;

export const updateShopRequestSchema = createShopRequestSchema.partial();
export type UpdateShopRequest = z.infer<typeof updateShopRequestSchema>;

export const createBranchRequestSchema = z.object({
  name: z.string().min(1).max(150),
  phone: z.string().min(10).max(20).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressId: uuidSchema.optional(),
});
export type CreateBranchRequest = z.infer<typeof createBranchRequestSchema>;

export const updateBranchRequestSchema = createBranchRequestSchema.partial();
export type UpdateBranchRequest = z.infer<typeof updateBranchRequestSchema>;

export const setOperatingHoursRequestSchema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6), // 0=Sunday
      openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
      closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
      isClosed: z.boolean().optional(),
      isOvernight: z.boolean().optional(),
    }),
  ),
});
export type SetOperatingHoursRequest = z.infer<
  typeof setOperatingHoursRequestSchema
>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const CreateShopTypeBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.String({ minLength: 1, maxLength: 255 }),
  iconKey: t.String(),
});

export type CreateShopTypeRequest = Static<typeof CreateShopTypeBody>;

export const CreatePreCategoryBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  iconKey: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number()),
});
export type CreatePreCategoryRequest = Static<typeof CreatePreCategoryBody>;

export const CreateCategoryBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  parentId: t.Optional(t.String({ format: "uuid" })),
  imageKey: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number()),
});
export type CreateCategoryRequest = Static<typeof CreateCategoryBody>;


