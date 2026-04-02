import { parsePhoneNumberWithError, isValidPhoneNumber } from "libphonenumber-js";
import { AppError } from "../core/errors";

/**
 * utils/phone.ts
 *
 * Phone number normalization and validation utilities.
 * Ensures consistent E.164 format across the platform.
 */

/**
 * Normalizes a phone number to E.164 format.
 * Uses libphonenumber-js for robust validation and formatting.
 *
 * @example "90000 00000" -> "+919000000000"
 * @example "+91 90000-00000" -> "+919000000000"
 */
export function normalizePhone(raw: string, defaultRegion: any = "IN"): string {
  if (!isValidPhoneNumber(raw, defaultRegion)) {
    throw new AppError(400, "INVALID_PHONE", "Enter a valid phone number.");
  }
  return parsePhoneNumberWithError(raw, defaultRegion).format("E.164");
}

/**
 * Fast check for E.164 format validity.
 * Pattern: + followed by 7 to 15 digits.
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}
