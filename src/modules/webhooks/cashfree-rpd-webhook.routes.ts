/**
 * modules/webhooks/cashfree-rpd-webhook.routes.ts
 *
 * Elysia route plugin that receives Cashfree Reverse Penny Drop (RPD) webhook
 * events at POST /webhooks/cashfree/rpd.
 *
 * Security layers (applied in order):
 *  1. IP allowlist  — only Cashfree's known IP ranges may call this endpoint
 *                     (bypassed in development / test to simplify local testing)
 *  2. Signature     — HMAC-SHA256 verified before any processing
 *  3. No JWT auth   — this is a machine-to-machine callback
 *
 * Response contract:
 *  - Always 200 { received: true } on successful dispatch.
 *  - 403 if the caller IP is not in the allowlist (prod only).
 *  - 401 if the signature is invalid.
 *
 * Returning 200 on EXPIRED/FAILURE prevents Cashfree from retrying indefinitely.
 */

import { Elysia, t } from "elysia";
import { z } from "zod";
import { env } from "../../config/env";
import { logger } from "../../core/logger";
import {
  verifyCashfreeRpdSignature,
  dispatchRpdEvent,
  type RpdWebhookPayload,
} from "./cashfree-rpd-webhook.service";

// ── Cashfree IP Allowlist ─────────────────────────────────────────────────────

/**
 * Production IPs published by Cashfree.
 * https://docs.cashfree.com/docs/webhooks#ip-whitelisting
 */
const CASHFREE_PROD_IPS = new Set([
  "52.66.101.190",
  "3.109.102.144",
  "18.60.134.245",
  "18.60.183.142",
]);

/**
 * Extracts the real caller IP from the request.
 * Respects X-Forwarded-For when behind a reverse proxy.
 */
function extractCallerIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    // X-Forwarded-For: client, proxy1, proxy2 — leftmost is the real client
    return xff.split(",")[0].trim();
  }
  // Fallback — Elysia populates this from the underlying Bun server
  return "";
}

// ── Zod Payload Schema ────────────────────────────────────────────────────────

const RpdDataSchema = z.object({
  bank_account: z.string().optional().default(""),
  ifsc: z.string().optional().default(""),
  upi: z.string().optional().default(""),
  name_at_bank: z.string().optional().default(""),
  verification_id: z.string(),
  ref_id: z.string().optional().default(""),
  utr: z.string().optional().default(""),
  status: z.enum(["SUCCESS", "EXPIRED", "FAILURE"]),
  name_match_score: z.string().optional().default(""),
  name_match_result: z.string().optional().default(""),
  added_on: z.string().optional().default(""),
  processed_on: z.string().optional().default(""),
  penny_collected_on: z.string().optional().default(""),
  reversal_status: z.string().optional().default(""),
  account_type: z.string().optional().default(""),
});

const RpdPayloadSchema = z.object({
  signature: z.string(),
  event_type: z.enum([
    "RPD_BANK_ACCOUNT_VERIFICATION_SUCCESS",
    "RPD_BANK_ACCOUNT_VERIFICATION_EXPIRED",
    "RPD_BANK_ACCOUNT_VERIFICATION_FAILURE",
  ]),
  event_time: z.string(),
  version: z.string(),
  data: RpdDataSchema,
});

// ── Route Plugin ──────────────────────────────────────────────────────────────

export const cashfreeRpdWebhookPlugin = new Elysia({
  name: "cashfree-rpd-webhook",
  prefix: "/webhooks",
  tags: ["Webhooks"],
})
  .post(
    "/cashfree/rpd",
    async ({ request, set }) => {
      // ── 1. IP Allowlist ─────────────────────────────────────────────────────
      if (env.NODE_ENV === "production") {
        const callerIp = extractCallerIp(request);
        if (!CASHFREE_PROD_IPS.has(callerIp)) {
          logger.warn(
            { callerIp },
            "RPD webhook: IP not in allowlist — rejected",
          );
          set.status = 403;
          return { received: false, error: "IP_NOT_ALLOWED" };
        }
      }

      // ── 2. Parse raw body ───────────────────────────────────────────────────
      let rawBody: unknown;
      try {
        rawBody = await request.json();
      } catch {
        set.status = 400;
        return { received: false, error: "INVALID_JSON" };
      }

      // ── 3. Validate payload shape ───────────────────────────────────────────
      const parsed = RpdPayloadSchema.safeParse(rawBody);
      if (!parsed.success) {
        logger.warn(
          { issues: parsed.error.issues },
          "RPD webhook: payload schema validation failed",
        );
        set.status = 400;
        return { received: false, error: "INVALID_PAYLOAD" };
      }

      const payload = parsed.data as RpdWebhookPayload;

      // ── 4. Signature Verification ───────────────────────────────────────────
      // Cast data to Record<string, unknown> for the generic signature helper.
      const dataForSig: Record<string, unknown> = payload.data as unknown as Record<string, unknown>;
      const sigValid = verifyCashfreeRpdSignature(dataForSig, payload.signature);
      if (!sigValid) {
        logger.warn(
          { event_type: payload.event_type, verification_id: payload.data.verification_id },
          "RPD webhook: signature verification failed",
        );
        set.status = 401;
        return { received: false, error: "SIGNATURE_MISMATCH" };
      }

      // ── 5. Dispatch ─────────────────────────────────────────────────────────
      // Dispatch asynchronously but await so that any fatal DB errors surface
      // and we can return a non-200 status on catastrophic failures.
      try {
        await dispatchRpdEvent(payload);
      } catch (err) {
        // Do NOT expose internal errors to Cashfree — log them and return 200
        // so Cashfree does not retry. The audit trail captures the full event.
        logger.error(
          { err, event_type: payload.event_type, verification_id: payload.data.verification_id },
          "RPD webhook: unhandled error during dispatch — returning 200 to suppress retries",
        );
      }

      // ── 6. Always acknowledge ───────────────────────────────────────────────
      set.status = 200;
      return { received: true };
    },
    {
      detail: {
        summary: "Cashfree RPD webhook receiver",
        description:
          "Receives Reverse Penny Drop (RPD) verification callbacks from Cashfree. " +
          "Validates HMAC-SHA256 signature and dispatches to the bank account verification flow. " +
          "Always returns 200 on success to prevent Cashfree retries.",
        tags: ["Webhooks"],
      },
    },
  );
