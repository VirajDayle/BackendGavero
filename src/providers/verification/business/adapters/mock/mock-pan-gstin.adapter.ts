/**
 * business/adapters/mock/mock-pan-gstin.adapter.ts
 */

import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import {
  IPanGstinVerifier,
  PanGstinVerificationResult,
} from "../../pan-gstin-verifier.interface";

export class MockPanGstinAdapter
  extends BaseVerificationAdapter
  implements IPanGstinVerifier
{
  protected readonly providerName = "mock_pan_gstin";

  async verify(
    pan: string,
    verificationId: string,
  ): Promise<PanGstinVerificationResult> {
    return this.orchestrate(async () => {
      return {
        referenceId: 1358,
        verificationId,
        status: "SUCCESS",
        pan,
        gstinList: [
          {
            gstin: "29AAFCD5862R1ZR",
            status: "ACTIVE",
            state: "KARNATAKA",
          },
          {
            gstin: "27AAFCD5862R1ZV",
            status: "ACTIVE",
            state: "MAHARASHTRA",
          },
        ],
      };
    }, "verify");
  }
}
