/**
 * identity/adapters/mock/mock-pan.adapter.ts
 */

import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { IPanVerifier, PanVerificationResult } from "../../pan-verifier.interface";

export class MockPanAdapter
  extends BaseVerificationAdapter
  implements IPanVerifier
{
  protected readonly providerName = "mock_pan";

  async verify(
    pan: string,
    verificationId: string,
    name: string,
    dob: string,
  ): Promise<PanVerificationResult> {
    return this.orchestrate(async () => {
      return {
        verificationId,
        referenceId: 12345,
        pan,
        name,
        dob,
        nameMatch: "Y",
        dobMatch: "Y",
        panStatus: "E",
        status: "VALID",
        aadhaarSeedingStatus: "Y",
        aadhaarSeedingStatusDesc: "Aadhaar is linked to PAN",
      };
    }, "verify");
  }
}

