/**
 * identity/adapters/cashfree/cashfree-pan.adapter.ts
 */

import { z } from "zod";
import { env } from "../../../../../config/env";
import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { post } from "../../../shared/http-utils";
import {
  IPanVerifier,
  PanVerificationResult,
} from "../../pan-verifier.interface";

const CashfreePanResponseSchema = z.object({
  verification_id: z.string(),
  reference_id: z.number(),
  pan: z.string(),
  name: z.string(),
  dob: z.iso.date(),
  name_match: z.string(),
  dob_match: z.string(),
  pan_status: z.string(),
  status: z.enum(["VALID", "INVALID"]),
  aadhaar_seeding_status: z.string(),
  aadhaar_seeding_status_desc: z.string(),
});

export type CashfreePanResponse = z.infer<typeof CashfreePanResponseSchema>;

export class CashfreePanAdapter
  extends BaseVerificationAdapter
  implements IPanVerifier
{
  protected readonly providerName = "cashfree_pan";

  async verify(
    pan: string,
    verificationId: string,
    name: string,
    dob: string,
  ): Promise<PanVerificationResult> {
    return this.orchestrate(async () => {
      const raw = await post(
        `https://sandbox.cashfree.com/verification/pan-lite`,
        {
          "x-client-id": env.CASHFREE_ID,
          "x-client-secret": env.CASHFREE_SECRET_TOKEN,
        },
        {
          verification_id: verificationId,
          pan,
          name,
          dob,
        },
      );

      const validated = CashfreePanResponseSchema.parse(raw);

      return {
        verificationId: validated.verification_id,
        referenceId: validated.reference_id,
        pan: validated.pan,
        name: validated.name,
        dob: validated.dob,
        nameMatch: validated.name_match,
        dobMatch: validated.dob_match,
        panStatus: validated.pan_status,
        status: validated.status,
        aadhaarSeedingStatus: validated.aadhaar_seeding_status,
        aadhaarSeedingStatusDesc: validated.aadhaar_seeding_status_desc,
      };
    }, "verify");
  }
}
