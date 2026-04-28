/**
 * identity/adapters/mock/mock-dl.adapter.ts
 */

import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import {
  IDrivingLicenseVerifier,
  DrivingLicenseVerificationResult,
} from "../../dl-verifier.interface";

export class MockDrivingLicenseAdapter
  extends BaseVerificationAdapter
  implements IDrivingLicenseVerifier
{
  protected readonly providerName = "mock_dl";

  async verify(
    dlNumber: string,
    dob: string,
    verificationId: string,
  ): Promise<DrivingLicenseVerificationResult> {
    return this.orchestrate(async () => {
      return {
        verificationId,
        referenceId: 76,
        dlNumber,
        dob,
        status: "VALID",
        badgeDetails: [
          {
            badgeIssueDate: null,
            badgeNo: null,
            classOfVehicle: ["LMV"],
          },
        ],
        dlValidity: {
          nonTransport: {
            to: "09/05/2039",
            from: "10/05/2019",
          },
          hazardousValidTill: null,
          transport: {
            to: null,
            from: null,
          },
          hillValidTill: null,
        },
        detailsOfDrivingLicence: {
          dateOfIssue: "10/05/2019",
          dateOfLastTransaction: null,
          status: null,
          lastTransactedAt: null,
          name: "JOHN DOE",
          fatherOrHusbandName: "JOHN DOE",
          addressList: [
            {
              completeAddress: "FLAT NO D-901 SUN,BELLANDUR, BANGALORE SOUTH,BANGALORE,KA 560103",
              type: "permanent",
            },
          ],
          address: "FLAT NO D-901 SUN,BELLANDUR, BANGALORE SOUTH,BANGALORE,KA 560103",
          photo: "PHOTO_LINK.jpeg",
          splitAddress: null,
          covDetails: [],
        },
      };
    }, "verify");
  }
}
