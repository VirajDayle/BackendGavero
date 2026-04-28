/**
 * identity/pan-verifier.interface.ts
 */

export interface PanVerificationResult {
  verificationId: string;
  referenceId: number;
  pan: string;
  name: string;
  dob: string;
  nameMatch: string;
  dobMatch: string;
  panStatus: string;
  status: string;
  aadhaarSeedingStatus: string;
  aadhaarSeedingStatusDesc: string;
}

export interface IPanVerifier {
  verify(
    pan: string,
    verificationId: string,
    name: string,
    dob: string,
  ): Promise<PanVerificationResult>;
}
