/**
 * identity/adapters/mock/mock-digilocker.adapter.ts
 *
 * Mock Digilocker verifier for development and testing.
 * Returns deterministic successful responses without hitting any external API.
 *
 * Heuristic:
 *   - Everything else → ACCOUNT_EXISTS
 */

import { BaseVerificationAdapter } from "../../../shared/base-adapter";
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
} from "../../digilocker-verifier.interface";

export class MockDigilockerAdapter
  extends BaseVerificationAdapter
  implements IDigilockerVerifier
{
  protected readonly providerName = "mock_digilocker";

  async verifyAccount(
    input: DigilockerVerifyAccountInput,
  ): Promise<DigilockerAccountResult> {
    return this.orchestrate(async () => {
      return {
        verificationId: input.verificationId,
        referenceId: 12345,
        status: "ACCOUNT_EXISTS",
        digilockerId: "mock-8aa626bf-34aa-5ffc-a123-f69207e129a7",
        mobileNumber: input.mobileNumber,
      };
    }, "verifyAccount");
  }

  async createUrl(
    input: DigilockerCreateUrlInput,
  ): Promise<DigilockerUrlResult> {
    return this.orchestrate(async () => {
      return {
        verificationId: input.verificationId,
        referenceId: 12345,
        url: `https://mock.digilocker.example.com/verify/${input.verificationId}`,
        status: "PENDING",
        documentRequested: input.documentRequested,
        redirectUrl: input.redirectUrl,
        userFlow: input.userFlow,
      };
    }, "createUrl");
  }

  async getDetails(
    input: DigilockerGetDetailsInput,
  ): Promise<DigilockerDetailsResult> {
    return this.orchestrate(async () => {
      return {
        verificationId: input.verificationId || "mock-v-id",
        referenceId: input.referenceId || 12345,
        status: "AUTHENTICATED",
        documentRequested: ["PAN"],
        documentConsent: ["PAN"],
        documentConsentValidity: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        userDetails: {
          name: "MOCK USER",
          dob: "01-01-1990",
          gender: "M",
          mobile: "9999999999",
        },
      };
    }, "getDetails");
  }

  async getDocument(
    input: DigilockerGetDocumentInput,
  ): Promise<DigilockerDocumentResult> {
    return this.orchestrate(async () => {

      if (input.type === "PAN") {
        return {
          verificationId: input.verificationId || "mock-v-id",
          referenceId: input.referenceId || 408,
          status: "SUCCESS",
          type: "PAN",
          data: {
            pan: "ABCPV1234D",
            namePanCard: "JOHN SNOW",
            dob: "02-02-1995",
            gender: "Male",
            type: "Individual",
            xmlFile: "https://mock.example.com/pan.xml",
          },
        };
      }

      if (input.type === "DRIVING_LICENSE") {
        return {
          verificationId: input.verificationId || "mock-v-id",
          referenceId: input.referenceId || 408,
          status: "SUCCESS",
          type: "DRIVING_LICENSE",
          data: {
            dlNumber: "KA51201900089895",
            name: "JOHN DOE",
            dob: "02-02-1994",
            careOf: "JOHN SNOW",
            gender: "Male",
            issueDate: "03-11-2022",
            expiryDate: "16-09-2039",
            issuedAt: "RTO,RAIPUR RTO",
            presentAddress: "FLAT NO D-901 SUN,BELLANDUR, BANGALORE SOUTH,BANGALORE,KA 560103",
            permanentAddress: "FLAT NO D-901 SUN,BELLANDUR, BANGALORE SOUTH,BANGALORE,KA 560103",
            photoLink: "https://mock.example.com/dl_photo.jpg",
            xmlFile: "https://mock.example.com/dl.xml",
            categories: [
              {
                classOfVehicle: "MCWG",
                description: "Motor Cycle with Gear(Non Transport).",
                issueDate: "03-11-2022",
              },
            ],
          },
        };
      }

      throw new Error(`Unsupported document type: ${input.type}`);
    }, "getDocument");
  }
}


