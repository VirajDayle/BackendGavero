/**
 * identity/dl-verifier.interface.ts
 */

export interface DrivingLicenseVerificationResult {
  verificationId: string;
  referenceId: number;
  dlNumber: string | null;
  dob: string | null;
  status: "VALID" | "INVALID" | string;
  badgeDetails: any;
  dlValidity: {
    nonTransport: {
      to: string | null;
      from: string | null;
    };
    hazardousValidTill: string | null;
    transport: {
      to: string | null;
      from: string | null;
    };
    hillValidTill: string | null;
  };
  detailsOfDrivingLicence: {
    dateOfIssue: string | null;
    dateOfLastTransaction: string | null;
    status: string | null;
    lastTransactedAt: string | null;
    name: string | null;
    fatherOrHusbandName: string | null;
    addressList: any;
    address: string | null;
    photo: string | null;
    splitAddress: any;
    covDetails: any;
  };
}

export interface IDrivingLicenseVerifier {
  verify(
    dlNumber: string,
    dob: string,
    verificationId: string,
  ): Promise<DrivingLicenseVerificationResult>;
}
