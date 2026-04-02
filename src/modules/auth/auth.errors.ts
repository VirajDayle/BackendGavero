/**
 * modules/auth/auth.errors.ts
 *
 * Centralized, production-grade error factories for the auth module.
 * This file ensures consistent error responses across routes, controllers, and services.
 */

import { AppError } from "../../core/errors";
import type { ErrorMeta } from "../../core/errors";

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Standard metadata for all auth-related errors.
 */
function meta(action: string): ErrorMeta {
  return { module: "auth", action };
}

// ── Common (shared across domains) ────────────────────────────────────────────

/**
 * Generic errors that aren't specific to a single auth sub-feature.
 */
class Common {
  static unauthorized(msg = "Authentication required") {
    return new AppError(401, "UNAUTHORIZED", msg, meta("authenticate"));
  }

  static forbidden(msg = "Insufficient permissions") {
    return new AppError(403, "FORBIDDEN", msg, meta("authorize"));
  }

  static accountLocked(msg = "Too many failed attempts. Try again later") {
    return new AppError(429, "ACCOUNT_LOCKED", msg, meta("security"));
  }

  static validation(msg = "Invalid input") {
    return new AppError(400, "VALIDATION_ERROR", msg, meta("validate"));
  }

  static tooManyRequests(msg = "Too many requests. Please try again later") {
    return new AppError(429, "RATE_LIMITED", msg, meta("security"));
  }

  static conflict(msg = "Resource conflict") {
    return new AppError(409, "CONFLICT", msg, meta("conflict"));
  }

  static rateLimited(msg = "Too many requests. Please try again later") {
    return new AppError(429, "RATE_LIMITED", msg, meta("security"));
  }
}

// ── Auth (login / tokens / sessions) ─────────────────────────────────────────

/**
 * Errors related to the core authentication handshake and session lifecycle.
 */
class Auth {
  static invalidCredentials(msg = "Invalid credentials") {
    return new AppError(401, "INVALID_CREDENTIALS", msg, meta("login"));
  }

  static tokenExpired(msg = "Token has expired") {
    return new AppError(401, "TOKEN_EXPIRED", msg, meta("verify_token"));
  }

  static tokenInvalid(msg = "Token is invalid") {
    return new AppError(401, "TOKEN_INVALID", msg, meta("verify_token"));
  }

  static refreshTokenMissing(msg = "Refresh token is required") {
    return new AppError(401, "REFRESH_TOKEN_MISSING", msg, meta("refresh"));
  }

  static sessionExpired(msg = "Session expired or invalid") {
    return new AppError(401, "SESSION_EXPIRED", msg, meta("verify_session"));
  }

  static sessionRevoked(msg = "Session has been revoked") {
    return new AppError(401, "SESSION_REVOKED", msg, meta("verify_session"));
  }

  static twoFactorRequired(msg = "Two-factor authentication required") {
    return new AppError(401, "TWO_FACTOR_REQUIRED", msg, meta("login"));
  }

  static accountSuspended(msg = "Account has been suspended") {
    return new AppError(403, "USER_SUSPENDED", msg, meta("login"));
  }

  static accountBanned(msg = "Account has been banned") {
    return new AppError(403, "USER_BANNED", msg, meta("login"));
  }
}

// ── OTP ───────────────────────────────────────────────────────────────────────

/**
 * Errors stemming from the One-Time Password lifecycle.
 */
class Otp {
  static notFound(msg = "No active OTP found. Please request a new one") {
    return new AppError(404, "OTP_NOT_FOUND", msg, meta("verify_otp"));
  }

  static invalid(msg = "Invalid OTP") {
    return new AppError(400, "OTP_INVALID", msg, meta("verify_otp"));
  }

  static maxAttempts(msg = "Maximum OTP attempts exceeded") {
    return new AppError(429, "OTP_MAX_ATTEMPTS", msg, meta("verify_otp"));
  }

  static tokenInvalid(msg = "OTP token is invalid or expired") {
    return new AppError(401, "OTP_TOKEN_INVALID", msg, meta("verify_otp_token"));
  }

  static missingTarget(
    msg = "Either phone or email must be provided for OTP request",
  ) {
    return new AppError(400, "OTP_TARGET_MISSING", msg, meta("request_otp"));
  }

  static deliveryFailed(msg = "Failed to send OTP") {
    return new AppError(500, "OTP_DELIVERY_FAILED", msg, meta("request_otp"));
  }
}

