/**
 * Centralized error factories for the Authentication module.
 * 
 * This file provides a structured, production-grade way to throw consistent 
 * application errors (AppError) across all layers (Service, Controller, Repo). 
 * Each error includes an HTTP status code, a unique machine-readable error code, 
 * and localized metadata for audit logging.
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

/**
 * Generic authentication and authorization errors shared across sub-modules.
 */
class Common {
  /** Thrown when a JWT is missing or invalid. */
  static unauthorized(msg = "Authentication required") {
    return new AppError(401, "UNAUTHORIZED", msg, meta("authenticate"));
  }

  /** Thrown when a user lacks the required roles/permissions. */
  static forbidden(msg = "Insufficient permissions") {
    return new AppError(403, "FORBIDDEN", msg, meta("authorize"));
  }

  /** Thrown when an account is temporarily locked due to brute-force protection. */
  static accountLocked(msg = "Too many failed attempts. Try again later") {
    return new AppError(429, "ACCOUNT_LOCKED", msg, meta("security"));
  }

  /** Thrown when request body/params fail schema validation. */
  static validation(msg = "Invalid input") {
    return new AppError(422, "VALIDATION_ERROR", msg, meta("validate"));
  }

  /** Thrown when infrastructure-level rate limits are hit. */
  static tooManyRequests(msg = "Too many requests. Please try again later") {
    return new AppError(429, "RATE_LIMITED", msg, meta("security"));
  }

  /** Thrown on unique constraint violations (e.g. duplicate slug). */
  static conflict(msg = "Resource conflict") {
    return new AppError(409, "CONFLICT", msg, meta("conflict"));
  }

  /** Alias for tooManyRequests. */
  static rateLimited(msg = "Too many requests. Please try again later") {
    return new AppError(429, "RATE_LIMITED", msg, meta("security"));
  }
}

/**
 * Errors specific to the login handshake, session lifecycle, and token security.
 */
class Auth {
  /** Thrown when phone/PIN combination is incorrect. */
  static invalidCredentials(msg = "Invalid credentials") {
    return new AppError(401, "INVALID_CREDENTIALS", msg, meta("login"));
  }

  /** Thrown when an Access Token is past its expiry. */
  static tokenExpired(msg = "Token has expired") {
    return new AppError(401, "TOKEN_EXPIRED", msg, meta("verify_token"));
  }

  /** Thrown when a token is malformed or signature check fails. */
  static tokenInvalid(msg = "Token is invalid") {
    return new AppError(401, "TOKEN_INVALID", msg, meta("verify_token"));
  }

  /** Thrown when the x-refresh-token header is missing on rotation. */
  static refreshTokenMissing(msg = "Refresh token is required") {
    return new AppError(401, "REFRESH_TOKEN_MISSING", msg, meta("refresh"));
  }

  /** Thrown when the user's session record has expired. */
  static sessionExpired(msg = "Session expired or invalid") {
    return new AppError(401, "SESSION_EXPIRED", msg, meta("verify_session"));
  }

  /** Thrown when a session is invalidated (e.g. after PIN change). */
  static sessionRevoked(msg = "Session has been revoked") {
    return new AppError(401, "SESSION_REVOKED", msg, meta("verify_session"));
  }

  /** Thrown when 2FA is active but the user hasn't provided a TOTP yet. */
  static twoFactorRequired(msg = "Two-factor authentication required") {
    return new AppError(401, "TWO_FACTOR_REQUIRED", msg, meta("login"));
  }

  /** Thrown when an admin has suspended the user account. */
  static accountSuspended(msg = "Account has been suspended") {
    return new AppError(403, "USER_SUSPENDED", msg, meta("login"));
  }

  /** Thrown when the user is permanently banned from the platform. */
  static accountBanned(msg = "Account has been banned") {
    return new AppError(403, "USER_BANNED", msg, meta("login"));
  }
}

/**
 * Errors associated with the One-Time Password (OTP) delivery and verification lifecycle.
 */
class Otp {
  /** Thrown when the requested OTP record does not exist or has expired. */
  static notFound(msg = "No active OTP found. Please request a new one") {
    return new AppError(404, "OTP_NOT_FOUND", msg, meta("verify_otp"));
  }

  /** Thrown when the 6-digit code does not match the record. */
  static invalid(msg = "Invalid OTP") {
    return new AppError(400, "OTP_INVALID", msg, meta("verify_otp"));
  }

  /** Thrown when the user exceeds the maximum verification attempts for a single OTP. */
  static maxAttempts(msg = "Maximum OTP attempts exceeded") {
    return new AppError(429, "OTP_MAX_ATTEMPTS", msg, meta("verify_otp"));
  }

  /** Thrown when the verification bridge token (otpToken) check fails. */
  static tokenInvalid(msg = "OTP token is invalid or expired") {
    return new AppError(401, "OTP_TOKEN_INVALID", msg, meta("verify_otp_token"));
  }

  /** Thrown when both phone and email are missing from a request. */
  static missingTarget(
    msg = "Either phone or email must be provided for OTP request",
  ) {
    return new AppError(400, "OTP_TARGET_MISSING", msg, meta("request_otp"));
  }

  /** Thrown if the notification provider (Twilio/Postmark) returns an error. */
  static deliveryFailed(msg = "Failed to send OTP") {
    return new AppError(500, "OTP_DELIVERY_FAILED", msg, meta("request_otp"));
  }
}

