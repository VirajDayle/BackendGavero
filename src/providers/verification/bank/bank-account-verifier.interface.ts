/**
 * bank/bank-account-verifier.interface.ts
 */

import { BankVerificationResult } from "./bank.types";

export interface IBankAccountVerifier {
  verify(
    accountNumber: string,
    ifsc: string,
    holderName: string,
  ): Promise<BankVerificationResult>;
}
