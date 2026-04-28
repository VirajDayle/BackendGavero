/**
 * bank/adapters/mock/mock-bank-account.adapter.ts
 */

import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { IBankAccountVerifier } from "../../bank-account-verifier.interface";
import { BankVerificationResult } from "../../bank.types";

export class MockBankAccountAdapter
  extends BaseVerificationAdapter
  implements IBankAccountVerifier
{
  protected readonly providerName = "mock_bank";

  async verify(accountNumber: string, ifsc: string): Promise<BankVerificationResult> {
    return this.orchestrate(async () => {
      return {
        accountStatus: "VALID",
        referenceId: `MOCK_REF_${Date.now()}`,
        accountStatusCode: "ACCOUNT_IS_VALID",
        accountHolderName: "MOCK USER NAME",
        ifscCode: ifsc,
        bankName: "MOCK BANK",
        branchName: "MOCK BRANCH",
      };
    }, "verify");
  }
}

