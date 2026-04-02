/**
 * utils/hash.ts
 *
 * Crypto helpers used across the codebase.
 * Centralising these prevents duplication and makes algorithm choices
 * easy to audit and change in one place.
 */

import { Argon2id } from "oslo/password";

// ── Argon2id — for passwords / PINs ──────────────────────────────────────────
// Never use argon2 for lookup-by-hash. It is intentionally non-deterministic
// (salted) — you cannot reproduce the same hash to find a row in the DB.

const argon2 = new Argon2id();

export async function hashPin(pin: string): Promise<string> {
  return argon2.hash(pin);
}

export async function verifyPin(hash: string, pin: string): Promise<boolean> {
  return argon2.verify(hash, pin);
}

// ── SHA-256 hex — for opaque bearer tokens ────────────────────────────────────
// Used for refresh-token lookup: the raw token is a high-entropy random
// string (~238 bits) so SHA-256 is both safe and fast for this purpose.
// Never use SHA-256 for passwords or PINs — use argon2 above.

export async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Random ID generator ───────────────────────────────────────────────────────

export function generateId(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const maxValid = 256 - (256 % chars.length); // 248 — reject bytes >= this
  const result: string[] = [];

  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length - result.length));
    for (const b of bytes) {
      if (b < maxValid && result.length < length) {
        result.push(chars[b % chars.length]);
      }
    }
  }

  return result.join("");
}
