/**
 * bank/adapters/razorpay/razorpay-penny-drop.adapter.ts
 */

import { z } from "zod";
import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { IPennyDropProvider } from "../../penny-drop-provider.interface";
import {
  PennyDropInitiateResult,
  PennyDropStatusResult,
} from "../../bank.types";

/** Placeholder schema for Razorpay */
const RazorpayResponseSchema = z.any();

export class RazorpayPennyDropAdapter
  extends BaseVerificationAdapter
  implements IPennyDropProvider
{
  protected readonly providerName = "razorpay_penny_drop";

  async initiate(
    verificationId: string,
    name: string,
    idempotencyKey?: string,
  ): Promise<PennyDropInitiateResult> {
    return this.orchestrate(async () => {
       // Placeholder: Implementation for Razorpay penny drop
       throw new Error("Razorpay penny drop implementation pending API details");
    }, "initiate");
  }

  async getStatus(verificationId: string): Promise<PennyDropStatusResult> {
    return this.orchestrate(async () => {
       // Placeholder: Implementation for Razorpay status check
       throw new Error("Razorpay penny drop status implementation pending API details");
    }, "getStatus");
  }
}
