/**
 * modules/webhooks/cashfree-digilocker-webhook.routes.ts
 *
 * Elysia route plugin that receives Cashfree Digilocker verification webhook
 * events at POST /webhooks/cashfree/digilocker.
 */

import { Elysia, t } from "elysia";
import { z } from "zod";
import { env } from "../../config/env";
import { logger } from "../../core/logger";
import {
  verifyCashfreeDigilockerSignature,
  dispatchDigilockerEvent,
  type DigilockerWebhookPayload,
} from "./cashfree-digilocker-webhook.service";

// ── Cashfree IP Allowlist ─────────────────────────────────────────────────────

const CASHFREE_PROD_IPS = new Set([
  "52.66.101.190",
  "3.109.102.144",
  "18.60.134.245",
  "18.60.183.142",
]);

function extractCallerIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "";
}

// ── Zod Payload Schema ────────────────────────────────────────────────────────

const DigilockerWebhookDataSchema = z.object({
  verification_id: z.string(),
  reference_id: z.number(),
  status: z.string(),
  user_details: z.any().optional(),
  document_requested: z.array(z.string()).optional(),
  document_consent: z.array(z.string()).nullable().optional(),
  document_consent_validity: z.string().nullable().optional(),
});

const DigilockerWebhookPayloadSchema = z.object({
  signature: z.string(),
  event_type: z.enum([
    "DIGILOCKER_VERIFICATION_SUCCESS",
    "DIGILOCKER_VERIFICATION_LINK_EXPIRED",
    "DIGILOCKER_VERIFICATION_CONSENT_DENIED",
    "DIGILOCKER_VERIFICATION_CONSENT_EXPIRED",
    "DIGILOCKER_VERIFICATION_FAILURE",
  ]),
  event_time: z.string(),
  version: z.string(),
  data: DigilockerWebhookDataSchema,
});

// ── Route Plugin ──────────────────────────────────────────────────────────────

export const cashfreeDigilockerWebhookPlugin = new Elysia({
  name: "cashfree-digilocker-webhook",
  prefix: "/webhooks",
  tags: ["Webhooks"],
})
  .post(
    "/cashfree/digilocker",
    async ({ request, set }) => {
      // ── 1. IP Allowlist ─────────────────────────────────────────────────────
      if (env.NODE_ENV === "production") {
        const callerIp = extractCallerIp(request);
        if (!CASHFREE_PROD_IPS.has(callerIp)) {
          logger.warn(
            { callerIp },
            "Digilocker webhook: IP not in allowlist — rejected",
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
      const parsed = DigilockerWebhookPayloadSchema.safeParse(rawBody);
      if (!parsed.success) {
        logger.warn(
          { issues: parsed.error.issues },
          "Digilocker webhook: payload schema validation failed",
        );
        set.status = 400;
        return { received: false, error: "INVALID_PAYLOAD" };
      }

      const payload = parsed.data as DigilockerWebhookPayload;

      // ── 4. Signature Verification ───────────────────────────────────────────
      const dataForSig: Record<string, unknown> = payload.data as unknown as Record<string, unknown>;
      const sigValid = verifyCashfreeDigilockerSignature(dataForSig, payload.signature);
      if (!sigValid) {
        logger.warn(
          { event_type: payload.event_type, verification_id: payload.data.verification_id },
          "Digilocker webhook: signature verification failed",
        );
        set.status = 401;
        return { received: false, error: "SIGNATURE_MISMATCH" };
      }

      // ── 5. Dispatch ─────────────────────────────────────────────────────────
      try {
        await dispatchDigilockerEvent(payload);
      } catch (err) {
        logger.error(
          { err, event_type: payload.event_type, verification_id: payload.data.verification_id },
          "Digilocker webhook: unhandled error during dispatch",
        );
      }

      // ── 6. Always acknowledge ───────────────────────────────────────────────
      set.status = 200;
      return { received: true };
    },
    {
      detail: {
        summary: "Cashfree Digilocker webhook receiver",
        description: "Receives Digilocker verification callbacks from Cashfree.",
        tags: ["Webhooks"],
      },
    },
  );
