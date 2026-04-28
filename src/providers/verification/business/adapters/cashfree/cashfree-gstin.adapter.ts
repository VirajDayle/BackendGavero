/**
 * business/adapters/cashfree/cashfree-gstin.adapter.ts
 */

import { z } from "zod";
import { env } from "../../../../../config/env";
import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { post } from "../../../shared/http-utils";
import { IGstinVerifier, GstinVerificationResult } from "../../gstin-verifier.interface";

const CashfreeGstinResponseSchema = z.object({
  valid: z.boolean().optional(),
  message: z.string().optional(),
  GSTIN: z.string().optional(),
  legal_name_of_business: z.string().optional(),
  trade_name_of_business: z.string().optional(),
  gst_in_status: z.string().optional(),
  date_of_registration: z.string().optional(),
  constitution_of_business: z.string().optional(),
  taxpayer_type: z.string().optional(),
  principal_place_address: z.string().optional(),
  // For backward compatibility or different API behavior
  status: z.string().optional(),
  legal_name: z.string().optional(),
  trade_name: z.string().optional(),
  business_status: z.string().optional(),
});

export class CashfreeGstinAdapter
  extends BaseVerificationAdapter
  implements IGstinVerifier
{
  protected readonly providerName = "cashfree_gstin";

  async verify(
    gstin: string,
    businessName?: string,
  ): Promise<GstinVerificationResult> {
    return this.orchestrate(async () => {
      const raw = await post(
        `https://sandbox.cashfree.com/verification/gstin`,
        {
          "x-client-id": env.CASHFREE_ID,
          "x-client-secret": env.CASHFREE_SECRET_TOKEN,
        },
        { GSTIN: gstin, business_name: businessName },
      );

      const validated = CashfreeGstinResponseSchema.parse(raw);

      return {
        valid: validated.valid ?? validated.status === "VALID",
        legalName: validated.legal_name_of_business ?? validated.legal_name,
        tradeName: validated.trade_name_of_business ?? validated.trade_name,
        status: validated.gst_in_status ?? validated.business_status,
        message: validated.message,
        registrationDate: validated.date_of_registration,
        constitutionOfBusiness: validated.constitution_of_business,
        taxpayerType: validated.taxpayer_type,
        principalPlaceAddress: validated.principal_place_address,
        details: raw,
      };
    }, "verify");
  }
}
