import { AppError } from "../../core/errors";
import type { ErrorMeta } from "../../core/errors";

// ── Helper ────────────────────────────────────────────────────────────────────

function meta(action: string): ErrorMeta {
  return { module: "platform", action };
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

// ── City ──────────────────────────────────────────────────────────────────────

class City {
  static notFound(msg = "City not found") {
    return new AppError(404, "CITY_NOT_FOUND", msg, meta("find_city"));
  }

  static slugConflict(slug: string) {
    return new AppError(
      409,
      "CITY_SLUG_CONFLICT",
      `City with slug "${slug}" already exists`,
      meta("create_city"),
    );
  }
}

// ── Pincode ───────────────────────────────────────────────────────────────────

class Pincode {
  static notFound(msg = "Serviceable pincode not found") {
    return new AppError(404, "PINCODE_NOT_FOUND", msg, meta("find_pincode"));
  }

  static conflict(pincode: string) {
    return new AppError(
      409,
      "PINCODE_CONFLICT",
      `Pincode "${pincode}" is already registered`,
      meta("create_pincode"),
    );
  }

  static notServiceable(msg = "Location is not within a serviceable area") {
    return new AppError(
      422,
      "PINCODE_NOT_SERVICEABLE",
      msg,
      meta("check_serviceability"),
    );
  }
}

// ── Location ──────────────────────────────────────────────────────────────────

export class MapboxApiError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(502, "MAPBOX_API_ERROR", message, meta("mapbox_api"), details);
  }
}

export class GeocodingFailedError extends AppError {
  constructor(message: string = "Failed to geocode the provided location") {
    super(400, "GEOCODING_FAILED", message, meta("geocode"));
  }
}

export class AutocompleteFailedError extends AppError {
  constructor(message: string = "Failed to fetch autocomplete suggestions") {
    super(400, "AUTOCOMPLETE_FAILED", message, meta("autocomplete"));
  }
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const PlatformErrors = {
  Common,
  City,
  Pincode,
} as const;
