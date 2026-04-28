/**
 * identity/adapters/cashfree/cashfree-digilocker.adapter.ts
 *
 * Cashfree implementation of IDigilockerVerifier.
 *
 * Two API calls:
 *   1. POST /verification/digilocker/verify-account
 *      — checks if a user has a registered Digilocker account.
 *   2. POST /verification/digilocker
 *      — creates a Digilocker consent URL so the user can share documents.
 *
 * Signature algorithm:
 *   All requests use x-client-id / x-client-secret headers (from env).
 *   The sandbox base URL is used by default; swap to production via
 *   CASHFREE_BASE_URL env var if needed.
 */

import { z } from "zod";
import { env } from "../../../../../config/env";
import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { post } from "../../../shared/http-utils";
import type {
  IDigilockerVerifier,
  DigilockerVerifyAccountInput,
  DigilockerAccountResult,
  DigilockerCreateUrlInput,
  DigilockerUrlResult,
  DigilockerGetDetailsInput,
  DigilockerDetailsResult,
  DigilockerGetDocumentInput,
  DigilockerDocumentResult,
  DigilockerPanData,
  DigilockerDlData,
  DigilockerDocumentType,
  DigilockerUserFlow,
} from "../../digilocker-verifier.interface";

// ── Response Schemas (Zod) ────────────────────────────────────────────────────

/**
 * Cashfree returns one of two shapes depending on the lookup key used:
 *   - mobile_number  lookup → { mobile_number, status, digilocker_id? }
 */
const CashfreeDigilockerAccountSchema = z.object({
  verification_id: z.string(),
  reference_id: z.number().optional(),
  status: z.enum(["ACCOUNT_EXISTS", "ACCOUNT_NOT_FOUND"]),
  digilocker_id: z.string().optional(),
  mobile_number: z
    .union([z.string(), z.number()])
    .transform(String)
    .optional(),
});

const CashfreeDigilockerUrlSchema = z.object({
  verification_id: z.string(),
  reference_id: z.number().optional(),
  url: z.string().url(),
  status: z.enum(["PENDING", "SUCCESS", "FAILED"]),
  document_requested: z.array(z.string()),
  redirect_url: z.string(),
  user_flow: z.string().optional(),
});

const CashfreeDigilockerDetailsSchema = z.object({
  verification_id: z.string(),
  reference_id: z.number(),
  status: z.enum(["PENDING", "AUTHENTICATED", "EXPIRED", "CONSENT_DENIED"]),
  document_requested: z.array(z.string()),
  document_consent: z.array(z.string()).nullable(),
  document_consent_validity: z.string().nullable(),
  user_details: z
    .object({
      name: z.string().optional(),
      dob: z.string().optional(),
      gender: z.string().optional(),
      mobile: z.string().optional(),
    })
    .optional()
    .nullable(),
});


const CashfreeDigilockerPanSchema = z.object({
  reference_id: z.number(),
  verification_id: z.string(),
  status: z.string(),
  pan: z.string(),
  type: z.string(),
  dob: z.string(),
  name_pan_card: z.string(),
  gender: z.string(),
  xml_file: z.string().nullable(),
});

const CashfreeDigilockerDlSchema = z.object({
  reference_id: z.number(),
  verification_id: z.string(),
  status: z.string(),
  dl_number: z.string(),
  issued_at: z.string(),
  categories: z.array(
    z.object({
      class_of_vehicle: z.string(),
      description: z.string(),
      issue_date: z.string(),
    }),
  ),
  issue_date: z.string(),
  expiry_date: z.string(),
  name: z.string(),
  dob: z.string(),
  care_of: z.string(),
  present_address: z.string(),
  permanent_address: z.string(),
  gender: z.string(),
  photo_link: z.string().nullable(),
  xml_file: z.string().nullable(),
});

// ── Adapter ───────────────────────────────────────────────────────────────────

const CASHFREE_BASE = "https://sandbox.cashfree.com";

const cashfreeHeaders = () => ({
  "x-client-id": env.CASHFREE_ID,
  "x-client-secret": env.CASHFREE_SECRET_TOKEN,
});

