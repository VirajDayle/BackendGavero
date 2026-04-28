/**
 * business/adapters/cashfree/cashfree-pan-gstin.adapter.ts
 */

import { z } from "zod";
import { env } from "../../../../../config/env";
import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { post } from "../../../shared/http-utils";
import {
  IPanGstinVerifier,
  PanGstinVerificationResult,
} from "../../pan-gstin-verifier.interface";

const cashfreePanGstinResponseSchema = z.object({
  reference_id: z.number(),
  verification_id: z.string(),
  status: z.string(),
  pan: z.string(),
  gstin_list: z
    .array(
      z.object({
        gstin: z.string(),
        status: z.string(),
        state: z.string(),
      }),
    )
    .optional()
    .default([]),
  // Handle the inconsistent camelCase in failure response if it happens
  gstinList: z
    .array(
      z.object({
        gstin: z.string(),
        status: z.string(),
        state: z.string(),
      }),
    )
    .optional(),
});

export class CashfreePanGstinAdapter
  extends BaseVerificationAdapter
  implements IPanGstinVerifier
{
  protected readonly providerName = "cashfree_pan_gstin";

  async verify(
    pan: string,
    verificationId: string,
  ): Promise<PanGstinVerificationResult> {
    return this.orchestrate(async () => {
      const response = await post(
        "https://sandbox.cashfree.com/verification/pan-gstin",
        {
          "x-client-id": env.CASHFREE_ID,
          "x-client-secret": env.CASHFREE_SECRET_TOKEN,
        },
        { pan, verification_id: verificationId },
      );

      const parsed = cashfreePanGstinResponseSchema.parse(response);

      return {
        referenceId: parsed.reference_id,
        verificationId: parsed.verification_id,
        status: parsed.status,
        pan: parsed.pan,
        gstinList:
          parsed.gstin_list.length > 0
            ? parsed.gstin_list
            : (parsed.gstinList ?? []),
      };
    }, "verify");
  }
}
