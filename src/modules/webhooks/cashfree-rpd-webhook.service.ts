/**
 * modules/webhooks/cashfree-rpd-webhook.service.ts
 *
 * Signature verification and event dispatch for Cashfree RPD webhooks.
 * Business logic is intentionally delegated to BankAccountService
 * (profile.service.ts) to keep the service layer as the single source
 * of truth for all bank account state transitions.
 *
 * HOW Cashfree builds the signature (per docs):
 *   a) Sort the `data` object keys alphabetically.
 *   b) Concatenate all values (use "" for null/undefined).
 *   c) HMAC-SHA256 the result with the webhook secret.
 *   d) Base64-encode the digest.
 */

import crypto from "crypto";
import { env } from "../../config/env";
import { logger } from "../../core/logger";
import { BankAccountService } from "../profile/profile.service";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RpdWebhookData {
  bank_account?: string;
  ifsc?: string;
  upi?: string;
  name_at_bank?: string;
  verification_id: string;
  ref_id?: string;
  utr?: string;
  status: "SUCCESS" | "EXPIRED" | "FAILURE";
  name_match_score?: string;
  name_match_result?: string;
  added_on?: string;
  processed_on?: string;
  penny_collected_on?: string;
  reversal_status?: string;
  account_type?: string;
}

export interface RpdWebhookPayload {
  signature: string;
  event_type:
    | "RPD_BANK_ACCOUNT_VERIFICATION_SUCCESS"
    | "RPD_BANK_ACCOUNT_VERIFICATION_EXPIRED"
    | "RPD_BANK_ACCOUNT_VERIFICATION_FAILURE";
  event_time: string;
  version: string;
  data: RpdWebhookData;
}

// ── Signature Verification ────────────────────────────────────────────────────

/**
 * Verifies the HMAC-SHA256 signature on a Cashfree RPD webhook.
 *
 * Algorithm (per Cashfree docs):
 *   1. Sort the `data` object keys alphabetically.
 *   2. Concatenate values in sorted-key order ("" for null/undefined).
 *   3. HMAC-SHA256 with the webhook secret, base64-encode the digest.
 *   4. Timing-safe compare with the received signature.
 *
 * @returns true if signatures match, false otherwise.
 */
export function verifyCashfreeRpdSignature(
  data: Record<string, unknown>,
  receivedSignature: string,
  secret: string = env.CASHFREE_WEBHOOK_SECRET ?? "",
): boolean {
  if (!secret) {
    logger.warn("CASHFREE_WEBHOOK_SECRET not set — rejecting all RPD webhooks");
    return false;
  }

  const sortedKeys = Object.keys(data).sort();
  const postData = sortedKeys
    .map((k) => (data[k] == null ? "" : String(data[k])))
    .join("");

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(postData)
    .digest("base64");

  try {
    const a = Buffer.from(expectedSig);
    const b = Buffer.from(receivedSignature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ── Event Dispatcher ──────────────────────────────────────────────────────────

/**
 * Dispatches a verified RPD webhook payload to the BankAccountService.
 * No repository access here — all state transitions go through the service layer.
 */
export async function dispatchRpdEvent(payload: RpdWebhookPayload): Promise<void> {
  const { event_type, data } = payload;

  if (
    event_type !== "RPD_BANK_ACCOUNT_VERIFICATION_SUCCESS" &&
    event_type !== "RPD_BANK_ACCOUNT_VERIFICATION_EXPIRED" &&
    event_type !== "RPD_BANK_ACCOUNT_VERIFICATION_FAILURE"
  ) {
    logger.warn({ event_type }, "RPD webhook: unknown event_type — ignoring");
    return;
  }

  logger.info(
    { event_type, verificationId: data.verification_id },
    "RPD webhook: dispatching to BankAccountService",
  );

  await BankAccountService.handleRpdWebhookEvent(event_type, data.verification_id, {
    utr: data.utr,
    nameAtBank: data.name_at_bank,
    nameMatchResult: data.name_match_result,
    reversalStatus: data.reversal_status,
    accountType: data.account_type,
    status: data.status,
  });
}