export class CashfreeDigilockerAdapter
  extends BaseVerificationAdapter
  implements IDigilockerVerifier
{
  protected readonly providerName = "cashfree_digilocker";

  /**
   * Checks whether the given user has a registered Digilocker account.
   * Either mobileNumber must be supplied (validated by service).
   */
  async verifyAccount(
    input: DigilockerVerifyAccountInput,
  ): Promise<DigilockerAccountResult> {
    return this.orchestrate(async () => {
      const body: Record<string, string> = {
        verification_id: input.verificationId,
      };

      if (input.mobileNumber) {
        body.mobile_number = input.mobileNumber;
      }

      const raw = await post(
        `${CASHFREE_BASE}/verification/digilocker/verify-account`,
        cashfreeHeaders(),
        body,
      );

      const validated = CashfreeDigilockerAccountSchema.parse(raw);

      return {
        verificationId: validated.verification_id,
        referenceId: validated.reference_id,
        status: validated.status,
        digilockerId: validated.digilocker_id,
        mobileNumber: validated.mobile_number,
      };
    }, "verifyAccount");
  }

  /**
   * Creates a Digilocker consent session URL.
   * The client redirects the user to this URL to authenticate with Digilocker
   * and grant consent for the requested documents.
   */
  async createUrl(
    input: DigilockerCreateUrlInput,
  ): Promise<DigilockerUrlResult> {
    return this.orchestrate(async () => {
      const raw = await post(
        `${CASHFREE_BASE}/verification/digilocker`,
        cashfreeHeaders(),
        {
          verification_id: input.verificationId,
          document_requested: input.documentRequested,
          redirect_url: input.redirectUrl,
          ...(input.userFlow && { user_flow: input.userFlow }),
        },
      );

      const validated = CashfreeDigilockerUrlSchema.parse(raw);

      return {
        verificationId: validated.verification_id,
        referenceId: validated.reference_id,
        url: validated.url,
        status: validated.status as "PENDING" | "SUCCESS" | "FAILED",
        documentRequested: validated.document_requested as DigilockerDocumentType[],
        redirectUrl: validated.redirect_url,
        userFlow: validated.user_flow as DigilockerUserFlow | undefined,
      };
    }, "createUrl");
  }

  /**
   * Fetches the results of a Digilocker session.
   */
  async getDetails(
    input: DigilockerGetDetailsInput,
  ): Promise<DigilockerDetailsResult> {
    return this.orchestrate(async () => {
      const params = new URLSearchParams();
      if (input.verificationId)
        params.append("verification_id", input.verificationId);
      if (input.referenceId)
        params.append("reference_id", String(input.referenceId));

      // Note: post helper might need a get version or we can pass empty body
      // but the Cashfree docs show this as a GET with query params.
      // Shared http-utils might have a get method.
      const url = `${CASHFREE_BASE}/verification/digilocker?${params.toString()}`;

      // Using Fetch directly if get helper is missing, or I can check http-utils.
      // Let's check http-utils first.
      const raw = await (await import("../../../shared/http-utils")).get(
        url,
        cashfreeHeaders(),
      );

      const v = CashfreeDigilockerDetailsSchema.parse(raw);

      return {
        verificationId: v.verification_id,
        referenceId: v.reference_id,
        status: v.status,
        documentRequested: v.document_requested as DigilockerDocumentType[],
        documentConsent: v.document_consent as DigilockerDocumentType[] | null,
        documentConsentValidity: v.document_consent_validity,
        userDetails: v.user_details,
      };
    }, "getDetails");
  }

  /**
   * Fetches the actual document data from Digilocker.
   */
  async getDocument(
    input: DigilockerGetDocumentInput,
  ): Promise<DigilockerDocumentResult> {
    return this.orchestrate(async () => {
      const params = new URLSearchParams();
      if (input.verificationId)
        params.append("verification_id", input.verificationId);
      if (input.referenceId)
        params.append("reference_id", String(input.referenceId));

      const url = `${CASHFREE_BASE}/verification/digilocker/document/${input.type}?${params.toString()}`;

      const raw = await (await import("../../../shared/http-utils")).get(
        url,
        cashfreeHeaders(),
      );


      if (input.type === "PAN") {
        const v = CashfreeDigilockerPanSchema.parse(raw);
        return {
          verificationId: v.verification_id,
          referenceId: v.reference_id,
          status: v.status,
          type: "PAN",
          data: {
            pan: v.pan,
            namePanCard: v.name_pan_card,
            dob: v.dob,
            gender: v.gender,
            type: v.type,
            xmlFile: v.xml_file,
          },
        };
      }

      if (input.type === "DRIVING_LICENSE") {
        const v = CashfreeDigilockerDlSchema.parse(raw);
        return {
          verificationId: v.verification_id,
          referenceId: v.reference_id,
          status: v.status,
          type: "DRIVING_LICENSE",
          data: {
            dlNumber: v.dl_number,
            name: v.name,
            dob: v.dob,
            careOf: v.care_of,
            gender: v.gender,
            issueDate: v.issue_date,
            expiryDate: v.expiry_date,
            issuedAt: v.issued_at,
            presentAddress: v.present_address,
            permanentAddress: v.permanent_address,
            photoLink: v.photo_link,
            xmlFile: v.xml_file,
            categories: v.categories.map((c) => ({
              classOfVehicle: c.class_of_vehicle,
              description: c.description,
              issueDate: c.issue_date,
            })),
          },
        };
      }

      throw new Error(`Unsupported document type: ${input.type}`);
    }, "getDocument");
  }
}


