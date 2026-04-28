/**
 * modules/shop/shop.errors.ts
 *
 * Domain-specific error factories for the shop module.
 * Mirrors platform.errors.ts and profile.errors.ts conventions: namespaced classes, AppError base.
 */

import { AppError } from "../../core/errors";
import type { ErrorMeta } from "../../core/errors";

// ── Helper ────────────────────────────────────────────────────────────────────

function meta(action: string): ErrorMeta {
  return { module: "shop", action };
}

// ── Common ────────────────────────────────────────────────────────────────────

class Common {
  static notFound(msg = "Resource not found") {
    return new AppError(404, "NOT_FOUND", msg, meta("find_resource"));
  }

  static badRequest(msg = "Invalid request") {
    return new AppError(400, "BAD_REQUEST", msg, meta("request"));
  }

  static validation(msg = "Invalid input") {
    return new AppError(422, "VALIDATION_ERROR", msg, meta("validate"));
  }

  static internal(msg = "Internal shop error") {
    return new AppError(500, "INTERNAL_ERROR", msg, meta("internal"));
  }
}

// ── Shop ──────────────────────────────────────────────────────────────────────

class Shop {
  static notFound(msg = "Shop not found") {
    return new AppError(404, "SHOP_NOT_FOUND", msg, meta("get_shop"));
  }

  static alreadyExists(msg = "Shop already exists") {
    return new AppError(409, "SHOP_ALREADY_EXISTS", msg, meta("create_shop"));
  }

  static invalidStatus(msg = "Invalid shop status transition") {
    return new AppError(400, "INVALID_SHOP_STATUS", msg, meta("update_status"));
  }

  static ownershipRequired(
    msg = "Only the shop owner or admin can perform this action",
  ) {
    return new AppError(403, "FORBIDDEN", msg, meta("authorization"));
  }
}

// ── Branch ────────────────────────────────────────────────────────────────────

class Branch {
  static notFound(msg = "Branch not found") {
    return new AppError(404, "BRANCH_NOT_FOUND", msg, meta("get_branch"));
  }

  static limitExceeded(msg = "Maximum branch limit reached for this shop") {
    return new AppError(400, "BRANCH_LIMIT_EXCEEDED", msg, meta("create_branch"));
  }
}

// ── PreCategory ───────────────────────────────────────────────────────────────

class PreCategory {
  static notFound(msg = "Platform category not found") {
    return new AppError(404, "PRE_CATEGORY_NOT_FOUND", msg, meta("get_pre_category"));
  }

  static alreadyExists(msg = "Platform category already exists") {
    return new AppError(
      409,
      "PRE_CATEGORY_ALREADY_EXISTS",
      msg,
      meta("create_pre_category"),
    );
  }
}

// ── Category ──────────────────────────────────────────────────────────────────

class Category {
  static notFound(msg = "Category not found") {
    return new AppError(404, "CATEGORY_NOT_FOUND", msg, meta("get_category"));
  }

  static alreadyExists(msg = "Category already exists in this shop") {
    return new AppError(409, "CATEGORY_ALREADY_EXISTS", msg, meta("create_category"));
  }

  static depthExceeded(msg = "Category depth exceeds permitted limit (max 3)") {
    return new AppError(
      400,
      "CATEGORY_DEPTH_EXCEEDED",
      msg,
      meta("create_category"),
    );
  }

  static parentNotFound(msg = "Parent category not found") {
    return new AppError(
      404,
      "CATEGORY_PARENT_NOT_FOUND",
      msg,
      meta("create_category"),
    );
  }
}

// ── Hours ─────────────────────────────────────────────────────────────────────

class Hours {
  static overlap(msg = "Operating hours overlap with an existing slot") {
    return new AppError(400, "HOURS_OVERLAP", msg, meta("set_hours"));
  }

  static invalidRange(msg = "Closing time must be after opening time") {
    return new AppError(400, "INVALID_HOURS_RANGE", msg, meta("set_hours"));
  }
}

class ShopType {
  static alreadyExist(msg = 'Shop type already exist try different name') {
    return new AppError(409, 'SHOP_TYPE_ALREADY_EXISTS', msg, meta('create_shop_type'));
  }
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const ShopErrors = {
  Common,
  Shop,
  Branch,
  PreCategory,
  Category,
  Hours,
  ShopType,
} as const;
