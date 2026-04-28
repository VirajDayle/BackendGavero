/**
 * business/adapters/mock/mock-gstin.adapter.ts
 */

import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { IGstinVerifier, GstinVerificationResult } from "../../gstin-verifier.interface";

export class MockGstinAdapter
  extends BaseVerificationAdapter
  implements IGstinVerifier
{
  protected readonly providerName = "mock_gstin";

  async verify(
    gstin: string,
    businessName?: string,
  ): Promise<GstinVerificationResult> {
    return this.orchestrate(async () => {
      return {
        valid: true,
        legalName: "UJJIVAN SMALL FINANCE BANK LIMITED",
        tradeName: businessName || "UJJIVAN SMALL FINANCE BANK",
        status: "Active",
        message: "GSTIN Exists",
        registrationDate: "2017-09-30",
        constitutionOfBusiness: "Public Limited Company",
        taxpayerType: "Regular",
        principalPlaceAddress:
          "First Floor 3512-DISPUR Prithivi Mansion opp. KFC building G.S. Road, Lachit Nagar Assam 781007",
      };
    }, "verify");
  }
}
