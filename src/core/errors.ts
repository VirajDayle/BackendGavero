/**
 * core/errors.ts
 *
 * Base AppError class only.
 * Domain-specific factories live in each module's own *.errors.ts file.
 *
 * Example:
 *   import { AuthErrors } from "../modules/auth/auth.errors";
 *   throw AuthErrors.Pin.mismatch();
 */

// ── Error codes ───────────────────────────────────────────────────────────────
// Add new codes here as new modules are created.

export type ErrorCode =
  // Auth
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "REFRESH_TOKEN_MISSING"
  | "TWO_FACTOR_REQUIRED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "SESSION_NOT_FOUND"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED"
  | "SESSION_USER_LOAD_FAILED"
  // OTP
  | "OTP_NOT_FOUND"
  | "OTP_INVALID"
  | "OTP_MAX_ATTEMPTS"
  | "OTP_TOKEN_INVALID"
  | "OTP_TARGET_MISSING"
  | "OTP_DELIVERY_FAILED"
  // User
  | "USER_NOT_FOUND"
  | "USER_ALREADY_EXISTS"
  | "USER_SUSPENDED"
  | "USER_BANNED"
  | "EMAIL_ALREADY_IN_USE"
  | "INVALID_EMAIL"
  // PIN
  | "PIN_NOT_SET"
  | "PIN_INVALID"
  | "PIN_INVALID_FORMAT"
  | "PIN_MISMATCH"
  | "ACCOUNT_LOCKED"
  // Role
  | "ROLE_NOT_FOUND"
  | "ROLE_ALREADY_EXISTS"
  | "ROLE_MAPPING_NOT_FOUND"
  // Device
  | "DEVICE_NOT_FOUND"
  // Referral
  | "REFERRAL_NOT_FOUND"
  // Permissions
  | "FORBIDDEN"
  // Validation
  | "VALIDATION_ERROR"
  | "CONFLICT"
  // Rate limiting
  | "RATE_LIMITED"
  // Profile — City
  | "CITY_NOT_FOUND"
  | "CITY_SLUG_CONFLICT"
  // Profile — Pincode
  | "PINCODE_NOT_FOUND"
  | "PINCODE_CONFLICT"
  | "PINCODE_NOT_SERVICEABLE"
  // Profile — Bank Account
  | "BANK_ACCOUNT_NOT_FOUND"
  | "BANK_ACCOUNT_OWNERSHIP"
  | "BANK_ACCOUNT_DELETE_PRIMARY"
  | "BANK_ACCOUNT_ALREADY_PRIMARY"
  | "INVALID_IFSC"
  // Profile — KYC
  | "KYC_NOT_FOUND"
  | "KYC_ACTIVE_EXISTS"
  | "KYC_INVALID_TRANSITION"
  | "KYC_REJECTION_REASON_REQUIRED"
  // Profile — Address
  | "ADDRESS_NOT_FOUND"
  | "ADDRESS_OWNERSHIP"
  | "ADDRESS_DELETE_DEFAULT"
  // Profile — Shop Owner
  | "SHOP_OWNER_NOT_FOUND"
  | "SHOP_OWNER_EXISTS"
  | "SHOP_OWNER_SUSPENDED"
  // Profile — Delivery Partner
  | "DELIVERY_PARTNER_NOT_FOUND"
  | "DELIVERY_PARTNER_EXISTS"
  | "DELIVERY_PARTNER_SUSPENDED"
  | "LICENSE_CONFLICT"
  | "DELIVERY_PARTNER_INVALID_STATUS"
  | "DELIVERY_PARTNER_OFFLINE"
  | "INVALID_RATING"
  // Profile — Customer
  | "CUSTOMER_NOT_FOUND"
  | "CUSTOMER_EXISTS"
  | "INSUFFICIENT_LOYALTY_POINTS"
  // Shop
  | "SHOP_NOT_FOUND"
  | "SHOP_ALREADY_EXISTS"
  | "INVALID_SHOP_STATUS"
  | "BRANCH_NOT_FOUND"
  | "BRANCH_LIMIT_EXCEEDED"
  | "CATEGORY_NOT_FOUND"
  | "CATEGORY_DEPTH_EXCEEDED"
  | "HOURS_OVERLAP"
  | "INVALID_HOURS_RANGE"
  // Catalog — Brand
  | "BRAND_NOT_FOUND"
  | "BRAND_SLUG_CONFLICT"
  | "BRAND_INVALID_HIERARCHY"
  // Catalog — Master Product
  | "MASTER_PRODUCT_NOT_FOUND"
  | "MASTER_PRODUCT_SLUG_CONFLICT"
  | "MASTER_PRODUCT_SKU_CONFLICT"
  | "MASTER_PRODUCT_GTIN_CONFLICT"
  // Catalog — Shop Product
  | "SHOP_PRODUCT_NOT_FOUND"
  | "SHOP_PRODUCT_SLUG_CONFLICT"
  | "SHOP_PRODUCT_INVALID_SOURCE"
  | "SHOP_PRODUCT_INVENTORY_VIOLATION"
  // Catalog — Variant
  | "VARIANT_NOT_FOUND"
  | "VARIANT_SKU_CONFLICT"
  // Catalog — Image
  | "IMAGE_NOT_FOUND"
  | "IMAGE_LIMIT_EXCEEDED"
  // Catalog — Price
  | "PRICE_NOT_FOUND"
  | "PRICE_INVALID_DISCOUNT"
  | "PRICE_SELLING_EXCEEDS_MRP"
  | "PRICE_OVERLAPPING_ACTIVE"
  // Catalog — Pricing Tier
  | "PRICING_TIER_OVERLAPPING"
  | "PRICING_TIER_INVALID_TYPE"
  // Catalog — Collection
  | "COLLECTION_NOT_FOUND"
  | "COLLECTION_SLUG_CONFLICT"
  // Catalog — Bundle
  | "BUNDLE_NOT_FOUND"
  | "BUNDLE_SLUG_CONFLICT"
  | "BUNDLE_ITEM_CONFLICT"
  // Catalog — Product Links
  | "PRODUCT_LINK_NOT_FOUND"
  | "PRODUCT_LINK_SELF_LINK"
  | "PRODUCT_LINK_DUPLICATE"
  // Catalog — Daily Picks
  | "DAILY_PICK_NOT_FOUND"
  | "DAILY_PICK_DATE_CONFLICT"
  | "DAILY_PICK_PRODUCT_LIMIT"
  | "DAILY_PICK_PRODUCT_DUPLICATE"
  // Catalog — Coupon
  | "COUPON_NOT_FOUND"
  | "COUPON_CODE_CONFLICT"
  | "COUPON_EXPIRED"
  | "COUPON_USAGE_EXCEEDED"
  // Catalog — Q&A / Announcements / Alerts / Saved
  | "QUESTION_NOT_FOUND"
  | "ANNOUNCEMENT_NOT_FOUND"
  | "STOCK_ALERT_NOT_FOUND"
  | "SAVED_ITEM_NOT_FOUND"
  | "SAVED_ITEM_DUPLICATE"
  // Platform
  | "MAPBOX_API_ERROR"
  | "GEOCODING_FAILED"
  | "AUTOCOMPLETE_FAILED"
  // Generic
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"
  | "INVALID_PHONE";

