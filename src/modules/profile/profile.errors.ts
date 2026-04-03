/**
 * modules/profile/profile.errors.ts
 *
 * Centralized, production-grade error factories for the profile module.
 * Mirrors auth.errors.ts conventions: namespaced classes, AppError base.
 */

import { AppError } from "../../core/errors";
import type { ErrorMeta } from "../../core/errors";

// ── Helper ────────────────────────────────────────────────────────────────────

function meta(action: string): ErrorMeta {
  return { module: "profile", action };
}

// ── Common ────────────────────────────────────────────────────────────────────

class Common {
  static forbidden(msg = "Insufficient permissions") {
    return new AppError(403, "FORBIDDEN", msg, meta("authorize"));
  }

  static validation(msg = "Invalid input") {
    return new AppError(422, "VALIDATION_ERROR", msg, meta("validate"));
  }

  static adminRequired(msg = "Admin access required") {
    return Common.forbidden(msg);
  }
}

// ── Bank Account ──────────────────────────────────────────────────────────────

class BankAccount {
  static notFound(msg = "Bank account not found") {
    return new AppError(
      404,
      "BANK_ACCOUNT_NOT_FOUND",
      msg,
      meta("find_bank_account"),
    );
  }

  static invalidIfsc(msg = "Invalid IFSC Code or unable to resolve bank details") {
    return new AppError(
      400,
      "INVALID_IFSC",
      msg,
      meta("resolve_ifsc"),
    );
  }

  static ownershipMismatch(msg = "Bank account does not belong to this user") {
    return new AppError(
      403,
      "BANK_ACCOUNT_OWNERSHIP",
      msg,
      meta("verify_ownership"),
    );
  }

  static cannotDeletePrimary(
    msg = "Cannot delete primary bank account. Set another account as primary first",
  ) {
    return new AppError(
      409,
      "BANK_ACCOUNT_DELETE_PRIMARY",
      msg,
      meta("delete_bank_account"),
    );
  }

  static alreadyPrimary(msg = "Bank account is already the primary account") {
    return new AppError(
      409,
      "BANK_ACCOUNT_ALREADY_PRIMARY",
      msg,
      meta("set_primary"),
    );
  }
}

// ── KYC Document ──────────────────────────────────────────────────────────────

class KycDocument {
  static notFound(msg = "KYC document not found") {
    return new AppError(404, "KYC_NOT_FOUND", msg, meta("find_kyc"));
  }

  static activeExists(
    msg = "An active submission for this document type already exists",
  ) {
    return new AppError(409, "KYC_ACTIVE_EXISTS", msg, meta("submit_kyc"));
  }

  static invalidTransition(from: string, to: string) {
    return new AppError(
      422,
      "KYC_INVALID_TRANSITION",
      `Cannot transition KYC status from "${from}" to "${to}"`,
      meta("review_kyc"),
    );
  }

  static rejectionReasonRequired(
    msg = "Rejection reason is required when rejecting a document",
  ) {
    return new AppError(
      400,
      "KYC_REJECTION_REASON_REQUIRED",
      msg,
      meta("review_kyc"),
    );
  }
}

// ── Address ───────────────────────────────────────────────────────────────────

class Address {
  static notFound(msg = "Address not found") {
    return new AppError(404, "ADDRESS_NOT_FOUND", msg, meta("find_address"));
  }

  static ownershipMismatch(msg = "Address does not belong to this user") {
    return new AppError(
      403,
      "ADDRESS_OWNERSHIP",
      msg,
      meta("verify_ownership"),
    );
  }

  static cannotDeleteDefault(
    msg = "Cannot delete the default address. Set another address as default first",
  ) {
    return new AppError(
      409,
      "ADDRESS_DELETE_DEFAULT",
      msg,
      meta("delete_address"),
    );
  }
}

// ── Shop Owner ────────────────────────────────────────────────────────────────

class ShopOwner {
  static notFound(msg = "Shop owner profile not found") {
    return new AppError(
      404,
      "SHOP_OWNER_NOT_FOUND",
      msg,
      meta("find_shop_owner"),
    );
  }

  static profileExists(msg = "Shop owner profile already exists") {
    return new AppError(
      409,
      "SHOP_OWNER_EXISTS",
      msg,
      meta("onboard_shop_owner"),
    );
  }

  static suspended(msg = "Shop owner account is suspended") {
    return new AppError(
      403,
      "SHOP_OWNER_SUSPENDED",
      msg,
      meta("verify_shop_owner"),
    );
  }
}

// ── Delivery Partner ──────────────────────────────────────────────────────────

class DeliveryPartner {
  static notFound(msg = "Delivery partner profile not found") {
    return new AppError(
      404,
      "DELIVERY_PARTNER_NOT_FOUND",
      msg,
      meta("find_delivery_partner"),
    );
  }

  static profileExists(msg = "Delivery partner profile already exists") {
    return new AppError(
      409,
      "DELIVERY_PARTNER_EXISTS",
      msg,
      meta("onboard_delivery_partner"),
    );
  }

  static suspended(msg = "Delivery partner account is suspended") {
    return new AppError(
      403,
      "DELIVERY_PARTNER_SUSPENDED",
      msg,
      meta("verify_delivery_partner"),
    );
  }

  static licenseConflict(msg = "A partner with this license number already exists") {
    return new AppError(
      409,
      "LICENSE_CONFLICT",
      msg,
      meta("onboard_delivery_partner"),
    );
  }

  static invalidStatusTransition(from: string, to: string) {
    return new AppError(
      422,
      "DELIVERY_PARTNER_INVALID_STATUS",
      `Cannot transition status from "${from}" to "${to}"`,
      meta("update_status"),
    );
  }

  static mustBeOnline(
    msg = "Partner must be online (available or on_delivery) to update location",
  ) {
    return new AppError(
      422,
      "DELIVERY_PARTNER_OFFLINE",
      msg,
      meta("update_location"),
    );
  }

  static invalidRating(msg = "Rating must be between 1 and 5") {
    return new AppError(400, "INVALID_RATING", msg, meta("append_rating"));
  }
}

// ── Customer ──────────────────────────────────────────────────────────────────

class Customer {
  static notFound(msg = "Customer profile not found") {
    return new AppError(
      404,
      "CUSTOMER_NOT_FOUND",
      msg,
      meta("find_customer"),
    );
  }

  static profileExists(msg = "Customer profile already exists") {
    return new AppError(
      409,
      "CUSTOMER_EXISTS",
      msg,
      meta("create_customer"),
    );
  }

  static insufficientPoints(
    msg = "Insufficient loyalty points for this operation",
  ) {
    return new AppError(
      422,
      "INSUFFICIENT_LOYALTY_POINTS",
      msg,
      meta("adjust_loyalty"),
    );
  }
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const ProfileErrors = {
  Common,
  BankAccount,
  KycDocument,
  Address,
  ShopOwner,
  DeliveryPartner,
  Customer,
} as const;
