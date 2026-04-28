/**
 * bank/adapters/cashfree/cashfree-bank-account.adapter.ts
 */

import { z } from "zod";
import { env } from "../../../../../config/env";
import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { post } from "../../../shared/http-utils";
import { IBankAccountVerifier } from "../../bank-account-verifier.interface";
import { BankVerificationResult } from "../../bank.types";

const CashfreeBankSyncResponseSchema = z.object({
  account_status: z.enum(["VALID", "INVALID"]),
  account_status_code: z.enum([
    "ACCOUNT_IS_VALID",
    "INVALID_ACCOUNT_FAIL",
    "ACCOUNT_BLOCKED",
    "INVALID_IFSC_FAIL",
  ]),
  name_at_bank: z.string(),
  ifsc: z.string(),
  bank_name: z.string(),
  branch: z.string().optional(),
  reference_id: z.number().or(z.string()),
});

export class CashfreeBankAccountAdapter
  extends BaseVerificationAdapter
  implements IBankAccountVerifier
{
  protected readonly providerName = "cashfree";

  async verify(
    accountNumber: string,
    ifsc: string,
    holderName: string,
  ): Promise<BankVerificationResult> {
    return this.orchestrate(async () => {
      const raw = await post(
        `https://sandbox.cashfree.com/verification/bank-account/sync`,
        {
          "x-client-id": env.CASHFREE_ID,
          "x-client-secret": env.CASHFREE_SECRET_TOKEN,
        },
        {
          bank_account: accountNumber,
          ifsc: ifsc,
          name: holderName,
        },
      );

      const validated = CashfreeBankSyncResponseSchema.parse(raw);

      return {
        accountStatus: validated.account_status,
        accountStatusCode: validated.account_status_code,
        accountHolderName: validated.name_at_bank,
        ifscCode: validated.ifsc,
        bankName: validated.bank_name,
        branchName: validated.branch ?? "",
        referenceId: String(validated.reference_id),
      };
    }, "verify");
  }
}
