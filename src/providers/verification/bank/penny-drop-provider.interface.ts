/**
 * bank/penny-drop-provider.interface.ts
 */

import {
  PennyDropInitiateResult,
  PennyDropStatusResult,
} from "./bank.types";

export interface IPennyDropProvider {
  initiate(
    verificationId: string,
    name: string,
    idempotencyKey?: string,
  ): Promise<PennyDropInitiateResult>;

  getStatus(
    verificationId: string,
  ): Promise<PennyDropStatusResult>;
}
