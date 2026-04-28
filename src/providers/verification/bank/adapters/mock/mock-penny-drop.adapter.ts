/**
 * bank/adapters/mock/mock-penny-drop.adapter.ts
 */

import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { IPennyDropProvider } from "../../penny-drop-provider.interface";
import { PennyDropInitiateResult, PennyDropStatusResult } from "../../bank.types";

export class MockPennyDropAdapter
  extends BaseVerificationAdapter
  implements IPennyDropProvider
{
  protected readonly providerName = "mock_penny_drop";

  async initiate(verificationId: string, name: string): Promise<PennyDropInitiateResult> {
    return this.orchestrate(async () => {
      return {
        verificationId,
        refId: `MOCK_REF_${Math.random().toString(36).substring(7).toUpperCase()}`,
        upiLink: "upi://pay?pa=mock@upi",
        gpay: "upi://pay?pa=mock@upi",
        phonepe: "upi://pay?pa=mock@upi",
        paytm: "upi://pay?pa=mock@upi",
      };
    }, "initiate");
  }

  async getStatus(verificationId: string): Promise<PennyDropStatusResult> {
    return this.orchestrate(async () => {
      return {
        status: "SUCCESS",
        bankAccount: "026291800001191",
        ifsc: "YESB0000262",
        upi: "success@upi",
        nameAtBank: "MOCK USER NAME",
        utr: `MOCK_UTR_${Date.now()}`,
        nameMatchScore: "95.00",
        nameMatchResult: "GOOD_PARTIAL_MATCH",
        accountType: "SAVINGS",
        reversalStatus: "PENDING",
        verificationId,
        referenceId: verificationId,
      };
    }, "getStatus");
  }
}


