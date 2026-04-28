/**
 * bank/bank.factory.ts
 */

import { env } from "../../../config/env";
import { IBankAccountVerifier } from "./bank-account-verifier.interface";
import { IPennyDropProvider } from "./penny-drop-provider.interface";
import { CashfreeBankAccountAdapter } from "./adapters/cashfree/cashfree-bank-account.adapter";
import { CashfreePennyDropAdapter } from "./adapters/cashfree/cashfree-penny-drop.adapter";
import { RazorpayPennyDropAdapter } from "./adapters/razorpay/razorpay-penny-drop.adapter";
import { MockBankAccountAdapter } from "./adapters/mock/mock-bank-account.adapter";
import { MockPennyDropAdapter } from "./adapters/mock/mock-penny-drop.adapter";

export class BankVerificationFactory {
  static getAccountVerifier(): IBankAccountVerifier {
    const provider = env.BANK_ACCOUNT_VERIFIER || "mock";

    switch (provider) {
      case "cashfree":
        return new CashfreeBankAccountAdapter();
      case "mock":
        return new MockBankAccountAdapter();
      default:
        return new MockBankAccountAdapter();
    }
  }

  static getPennyDropProvider(): IPennyDropProvider {
    const provider = env.PENNY_DROP_PROVIDER || "mock";

    switch (provider) {
      case "cashfree":
        return new CashfreePennyDropAdapter();
      case "razorpay":
        return new RazorpayPennyDropAdapter();
      case "mock":
        return new MockPennyDropAdapter();
      default:
        return new MockPennyDropAdapter();
    }
  }
}
