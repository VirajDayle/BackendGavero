/**
 * identity/digilocker-verifier.interface.ts
 *
 * Defines the provider-agnostic contract for Digilocker verification.
 *
 * Two distinct operations:
 *   1. verifyAccount — check whether the user has a registered Digilocker
 *      account (identified by mobile number OR Aadhaar number).
 *   2. createUrl — initiate a Digilocker consent session and get a redirect
 *      URL so the user can authenticate and share documents.
 */

// ── Verify Account ────────────────────────────────────────────────────────────

export type DigilockerAccountStatus = "ACCOUNT_EXISTS" | "ACCOUNT_NOT_FOUND";

export interface DigilockerVerifyAccountInput {
  verificationId: string;
  /** mobileNumber must be supplied. */
  mobileNumber?: string;
  aadhaarNumber?: string;
}

export interface DigilockerAccountResult {
  verificationId: string;
  referenceId?: number;
  status: DigilockerAccountStatus;
  digilockerId?: string;
  /** Returned when mobile was used to look up the account. */
  mobileNumber?: string;
  /** Masked Aadhaar returned when Aadhaar was used to look up the account. */
  aadhaarNumber?: string;
}

// ── Create URL ────────────────────────────────────────────────────────────────

export type DigilockerDocumentType = "PAN" | "DRIVING_LICENSE";

export type DigilockerUserFlow = "signup" | "login";

export type DigilockerUrlStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface DigilockerCreateUrlInput {
  verificationId: string;
  documentRequested: DigilockerDocumentType[];
  redirectUrl: string;
  userFlow?: DigilockerUserFlow;
}

export interface DigilockerUrlResult {
  verificationId: string;
  referenceId?: number;
  url: string;
  status: DigilockerUrlStatus;
  documentRequested: DigilockerDocumentType[];
  redirectUrl: string;
  userFlow?: DigilockerUserFlow;
}

// ── Get Details ───────────────────────────────────────────────────────────────

export type DigilockerDetailsStatus =
  | "PENDING"
  | "AUTHENTICATED"
  | "EXPIRED"
  | "CONSENT_DENIED";

export interface DigilockerGetDetailsInput {
  /** Exactly one of verificationId or referenceId must be supplied. */
  verificationId?: string;
  referenceId?: number;
}

export interface DigilockerDetailsResult {
  verificationId: string;
  referenceId: number;
  status: DigilockerDetailsStatus;
  documentRequested: DigilockerDocumentType[];
  documentConsent?: DigilockerDocumentType[] | null;
  documentConsentValidity?: string | null;
  userDetails?: {
    name?: string;
    dob?: string;
    gender?: string;
    mobile?: string;
  } | null;
}

// ── Get Document ──────────────────────────────────────────────────────────────

export interface DigilockerGetDocumentInput {
  type: DigilockerDocumentType;
  verificationId?: string;
  referenceId?: number;
}


export interface DigilockerPanData {
  pan: string;
  namePanCard: string;
  dob: string;
  gender: string;
  type: string;
  xmlFile: string | null;
}

export interface DigilockerDlData {
  dlNumber: string;
  name: string;
  dob: string;
  careOf: string;
  gender: string;
  issueDate: string;
  expiryDate: string;
  issuedAt: string;
  presentAddress: string;
  permanentAddress: string;
  photoLink: string | null;
  xmlFile: string | null;
  categories: Array<{
    classOfVehicle: string;
    description: string;
    issueDate: string;
  }>;
}

export interface DigilockerDocumentResult {
  verificationId: string;
  referenceId: number;
  status: string;
  message?: string;
  type: DigilockerDocumentType;
  data: DigilockerPanData | DigilockerDlData | null;
}

// ── Interface ─────────────────────────────────────────────────────────────────

export interface IDigilockerVerifier {
  verifyAccount(
    input: DigilockerVerifyAccountInput,
  ): Promise<DigilockerAccountResult>;

  createUrl(input: DigilockerCreateUrlInput): Promise<DigilockerUrlResult>;

  getDetails(
    input: DigilockerGetDetailsInput,
  ): Promise<DigilockerDetailsResult>;

  getDocument(
    input: DigilockerGetDocumentInput,
  ): Promise<DigilockerDocumentResult>;
}
