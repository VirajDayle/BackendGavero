/**
 * bank/bank.types.ts
 */

export interface IfscDetails {
  bank: string;
  ifsc: string;
  address: string;
  city: string;
  state: string;
  branch: string;
  category: string;
  swiftCode?: string;
  micr?: number;
  nbin?: number;
}

export interface BankVerificationResult {
  accountStatus: "VALID" | "INVALID";
  referenceId: string;
  accountStatusCode:
  | "ACCOUNT_IS_VALID"
  | "INVALID_ACCOUNT_FAIL"
  | "ACCOUNT_BLOCKED"
  | "INVALID_IFSC_FAIL";
  /** Name as it appears at the bank (from API). */
  accountHolderName: string;
  nameMatchScore?: string;
  nameMatchResult?: string;
  ifscCode: string;
  bankName: string;
  /** Branch name returned by the bank API. */
  branchName: string;
  city?: string;
  micr?: number;
  utr?: string;
  ifscDetails?: IfscDetails;
}

export interface PennyDropInitiateResult {
  verificationId: string;
  refId: string;
  upiLink: string;
  gpay: string;
  phonepe: string;
  paytm: string;
}

export interface PennyDropStatusResult {
  status: "SUCCESS" | "PENDING" | "FAILED";
  /** The bank account number on file with the provider. */
  bankAccount?: string;
  ifsc?: string;
  upi?: string;
  nameAtBank?: string;
  /** Penny-drop provider reference ID — stored as providerReferenceId. */
  verificationId?: string;
  refId?: string;
  utr?: string;
  accountType: string;
  nameMatchScore?: string;
  nameMatchResult?: string;
  addedOn?: string;
  processedOn?: string;
  pennyCollectedOn?: string;
  reversalStatus?: string;
  /** Legacy field kept for compatibility. */
  referenceId: string;
}

