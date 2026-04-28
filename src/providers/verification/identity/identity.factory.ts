/**
 * identity/identity.factory.ts
 */

import { env } from "../../../config/env";
import { IPanVerifier } from "./pan-verifier.interface";
import { IDigilockerVerifier } from "./digilocker-verifier.interface";
import { IDrivingLicenseVerifier } from "./dl-verifier.interface";
import { CashfreePanAdapter } from "./adapters/cashfree/cashfree-pan.adapter";
import { CashfreeDigilockerAdapter } from "./adapters/cashfree/cashfree-digilocker";
import { CashfreeDrivingLicenseAdapter } from "./adapters/cashfree/cashfree-dl.adapter";
import { MockPanAdapter } from "./adapters/mock/mock-pan.adapter";
import { MockDigilockerAdapter } from "./adapters/mock/mock-digilocker.adapter";
import { MockDrivingLicenseAdapter } from "./adapters/mock/mock-dl.adapter";

export class IdentityVerificationFactory {
  static getPanVerifier(): IPanVerifier {
    const provider = env.PAN_VERIFIER || "mock";

    switch (provider) {
      case "cashfree":
        return new CashfreePanAdapter();
      case "mock":
        return new MockPanAdapter();
      default:
        return new MockPanAdapter();
    }
  }

  static getDigilockerVerifier(): IDigilockerVerifier {
    const provider = env.DIGILOCKER_VERIFIER || "mock";

    switch (provider) {
      case "cashfree":
        return new CashfreeDigilockerAdapter();
      case "mock":
        return new MockDigilockerAdapter();
      default:
        return new MockDigilockerAdapter();
    }
  }

  static getDrivingLicenseVerifier(): IDrivingLicenseVerifier {
    const provider = env.DL_VERIFIER || "mock";

    switch (provider) {
      case "cashfree":
        return new CashfreeDrivingLicenseAdapter();
      case "mock":
        return new MockDrivingLicenseAdapter();
      default:
        return new MockDrivingLicenseAdapter();
    }
  }
}