// ── PIN ───────────────────────────────────────────────────────────────────────

/**
 * Errors related to 6-digit PIN management and login.
 */
class Pin {
  static notSet(msg = "PIN not set") {
    return new AppError(400, "PIN_NOT_SET", msg, meta("login"));
  }

  static invalid(msg = "Invalid PIN") {
    return new AppError(401, "PIN_INVALID", msg, meta("login"));
  }

  static mismatch(msg = "PINs do not match") {
    return new AppError(400, "PIN_MISMATCH", msg, meta("set_pin"));
  }

  static format(msg = "PIN must be exactly 6 digits") {
    return new AppError(400, "PIN_INVALID_FORMAT", msg, meta("set_pin"));
  }

  static locked() {
    return Common.accountLocked();
  }
}

// ── User ──────────────────────────────────────────────────────────────────────

/**
 * Errors regarding user accounts and profile management.
 */
class User {
  static notFound(msg = "User not found") {
    return new AppError(404, "USER_NOT_FOUND", msg, meta("find_user"));
  }

  static alreadyExists(msg = "User already exists") {
    return new AppError(409, "USER_ALREADY_EXISTS", msg, meta("register"));
  }

  static emailConflict(msg = "Email already in use") {
    return new AppError(409, "EMAIL_ALREADY_IN_USE", msg, meta("update_user"));
  }

  static invalidEmail(msg = "Invalid email address") {
    return new AppError(400, "INVALID_EMAIL", msg, meta("update_user"));
  }

  static suspended(msg = "Account has been suspended") {
    return new AppError(403, "USER_SUSPENDED", msg, meta("find_user"));
  }

  static banned(msg = "Account has been banned") {
    return new AppError(403, "USER_BANNED", msg, meta("find_user"));
  }

  static adminRequired(msg = "Admin access required") {
    return Common.forbidden(msg);
  }

  static sessionLoadFailed(
    msg = "Session created but user could not be loaded",
  ) {
    return new AppError(500, "SESSION_USER_LOAD_FAILED", msg, meta("session"));
  }
}

// ── Session ───────────────────────────────────────────────────────────────────

/**
 * Specific errors for managing active login sessions.
 */
class Session {
  static notFound(msg = "Session not found") {
    return new AppError(404, "SESSION_NOT_FOUND", msg, meta("find_session"));
  }

  static expired() {
    return Auth.sessionExpired();
  }

  static revoked() {
    return Auth.sessionRevoked();
  }

  static forbidden(msg = "Cannot revoke another user's session") {
    return Common.forbidden(msg);
  }
}

// ── Role ──────────────────────────────────────────────────────────────────────

/**
 * Errors occurring during RBAC (Role-Based Access Control) operations.
 */
class Role {
  static notFound(msg = "Role not found") {
    return new AppError(404, "ROLE_NOT_FOUND", msg, meta("find_role"));
  }

  static conflict(slug: string) {
    return new AppError(
      409,
      "ROLE_ALREADY_EXISTS",
      `Role with slug "${slug}" already exists`,
      meta("create_role"),
    );
  }

  static adminRequired(msg = "Admin access required") {
    return Common.forbidden(msg);
  }

  static userNotFound(msg = "User not found") {
    return new AppError(404, "USER_NOT_FOUND", msg, meta("assign_role"));
  }

  static mappingNotFound(msg = "User-role mapping not found") {
    return new AppError(404, "ROLE_MAPPING_NOT_FOUND", msg, meta("revoke_role"));
  }
}

// ── Device ────────────────────────────────────────────────────────────────────

/**
 * Errors regarding hardware device trust and tracking.
 */
class Device {
  static notFound(msg = "Device not found") {
    return new AppError(404, "DEVICE_NOT_FOUND", msg, meta("find_device"));
  }
}

// ── Referral ──────────────────────────────────────────────────────────────────

/**
 * Errors in the referral and networking logic.
 */
class Referral {
  static notFound(msg = "Referral not found") {
    return new AppError(404, "REFERRAL_NOT_FOUND", msg, meta("find_referral"));
  }
}

// ── Audit ─────────────────────────────────────────────────────────────────────

/**
 * Errors related to security audit log retrieval.
 */
class Audit {
  static adminRequired(msg = "Admin access required") {
    return Common.forbidden(msg);
  }
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const AuthErrors = {
  Common,
  Auth,
  Otp,
  Pin,
  User,
  Session,
  Role,
  Device,
  Referral,
  Audit,
} as const;