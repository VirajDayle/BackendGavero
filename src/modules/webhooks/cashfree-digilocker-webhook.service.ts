/**
 * modules/webhooks/cashfree-digilocker-webhook.service.ts
 *
 * Signature verification and event dispatch for Cashfree Digilocker webhooks.
 *
 * Signature algorithm (per Cashfree docs):
 *   1. Sort the `data` object keys alphabetically.
 *   2. Concatenate values in sorted-key order ("" for null/undefined).
 *   3. HMAC-SHA256 with the webhook secret, base64-encode the digest.
 *   4. Timing-safe compare with the received signature.
 */

import crypto from "crypto";
import { env } from "../../config/env";
import { logger } from "../../core/logger";
import { KycDocumentService } from "../profile/profile.service";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DigilockerWebhookData {
  verification_id: string;
  reference_id: number;
  status: string;
  user_details?: any;
  document_requested?: string[];
  document_consent?: string[] | null;
  document_consent_validity?: string | null;
}

export interface DigilockerWebhookPayload {
  signature: string;
  event_type:
    | "DIGILOCKER_VERIFICATION_SUCCESS"
    | "DIGILOCKER_VERIFICATION_LINK_EXPIRED"
    | "DIGILOCKER_VERIFICATION_CONSENT_DENIED"
    | "DIGILOCKER_VERIFICATION_CONSENT_EXPIRED"
    | "DIGILOCKER_VERIFICATION_FAILURE";
  event_time: string;
  version: string;
  data: DigilockerWebhookData;
}

// ── Signature Verification ────────────────────────────────────────────────────

/**
 * Verifies the HMAC-SHA256 signature on a Cashfree Digilocker webhook.
 */
export function verifyCashfreeDigilockerSignature(
  data: Record<string, unknown>,
  receivedSignature: string,
  secret: string = env.CASHFREE_WEBHOOK_SECRET ?? "",
): boolean {
  if (!secret) {
    logger.warn(
      "CASHFREE_WEBHOOK_SECRET not set — rejecting all Digilocker webhooks",
    );
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
 * Dispatches a verified Digilocker webhook payload to the KycDocumentService.
 */
export async function dispatchDigilockerEvent(
  payload: DigilockerWebhookPayload,
): Promise<void> {
  const { event_type, data } = payload;

  const validEvents = [
    "DIGILOCKER_VERIFICATION_SUCCESS",
    "DIGILOCKER_VERIFICATION_LINK_EXPIRED",
    "DIGILOCKER_VERIFICATION_CONSENT_DENIED",
    "DIGILOCKER_VERIFICATION_CONSENT_EXPIRED",
    "DIGILOCKER_VERIFICATION_FAILURE",
  ];

  if (!validEvents.includes(event_type)) {
    logger.warn(
      { event_type },
      "Digilocker webhook: unknown event_type — ignoring",
    );
    return;
  }

  logger.info(
    { event_type, verificationId: data.verification_id },
    "Digilocker webhook: dispatching to KycDocumentService",
  );

  await KycDocumentService.handleDigilockerWebhookEvent(
    event_type,
    data.verification_id,
    data,
  );
}