// ── Error meta ────────────────────────────────────────────────────────────────

export interface ErrorMeta {
  /** Which module threw this — e.g. "auth", "payment", "notification" */
  module?: string;
  /** Which action was being performed — e.g. "login", "verify_otp", "set_pin" */
  action?: string;
  /** The identifier used for rate limiting or other lookups — e.g. IP address, phone number */
  identifier?: string;
}

// ── Base class ────────────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly meta?: ErrorMeta;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    meta?: ErrorMeta,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta;
    this.details = details;

    // Maintain proper prototype chain in transpiled JS
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // ── Generic convenience factories ─────────────────────────────────────────
  // Use these for quick throws that don't belong to any specific module.
  // For module-specific errors, use the domain factories in *.errors.ts files.

  static unauthorized(msg = "Authentication required") {
    return new AppError(401, "UNAUTHORIZED", msg);
  }
  static forbidden(msg = "Insufficient permissions") {
    return new AppError(403, "FORBIDDEN", msg);
  }
  static notFound(msg = "Resource not found") {
    return new AppError(404, "NOT_FOUND", msg);
  }
  static conflict(msg: string) {
    return new AppError(409, "CONFLICT", msg);
  }
  static rateLimited(msg: string) {
    return new AppError(429, "RATE_LIMITED", msg);
  }
  static validation(msg: string, details?: unknown) {
    return new AppError(400, "VALIDATION_ERROR", msg, undefined, details);
  }
  static internal(msg = "Internal server error") {
    return new AppError(500, "INTERNAL_ERROR", msg);
  }
}
