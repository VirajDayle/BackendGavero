/**
 * modules/catalog/catalog.errors.ts
 *
 * Centralized, production-grade error factories for the catalog module.
 * Mirrors profile.errors.ts conventions: namespaced classes, AppError base.
 */

import { AppError } from "../../core/errors";
import type { ErrorMeta } from "../../core/errors";

// ── Helper ────────────────────────────────────────────────────────────────────

function meta(action: string): ErrorMeta {
  return { module: "catalog", action };
}

// ── Common ────────────────────────────────────────────────────────────────────

class Common {
  static notFound(msg = "Resource not found") {
    return new AppError(404, "NOT_FOUND", msg, meta("find"));
  }

  static badRequest(msg = "Invalid request") {
    return new AppError(400, "BAD_REQUEST", msg, meta("validate"));
  }

  static validation(msg = "Invalid input") {
    return new AppError(422, "VALIDATION_ERROR", msg, meta("validate"));
  }

  static forbidden(msg = "Insufficient permissions") {
    return new AppError(403, "FORBIDDEN", msg, meta("authorize"));
  }

  static internal(msg = "Internal catalog error") {
    return new AppError(500, "INTERNAL_ERROR", msg, meta("internal"));
  }

  static adminRequired(msg = "Admin access required") {
    return Common.forbidden(msg);
  }
}

// ── Brand ─────────────────────────────────────────────────────────────────────

class Brand {
  static notFound(msg = "Brand not found") {
    return new AppError(404, "BRAND_NOT_FOUND", msg, meta("find_brand"));
  }

  static slugConflict(msg = "Brand slug already exists") {
    return new AppError(409, "BRAND_SLUG_CONFLICT", msg, meta("create_brand"));
  }

  static invalidHierarchy(msg = "Invalid brand hierarchy") {
    return new AppError(
      400,
      "BRAND_INVALID_HIERARCHY",
      msg,
      meta("validate_brand"),
    );
  }
}

// ── Master Product ────────────────────────────────────────────────────────────

class MasterProduct {
  static notFound(msg = "Master product not found") {
    return new AppError(
      404,
      "MASTER_PRODUCT_NOT_FOUND",
      msg,
      meta("find_master_product"),
    );
  }

  static slugConflict(msg = "Master product slug already exists") {
    return new AppError(
      409,
      "MASTER_PRODUCT_SLUG_CONFLICT",
      msg,
      meta("create_master_product"),
    );
  }

  static skuConflict(msg = "Global SKU already exists") {
    return new AppError(
      409,
      "MASTER_PRODUCT_SKU_CONFLICT",
      msg,
      meta("create_master_product"),
    );
  }

  static gtinConflict(msg = "GTIN already exists") {
    return new AppError(
      409,
      "MASTER_PRODUCT_GTIN_CONFLICT",
      msg,
      meta("create_master_product"),
    );
  }

  static invalidStatus(msg = "Invalid master product status transition") {
    return new AppError(
      400,
      "INVALID_SHOP_STATUS",
      msg,
      meta("update_master_product_status"),
    );
  }
}

// ── Shop Product ──────────────────────────────────────────────────────────────

class ShopProduct {
  static notFound(msg = "Shop product not found") {
    return new AppError(
      404,
      "SHOP_PRODUCT_NOT_FOUND",
      msg,
      meta("find_shop_product"),
    );
  }

  static slugConflict(msg = "Product slug already exists in this shop") {
    return new AppError(
      409,
      "SHOP_PRODUCT_SLUG_CONFLICT",
      msg,
      meta("create_shop_product"),
    );
  }

  static invalidSource(
    msg = "Invalid product source: master requires masterProductId, custom forbids it",
  ) {
    return new AppError(
      400,
      "SHOP_PRODUCT_INVALID_SOURCE",
      msg,
      meta("create_shop_product"),
    );
  }

  static inventoryViolation(msg = "Inventory constraint violated") {
    return new AppError(
      400,
      "SHOP_PRODUCT_INVENTORY_VIOLATION",
      msg,
      meta("update_stock"),
    );
  }

  static ownershipRequired(
    msg = "Only the shop owner or admin can perform this action",
  ) {
    return new AppError(403, "FORBIDDEN", msg, meta("authorization"));
  }
}

// ── Variant ───────────────────────────────────────────────────────────────────

class Variant {
  static notFound(msg = "Product variant not found") {
    return new AppError(404, "VARIANT_NOT_FOUND", msg, meta("find_variant"));
  }

  static skuConflict(msg = "Variant SKU already exists") {
    return new AppError(
      409,
      "VARIANT_SKU_CONFLICT",
      msg,
      meta("create_variant"),
    );
  }
}

// ── Image ─────────────────────────────────────────────────────────────────────

class Image {
  static notFound(msg = "Product image not found") {
    return new AppError(404, "IMAGE_NOT_FOUND", msg, meta("find_image"));
  }

  static limitExceeded(msg = "Maximum number of images exceeded") {
    return new AppError(400, "IMAGE_LIMIT_EXCEEDED", msg, meta("add_image"));
  }
}

// ── Price ─────────────────────────────────────────────────────────────────────

class Price {
  static notFound(msg = "Price record not found") {
    return new AppError(404, "PRICE_NOT_FOUND", msg, meta("find_price"));
  }

  static invalidDiscount(msg = "Invalid discount configuration") {
    return new AppError(400, "PRICE_INVALID_DISCOUNT", msg, meta("set_price"));
  }

  static sellingExceedsMrp(msg = "Selling price cannot exceed MRP") {
    return new AppError(
      400,
      "PRICE_SELLING_EXCEEDS_MRP",
      msg,
      meta("set_price"),
    );
  }

