/**
 * business/business.factory.ts
 */

import { env } from "../../../config/env";
import { IGstinVerifier } from "./gstin-verifier.interface";
import { IPanGstinVerifier } from "./pan-gstin-verifier.interface";

import { CashfreeGstinAdapter } from "./adapters/cashfree/cashfree-gstin.adapter";
import { CashfreePanGstinAdapter } from "./adapters/cashfree/cashfree-pan-gstin.adapter";
import { MockGstinAdapter } from "./adapters/mock/mock-gstin.adapter";
import { MockPanGstinAdapter } from "./adapters/mock/mock-pan-gstin.adapter";

export class BusinessVerificationFactory {
  static getGstinVerifier(): IGstinVerifier {
    const provider = env.GSTIN_VERIFIER || "mock";

    switch (provider) {
      case "cashfree":
        return new CashfreeGstinAdapter();
      case "mock":
        return new MockGstinAdapter();
      default:
        return new MockGstinAdapter();
    }
  }

  static getPanGstinVerifier(): IPanGstinVerifier {
    const provider = env.PAN_GSTIN_VERIFIER || "mock";

    switch (provider) {
      case "cashfree":
        return new CashfreePanGstinAdapter();
      case "mock":
        return new MockPanGstinAdapter();
      default:
        return new MockPanGstinAdapter();
    }
  }
}