/**
 * Errors related to security PIN management, verification, and reset flows.
 */
class Pin {
  /** Thrown if a user attempts to login with a PIN before setting one. */
  static notSet(msg = "PIN not set") {
    return new AppError(400, "PIN_NOT_SET", msg, meta("login"));
  }

  /** Thrown when the provided PIN is incorrect. */
  static invalid(msg = "Invalid PIN") {
    return new AppError(401, "PIN_INVALID", msg, meta("login"));
  }

  /** Thrown during PIN setup/reset if the confirmation PIN does not match. */
  static mismatch(msg = "PINs do not match") {
    return new AppError(400, "PIN_MISMATCH", msg, meta("set_pin"));
  }

  /** Thrown if the PIN does not meet the 6-digit numeric requirement. */
  static format(msg = "PIN must be exactly 6 digits") {
    return new AppError(400, "PIN_INVALID_FORMAT", msg, meta("set_pin"));
  }

  /** Alias for Common.accountLocked. */
  static locked() {
    return Common.accountLocked();
  }
}

/**
 * Errors regarding user account state, profile updates, and identification.
 */
class User {
  /** Thrown when a user UUID or phone number is not found in the database. */
  static notFound(msg = "User not found") {
    return new AppError(404, "USER_NOT_FOUND", msg, meta("find_user"));
  }

  /** Thrown during registration if the phone number is already taken. */
  static alreadyExists(msg = "User already exists") {
    return new AppError(409, "USER_ALREADY_EXISTS", msg, meta("register"));
  }

  /** Thrown if a user tries to change their email to one already in use. */
  static emailConflict(msg = "Email already in use") {
    return new AppError(409, "EMAIL_ALREADY_IN_USE", msg, meta("update_user"));
  }

  /** Thrown if the email format is invalid. */
  static invalidEmail(msg = "Invalid email address") {
    return new AppError(400, "INVALID_EMAIL", msg, meta("update_user"));
  }

  /** Thrown when access is denied because the user is suspended. */
  static suspended(msg = "Account has been suspended") {
    return new AppError(403, "USER_SUSPENDED", msg, meta("find_user"));
  }

  /** Thrown when access is denied because the user is banned. */
  static banned(msg = "Account has been banned") {
    return new AppError(403, "USER_BANNED", msg, meta("find_user"));
  }

  /** Thrown when an endpoint requires the 'admin' role. */
  static adminRequired(msg = "Admin access required") {
    return Common.forbidden(msg);
  }

  /** Infrastructure error: failure to reload user data after session creation. */
  static sessionLoadFailed(
    msg = "Session created but user could not be loaded",
  ) {
    return new AppError(500, "SESSION_USER_LOAD_FAILED", msg, meta("session"));
  }
}

/**
 * Specific errors for managing active login sessions and token invalidation.
 */
class Session {
  /** Thrown when a session UUID is not found. */
  static notFound(msg = "Session not found") {
    return new AppError(404, "SESSION_NOT_FOUND", msg, meta("find_session"));
  }

  /** Alias for Auth.sessionExpired. */
  static expired() {
    return Auth.sessionExpired();
  }

  /** Alias for Auth.sessionRevoked. */
  static revoked() {
    return Auth.sessionRevoked();
  }

  /** Thrown if a user attempts to revoke a session they do not own. */
  static forbidden(msg = "Cannot revoke another user's session") {
    return Common.forbidden(msg);
  }
}

/**
 * Errors occurring during RBAC (Role-Based Access Control) configuration.
 */
class Role {
  /** Thrown when a role ID or slug is not found. */
  static notFound(msg = "Role not found") {
    return new AppError(404, "ROLE_NOT_FOUND", msg, meta("find_role"));
  }

  /** Thrown when creating a role with a slug that already exists. */
  static conflict(slug: string) {
    return new AppError(
      409,
      "ROLE_ALREADY_EXISTS",
      `Role with slug "${slug}" already exists`,
      meta("create_role"),
    );
  }

  /** Alias for User.adminRequired. */
  static adminRequired(msg = "Admin access required") {
    return Common.forbidden(msg);
  }

  /** Thrown when target user for assignment is not found. */
  static userNotFound(msg = "User not found") {
    return new AppError(404, "USER_NOT_FOUND", msg, meta("assign_role"));
  }

  /** Thrown when attempting to revoke a role from a user who doesn't have it. */
  static mappingNotFound(msg = "User-role mapping not found") {
    return new AppError(404, "ROLE_MAPPING_NOT_FOUND", msg, meta("revoke_role"));
  }
}

/**
 * Errors regarding hardware device trust and tracking metadata.
 */
class Device {
  /** Thrown when a device UUID is not found. */
  static notFound(msg = "Device not found") {
    return new AppError(404, "DEVICE_NOT_FOUND", msg, meta("find_device"));
  }
}

/**
 * Errors in referral link tracking and code generation logic.
 */
class Referral {
  /** Thrown when a referral code or record is not found. */
  static notFound(msg = "Referral not found") {
    return new AppError(404, "REFERRAL_NOT_FOUND", msg, meta("find_referral"));
  }
}

/**
 * Errors related specifically to security audit log access.
 */
class Audit {
  /** Restricted access check for audit logs. */
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