  static overlappingActive(
    msg = "An active price for this product/variant/currency already exists",
  ) {
    return new AppError(
      409,
      "PRICE_OVERLAPPING_ACTIVE",
      msg,
      meta("set_price"),
    );
  }
}

// ── Pricing Tier ──────────────────────────────────────────────────────────────

class PricingTier {
  static overlappingRange(
    msg = "Quantity range overlaps with an existing tier",
  ) {
    return new AppError(
      409,
      "PRICING_TIER_OVERLAPPING",
      msg,
      meta("create_pricing_tier"),
    );
  }

  static invalidTierType(msg = "Invalid tier type configuration") {
    return new AppError(
      400,
      "PRICING_TIER_INVALID_TYPE",
      msg,
      meta("create_pricing_tier"),
    );
  }
}

// ── Collection ────────────────────────────────────────────────────────────────

class Collection {
  static notFound(msg = "Collection not found") {
    return new AppError(
      404,
      "COLLECTION_NOT_FOUND",
      msg,
      meta("find_collection"),
    );
  }

  static slugConflict(msg = "Collection slug already exists in this shop") {
    return new AppError(
      409,
      "COLLECTION_SLUG_CONFLICT",
      msg,
      meta("create_collection"),
    );
  }
}

// ── Bundle ────────────────────────────────────────────────────────────────────

class Bundle {
  static notFound(msg = "Bundle not found") {
    return new AppError(404, "BUNDLE_NOT_FOUND", msg, meta("find_bundle"));
  }

  static slugConflict(msg = "Bundle slug already exists in this shop") {
    return new AppError(
      409,
      "BUNDLE_SLUG_CONFLICT",
      msg,
      meta("create_bundle"),
    );
  }

  static itemConflict(msg = "This product is already in the bundle") {
    return new AppError(
      409,
      "BUNDLE_ITEM_CONFLICT",
      msg,
      meta("add_bundle_item"),
    );
  }
}

// ── Product Link ──────────────────────────────────────────────────────────────

class ProductLink {
  static notFound(msg = "Product link not found") {
    return new AppError(404, "PRODUCT_LINK_NOT_FOUND", msg, meta("find_product_link"));
  }

  static selfLink(msg = "Cannot link a product to itself") {
    return new AppError(400, "PRODUCT_LINK_SELF_LINK", msg, meta("create_product_link"));
  }

  static duplicateLink(msg = "This product link already exists") {
    return new AppError(409, "PRODUCT_LINK_DUPLICATE", msg, meta("create_product_link"));
  }
}

// ── Daily Pick ────────────────────────────────────────────────────────────────

class DailyPick {
  static notFound(msg = "Daily pick not found") {
    return new AppError(404, "DAILY_PICK_NOT_FOUND", msg, meta("find_daily_pick"));
  }

  static dateConflict(msg = "A daily pick already exists for this date") {
    return new AppError(409, "DAILY_PICK_DATE_CONFLICT", msg, meta("create_daily_pick"));
  }

  static productLimitExceeded(msg = "Maximum number of products exceeded for this pick") {
    return new AppError(400, "DAILY_PICK_PRODUCT_LIMIT", msg, meta("add_daily_pick_product"));
  }

  static productDuplicate(msg = "Product is already in this daily pick") {
    return new AppError(409, "DAILY_PICK_PRODUCT_DUPLICATE", msg, meta("add_daily_pick_product"));
  }
}

// ── Coupon ─────────────────────────────────────────────────────────────────────

class Coupon {
  static notFound(msg = "Coupon not found") {
    return new AppError(404, "COUPON_NOT_FOUND", msg, meta("find_coupon"));
  }

  static codeConflict(msg = "Coupon code already exists in this shop") {
    return new AppError(
      409,
      "COUPON_CODE_CONFLICT",
      msg,
      meta("create_coupon"),
    );
  }

  static expired(msg = "Coupon has expired") {
    return new AppError(410, "COUPON_EXPIRED", msg, meta("validate_coupon"));
  }

  static usageExceeded(msg = "Coupon usage limit reached") {
    return new AppError(
      422,
      "COUPON_USAGE_EXCEEDED",
      msg,
      meta("apply_coupon"),
    );
  }
}

// ── Q&A ───────────────────────────────────────────────────────────────────────

class Question {
  static notFound(msg = "Question not found") {
    return new AppError(
      404,
      "QUESTION_NOT_FOUND",
      msg,
      meta("find_question"),
    );
  }
}

// ── Announcement ──────────────────────────────────────────────────────────────

class Announcement {
  static notFound(msg = "Announcement not found") {
    return new AppError(
      404,
      "ANNOUNCEMENT_NOT_FOUND",
      msg,
      meta("find_announcement"),
    );
  }
}

// ── Stock Alert ───────────────────────────────────────────────────────────────

class StockAlert {
  static notFound(msg = "Stock alert not found") {
    return new AppError(
      404,
      "STOCK_ALERT_NOT_FOUND",
      msg,
      meta("find_stock_alert"),
    );
  }
}

// ── Saved Item ────────────────────────────────────────────────────────────────

class SavedItem {
  static notFound(msg = "Saved item not found") {
    return new AppError(
      404,
      "SAVED_ITEM_NOT_FOUND",
      msg,
      meta("find_saved_item"),
    );
  }

  static duplicate(msg = "Item is already saved") {
    return new AppError(
      409,
      "SAVED_ITEM_DUPLICATE",
      msg,
      meta("save_item"),
    );
  }
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const CatalogErrors = {
  Common,
  Brand,
  MasterProduct,
  ShopProduct,
  Variant,
  Image,
  Price,
  PricingTier,
  Collection,
  Bundle,
  ProductLink,
  DailyPick,
  Coupon,
  Question,
  Announcement,
  StockAlert,
  SavedItem,
} as const;
