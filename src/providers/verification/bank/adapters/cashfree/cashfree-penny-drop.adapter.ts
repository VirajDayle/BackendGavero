/**
 * bank/adapters/cashfree/cashfree-penny-drop.adapter.ts
 */

import { z } from "zod";
import { env } from "../../../../../config/env";
import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { post, get } from "../../../shared/http-utils";
import { IPennyDropProvider } from "../../penny-drop-provider.interface";
import {
  PennyDropInitiateResult,
  PennyDropStatusResult,
} from "../../bank.types";

const CashfreeInitiateResponseSchema = z.object({
  verification_id: z.string(),
  ref_id: z.string(),
  upi_link: z.string(),
  gpay: z.string().optional(),
  phonepe: z.string().optional(),
  paytm: z.string().optional(),
});

const CashfreeStatusResponseSchema = z.object({
  status: z.enum(["SUCCESS", "PENDING", "FAILED"]),
  bank_account: z.string().optional(),
  ifsc: z.string().optional(),
  name_at_bank: z.string().optional(),
  utr: z.string().optional(),
  account_type: z.string().optional(),
  ref_id: z.string(),
});

export class CashfreePennyDropAdapter
  extends BaseVerificationAdapter
  implements IPennyDropProvider {
  protected readonly providerName = "cashfree_penny_drop";

  async initiate(
    verificationId: string,
    name: string,
    idempotencyKey?: string,
  ): Promise<PennyDropInitiateResult> {
    return this.orchestrate(async () => {
      const raw = await post(
        `https://sandbox.cashfree.com/verification/reverse-penny-drop`,
        {
          "x-client-id": env.CASHFREE_ID,
          "x-client-secret": env.CASHFREE_SECRET_TOKEN,
          ...(idempotencyKey && { "x-idempotency-key": idempotencyKey }),
        },
        {
          verification_id: verificationId,
          name: name,
        },
      );

      const validated = CashfreeInitiateResponseSchema.parse(raw);

      return {
        verificationId: validated.verification_id,
        refId: validated.ref_id,
        upiLink: validated.upi_link,
        gpay: validated.gpay ?? "",
        phonepe: validated.phonepe ?? "",
        paytm: validated.paytm ?? "",
      };
    }, "initiate");
  }

  async getStatus(verificationId: string): Promise<PennyDropStatusResult> {
    return this.orchestrate(async () => {
      const raw = await get(
        `https://sandbox.cashfree.com/verification/remitter/status?verification_id=${verificationId}`,
        {
          "x-client-id": env.CASHFREE_ID,
          "x-client-secret": env.CASHFREE_SECRET_TOKEN,
        },
      );

      const validated = CashfreeStatusResponseSchema.parse(raw);

      return {
        status: validated.status,
        bankAccount: validated.bank_account,
        ifsc: validated.ifsc,
        nameAtBank: validated.name_at_bank,
        utr: validated.utr,
        accountType: validated.account_type as any,
        referenceId: validated.ref_id,
      };
    }, "getStatus");
  }
}
