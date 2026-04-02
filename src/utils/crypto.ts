/**
 * utils/crypto.ts
 *
 * AES-256-GCM encryption/decryption for sensitive fields
 * (bank account numbers, document numbers, etc.)
 *
 * The encryption key MUST be a 32-byte hex string stored in env.ENCRYPTION_KEY.
 * Generate one with: openssl rand -hex 32
 */

import { env } from "../config/env";

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

let _key: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (_key) return _key;
  const rawKey = env.ENCRYPTION_KEY;
  if (!rawKey || rawKey.length !== 64)
    throw new Error(
      "ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Generate with: openssl rand -hex 32",
    );

  const keyBuffer = new Uint8Array(
    rawKey.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
  );

  _key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: ALGORITHM },
    false,
    ["encrypt", "decrypt"],
  );
  return _key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string: iv:ciphertext (both base64-encoded).
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded,
  );

  const ivB64 = btoa(String.fromCharCode(...iv));
  const cipherB64 = btoa(
    String.fromCharCode(...new Uint8Array(cipherBuffer)),
  );

  return `${ivB64}:${cipherB64}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string produced by encrypt().
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey();
  const [ivB64, cipherB64] = ciphertext.split(":");
  if (!ivB64 || !cipherB64) throw new Error("Invalid ciphertext format");

  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
  const cipher = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));

  const plainBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    cipher,
  );

  return new TextDecoder().decode(plainBuffer);
}
