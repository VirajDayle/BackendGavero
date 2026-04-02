/**
 * utils/otp.ts
 *
 * Cryptographically secure OTP generator.
 * Uses crypto.getRandomValues (CSPRNG) — never Math.random().
 * Math.random() is predictable and must never be used for security tokens.
 *
 * In test mode (NODE_ENV=test), returns a fixed OTP ("123456") so
 * integration tests can exercise the full OTP → register → login flow.
 */

const TEST_OTP = "123456";

/**
 * Generates a 6-digit numeric OTP in the range 100000–999999.
 * Uses the Web Crypto API (available natively in Bun and Node 19+).
 */
export function generateOtp(): string {
  if (process.env.NODE_ENV === "test") return TEST_OTP;

  // Uint32Array gives us a 32-bit unsigned integer from CSPRNG.
  // Modulo 900_000 maps it to 0–899999, then +100_000 gives 100000–999999.
  const value = crypto.getRandomValues(new Uint32Array(1))[0]!;
  return ((value % 900_000) + 100_000).toString();
}

