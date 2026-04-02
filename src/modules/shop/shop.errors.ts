/**
 * modules/shop/shop.errors.ts
 *
 * Domain-specific error factories for the shop module.
 */

import { AppError } from "../../core/errors";

const MODULE = "shop";

export const ShopErrors = {
  Common: {
    notFound: (msg = "Resource not found") =>
      new AppError(404, "NOT_FOUND", msg, { module: MODULE }),
    badRequest: (msg = "Invalid request") =>
      new AppError(400, "BAD_REQUEST", msg, { module: MODULE }),
    internal: (msg = "Internal shop error") =>
      new AppError(500, "INTERNAL_ERROR", msg, { module: MODULE }),
  },

  Shop: {
    notFound: (msg = "Shop not found") =>
      new AppError(404, "SHOP_NOT_FOUND", msg, {
        module: MODULE,
        action: "get_shop",
      }),
    alreadyExists: (msg = "Shop already exists") =>
      new AppError(409, "SHOP_ALREADY_EXISTS", msg, {
        module: MODULE,
        action: "create_shop",
      }),
    invalidStatus: (msg = "Invalid shop status transition") =>
      new AppError(400, "INVALID_SHOP_STATUS", msg, {
        module: MODULE,
        action: "update_status",
      }),
    ownershipRequired: (msg = "Only the shop owner or admin can perform this action") =>
      new AppError(403, "FORBIDDEN", msg, {
        module: MODULE,
        action: "authorization",
      }),
  },

  Branch: {
    notFound: (msg = "Branch not found") =>
      new AppError(404, "BRANCH_NOT_FOUND", msg, {
        module: MODULE,
        action: "get_branch",
      }),
    limitExceeded: (msg = "Maximum branch limit reached for this shop") =>
      new AppError(400, "BRANCH_LIMIT_EXCEEDED", msg, {
        module: MODULE,
        action: "create_branch",
      }),
  },

  Category: {
    notFound: (msg = "Category not found") =>
      new AppError(404, "CATEGORY_NOT_FOUND", msg, {
        module: MODULE,
        action: "get_category",
      }),
    depthExceeded: (msg = "Category depth exceeds permitted limit") =>
      new AppError(400, "CATEGORY_DEPTH_EXCEEDED", msg, {
        module: MODULE,
        action: "create_category",
      }),
  },

  Hours: {
    overlap: (msg = "Operating hours overlap with an existing slot") =>
      new AppError(400, "HOURS_OVERLAP", msg, {
        module: MODULE,
        action: "set_hours",
      }),
    invalidRange: (msg = "Closing time must be after opening time") =>
      new AppError(400, "INVALID_HOURS_RANGE", msg, {
        module: MODULE,
        action: "set_hours",
      }),
  },
};
