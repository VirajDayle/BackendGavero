/**
 * business/pan-gstin-verifier.interface.ts
 */

export interface PanGstinItem {
  gstin: string;
  status: string;
  state: string;
}

export interface PanGstinVerificationResult {
  referenceId: number;
  verificationId: string;
  status: string;
  pan: string;
  gstinList: PanGstinItem[];
}

export interface IPanGstinVerifier {
  verify(pan: string, verificationId: string): Promise<PanGstinVerificationResult>;
}
