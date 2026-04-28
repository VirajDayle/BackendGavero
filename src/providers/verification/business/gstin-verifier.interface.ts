/**
 * business/gstin-verifier.interface.ts
 */

export interface GstinVerificationResult {
  valid: boolean;
  legalName?: string;
  tradeName?: string;
  status?: string;
  message?: string;
  registrationDate?: string;
  constitutionOfBusiness?: string;
  taxpayerType?: string;
  principalPlaceAddress?: string;
  details?: any; // To store the full rich response if needed
}

export interface IGstinVerifier {
  verify(gstin: string, businessName?: string): Promise<GstinVerificationResult>;
}
