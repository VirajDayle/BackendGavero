/**
 * identity/adapters/cashfree/cashfree-dl.adapter.ts
 */

import { z } from "zod";
import { env } from "../../../../../config/env";
import { BaseVerificationAdapter } from "../../../shared/base-adapter";
import { post } from "../../../shared/http-utils";
import {
  IDrivingLicenseVerifier,
  DrivingLicenseVerificationResult,
} from "../../dl-verifier.interface";

const CashfreeDlResponseSchema = z.object({
  verification_id: z.string(),
  reference_id: z.number(),
  dl_number: z.string().nullable(),
  dob: z.string().nullable(),
  status: z.string(),
  badge_details: z.any().nullable(),
  dl_validity: z.object({
    non_transport: z.object({
      to: z.string().nullable(),
      from: z.string().nullable(),
    }),
    hazardous_valid_till: z.string().nullable(),
    transport: z.object({
      to: z.string().nullable(),
      from: z.string().nullable(),
    }),
    hill_valid_till: z.string().nullable(),
  }),
  details_of_driving_licence: z.object({
    date_of_issue: z.string().nullable(),
    date_of_last_transaction: z.string().nullable(),
    status: z.string().nullable(),
    last_transacted_at: z.string().nullable(),
    name: z.string().nullable(),
    father_or_husband_name: z.string().nullable(),
    address_list: z.any().nullable(),
    address: z.string().nullable(),
    photo: z.string().optional().nullable(),
    split_address: z.any().nullable(),
    cov_details: z.any().nullable(),
  }),
});

export class CashfreeDrivingLicenseAdapter
  extends BaseVerificationAdapter
  implements IDrivingLicenseVerifier
{
  protected readonly providerName = "cashfree_dl";

  async verify(
    dlNumber: string,
    dob: string,
    verificationId: string,
  ): Promise<DrivingLicenseVerificationResult> {
    return this.orchestrate(async () => {
      const raw = await post(
        `https://sandbox.cashfree.com/verification/driving-license`,
        {
          "x-client-id": env.CASHFREE_ID,
          "x-client-secret": env.CASHFREE_SECRET_TOKEN,
        },
        {
          verification_id: verificationId,
          dl_number: dlNumber,
          dob,
        },
      );

      const validated = CashfreeDlResponseSchema.parse(raw);

      return {
        verificationId: validated.verification_id,
        referenceId: validated.reference_id,
        dlNumber: validated.dl_number,
        dob: validated.dob,
        status: validated.status,
        badgeDetails: validated.badge_details,
        dlValidity: {
          nonTransport: {
            to: validated.dl_validity.non_transport.to,
            from: validated.dl_validity.non_transport.from,
          },
          hazardousValidTill: validated.dl_validity.hazardous_valid_till,
          transport: {
            to: validated.dl_validity.transport.to,
            from: validated.dl_validity.transport.from,
          },
          hillValidTill: validated.dl_validity.hill_valid_till,
        },
        detailsOfDrivingLicence: {
          dateOfIssue: validated.details_of_driving_licence.date_of_issue,
          dateOfLastTransaction:
            validated.details_of_driving_licence.date_of_last_transaction,
          status: validated.details_of_driving_licence.status,
          lastTransactedAt:
            validated.details_of_driving_licence.last_transacted_at,
          name: validated.details_of_driving_licence.name,
          fatherOrHusbandName:
            validated.details_of_driving_licence.father_or_husband_name,
          addressList: validated.details_of_driving_licence.address_list,
          address: validated.details_of_driving_licence.address,
          photo: validated.details_of_driving_licence.photo || null,
          splitAddress: validated.details_of_driving_licence.split_address,
          covDetails: validated.details_of_driving_licence.cov_details,
        },
      };
    }, "verify");
  }
}
