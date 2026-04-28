/**
 * profile.schema.ts
 *
 * ⚠️  SINGLE SOURCE OF TRUTH for the Profile module.
 *
 * All TypeBox route schemas, TS types, Zod cross-field schemas, and response-shaping
 * mappers live here.
 *
 * Import rules:
 *  - profile.routes.ts     → imports TypeBox schemas (XxxBody / XxxQuery)
 *  - profile.controller.ts → imports TS types + Zod schemas
 *  - profile.service.ts    → imports TS types + Zod schemas
 *
 * When to use Zod vs TypeBox:
 *  TypeBox → HTTP boundary validation (route body/query/params)
 *  Zod     → Cross-field .refine() checks, internal validation, response shaping
 */

import { t, type Static } from "elysia";
import { uppercase, z } from "zod";
import type {
  Address,
  BankAccount,
  CustomerProfile,
  DeliveryPartnerProfile,
  KycDocument,
  KycDocumentInsert,
  ShopOwnerProfile,
  User,
} from "../../db/schema";
import {
  ADDRESS_LABEL,
  BANK_ACCOUNT_TYPE,
  BUSINESS_TYPE,
  KYC_DOCUMENT_TYPE,
  DOC_VERIFICATION_STATUS,
  PROFILE_KYC_STATUS,
  VEHICLE_TYPE,
  USER_ROLES,
} from "../../db/shared/enums";
import { encrypt } from "../../utils/crypto";
import {
  DigilockerDocumentResult,
  DigilockerPanData,
  DigilockerDlData,
} from "../../providers/verification/identity/digilocker-verifier.interface";

// ─────────────────────────────────────────────────────────────────────────────
// 0. Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts an `as const` string array into a TypeBox t.Union of t.Literal.
 */
function toUnion<T extends readonly string[]>(arr: T) {
  return t.Union(arr.map((v) => t.Literal(v)));
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Shared TypeBox primitives
// ─────────────────────────────────────────────────────────────────────────────

export const UUIDParam = t.Object({
  id: t.String({ format: "uuid" }),
});

export const UserIdParam = t.Object({
  userId: t.String({ format: "uuid" }),
});

export const PaginationQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TypeBox enum schemas — derived from DB enum arrays
// ─────────────────────────────────────────────────────────────────────────────

export const KycStatusSchema = toUnion(PROFILE_KYC_STATUS);
export const KycDocumentTypeSchema = toUnion(KYC_DOCUMENT_TYPE);
export const VehicleTypeSchema = toUnion(VEHICLE_TYPE);
export const AddressLabelSchema = toUnion(ADDRESS_LABEL);
export const BankAccountTypeSchema = toUnion(BANK_ACCOUNT_TYPE);
export const BusinessTypeSchema = toUnion(BUSINESS_TYPE);
export const KycDocumentStatusSchema = toUnion(DOC_VERIFICATION_STATUS);
export const RoleSchema = toUnion(USER_ROLES);

export type AddressLabelType = (typeof ADDRESS_LABEL)[number];
export type RoleType = (typeof USER_ROLES)[number];
export type VehicleType = (typeof VEHICLE_TYPE)[number];

// ─────────────────────────────────────────────────────────────────────────────
// 3. Route body / param schemas (TypeBox)
// ─────────────────────────────────────────────────────────────────────────────

// ── Bank Account ─────────────────────────────────────────────────────────────────

export const AddBankAccountBody = t.Object({
  accountHolderName: t.String({ minLength: 1, maxLength: 255 }),
  accountNumber: t.String({ minLength: 1, maxLength: 50 }),
  ifscCode: t.String({
    minLength: 11,
    maxLength: 11,
    pattern: "^[A-Z]{4}0[A-Z0-9]{6}$",
  }),
  setAsPrimary: t.Optional(t.Boolean()),
});

export const CreateAddressBody = t.Object({
  label: AddressLabelSchema,
  formatedAddress: t.String({ minLength: 1, maxLength: 255 }),
  line1: t.String({ minLength: 1, maxLength: 255 }),
  cityId: t.String({ format: "uuid" }),
  state: t.String({ minLength: 1, maxLength: 100 }),
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
  pincode: t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
  country: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  customLabel: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  line2: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  landmark: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
  receiverName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  receiverPhone: t.Optional(t.String({ minLength: 1, maxLength: 15 })),
});

export const UpdateAddressBody = t.Object({
  label: t.Optional(AddressLabelSchema),
  customLabel: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  line1: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  line2: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  landmark: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
  receiverName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  receiverPhone: t.Optional(t.String({ minLength: 1, maxLength: 15 })),
});

export const reverseGeocodeBody = t.Object({
  latitude: t.Numeric({ minimum: -90, maximum: 90 }),
  longitude: t.Numeric({ minimum: -180, maximum: 180 }),
});

// ── Bank Accounts ─────────────────────────────────────────────────────────────

/**
 * Submitted after the user sends ₹1 via UPI.
 * The backend fetches the penny-drop status from the provider and matches
 * the result against the stored bank account before marking it verified.
 */
export const ConfirmPennyDropBody = t.Object({
  /** The verification/order ID returned when the penny drop was initiated. */
  verificationId: t.String({ minLength: 1, maxLength: 255 }),
});

export const VerifyPanBody = t.Object({
  pan: t.String({
    minLength: 10,
    maxLength: 10,
    pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
  }),
  name: t.String({ minLength: 1, maxLength: 255 }),
  dob: t.String({ format: "date" }),
  frontImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  backImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  selfieImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
});

export const VerifyGstinBody = t.Object({
  gstin: t.String({
    minLength: 15,
    maxLength: 15,
    pattern: "^\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}[A-Z\\d]{1}[Z]{1}[A-Z\\d]{1}$",
  }),
  businessName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  frontImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  backImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  selfieImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
});

export const verifyPanBody = t.Object({
  verificationId: t.String(),
  pan: t.String({ pattern: "^[A-Z ]+$" }),
  name: t.String(),
  dob: t.String({ format: "date" }),
});

export const VerifyPanGstinBody = t.Object({
  pan: t.String({
    minLength: 10,
    maxLength: 10,
    pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
  }),
});

export const VerifyDrivingLicenseBody = t.Object({
  dlNumber: t.String({ minLength: 5, maxLength: 25 }),
  dob: t.String({ format: "date" }),
  frontImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  backImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  selfieImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
});

// ── Digilocker ─────────────────────────────────────────────────────────────────

/**
 * Check whether the user has a registered Digilocker account.
 * Enrollment is confirmed if mobileNumber is provided (enforced at service layer).
 */
export const VerifyDigilockerAccountBody = t.Object({
  /** Unique ID for this verification request (alphanumeric, ., -, _; max 50 chars). */
  verificationId: t.String({
    minLength: 1,
    maxLength: 50,
    pattern: "^[a-zA-Z0-9._\\-]+$",
  }),
  /** Mobile number in E.164 format, e.g. "9988777666". Conditionally required. */
  mobileNumber: t.Optional(t.String({ minLength: 5, maxLength: 15 })),
});

/** Digilocker document types accepted by Cashfree. */
const DigilockerDocumentTypeSchema = t.Union([
  t.Literal("PAN"),
  t.Literal("DRIVING_LICENSE"),
]);

export type DigilockerDocumentType = Static<
  typeof DigilockerDocumentTypeSchema
>;

/**
 * Create a Digilocker consent URL for document sharing.
 */
export const CreateDigilockerUrlBody = t.Object({
  /** Unique ID for this verification request (alphanumeric, ., -, _; max 50 chars). */
  verificationId: t.String({
    minLength: 1,
    maxLength: 50,
    pattern: "^[a-zA-Z0-9._\\-]+$",
  }),
  /** List of document types to request from Digilocker. */
  documentRequested: t.Array(DigilockerDocumentTypeSchema, { minItems: 1 }),
  /** URL the user is redirected to after Digilocker consent. */
  redirectUrl: t.String({ minLength: 1, maxLength: 2048 }),
  /** Whether this is a new user signup or an existing user login flow. */
  userFlow: t.Optional(t.Union([t.Literal("signup"), t.Literal("login")])),
});

export const GetDigilockerDetailsQuery = t.Object({
  verificationId: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  referenceId: t.Optional(t.Numeric()),
});

// ── KYC Documents ─────────────────────────────────────────────────────────────

export const SubmitKycBody = t.Object({
  documentType: KycDocumentTypeSchema,
  documentNumberEncrypted: t.Optional(
    t.String({ minLength: 1, maxLength: 512 }),
  ),
  documentNumberLast4: t.Optional(
    t.String({ minLength: 4, maxLength: 4, pattern: "^\\d{4}$" }),
  ),
  frontImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  backImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  selfieImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  expiresAt: t.Optional(t.String({ format: "date-time" })),
});

export const ReviewKycBody = t.Object({
  status: t.Union([
    t.Literal("verified"),
    t.Literal("rejected"),
    t.Literal("under_review"),
  ]),
  rejectionReason: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
});

// ── Shop Owner ────────────────────────────────────────────────────────────────

export const UpdateShopOwnerBody = t.Object({
  primaryBankAccountId: t.Optional(t.String({ format: "uuid" })),
  metadata: t.Optional(t.Record(t.String(), t.Unknown())),
});

// ── Delivery Partner ──────────────────────────────────────────────────────────

export const DeliveryPartnerOnboardBody = t.Object({
  vehicleType: t.Optional(VehicleTypeSchema),
  cityId: t.String({ format: "uuid" }),
});

export const UpdateDeliveryPartnerBody = t.Object({
  vehicleType: t.Optional(VehicleTypeSchema),
  cityId: t.Optional(t.String({ format: "uuid" })),
  primaryBankAccountId: t.Optional(t.String({ format: "uuid" })),
  metadata: t.Optional(t.Record(t.String(), t.Unknown())),
});

export const LocationUpdateBody = t.Object({
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
});

export const PartnerStatusUpdateBody = t.Object({
  status: t.Union([
    t.Literal("offline"),
    t.Literal("available"),
    t.Literal("break"),
  ]),
});

// ── Customer ──────────────────────────────────────────────────────────────────

export const UpdateCustomerPreferencesBody = t.Object({
  preferences: t.Record(t.String(), t.Unknown()),
});

// ── Admin ─────────────────────────────────────────────────────────────────────

export const SuspendBody = t.Object({
  isSuspended: t.Boolean(),
  suspensionReason: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TypeScript types — derived from TypeBox via Static<>
// ─────────────────────────────────────────────────────────────────────────────

export type CreateAddressRequest = Static<typeof CreateAddressBody>;
export type UpdateAddressRequest = Static<typeof UpdateAddressBody>;
export type AddBankAccountRequest = Static<typeof AddBankAccountBody>;
export type ConfirmPennyDropRequest = Static<typeof ConfirmPennyDropBody>;
export type VerifyPanRequest = Static<typeof VerifyPanBody>;
export type VerifyGstinRequest = Static<typeof VerifyGstinBody>;
export type VerifyDrivingLicenseRequest = Static<
  typeof VerifyDrivingLicenseBody
>;
export type VerifyDigilockerAccountRequest = Static<
  typeof VerifyDigilockerAccountBody
>;
export type CreateDigilockerUrlRequest = Static<typeof CreateDigilockerUrlBody>;
export type GetDigilockerDetailsRequest = Static<
  typeof GetDigilockerDetailsQuery
>;
export type GetDigilockerDocumentRequest = Static<
  typeof GetDigilockerDetailsQuery
>;
export type SubmitKycRequest = Static<typeof SubmitKycBody>;
export type ReviewKycRequest = Static<typeof ReviewKycBody>;
export type UpdateShopOwnerRequest = Static<typeof UpdateShopOwnerBody>;
export type DeliveryPartnerOnboardRequest = Static<
  typeof DeliveryPartnerOnboardBody
>;
export type UpdateDeliveryPartnerRequest = Static<
  typeof UpdateDeliveryPartnerBody
>;
export type LocationUpdateRequest = Static<typeof LocationUpdateBody>;
export type PartnerStatusUpdateRequest = Static<typeof PartnerStatusUpdateBody>;
export type UpdateCustomerPreferencesRequest = Static<
  typeof UpdateCustomerPreferencesBody
>;
export type SuspendRequest = Static<typeof SuspendBody>;

// ─────────────────────────────────────────────────────────────────────────────
// 5. Internal DB enum types (Zod)
// ─────────────────────────────────────────────────────────────────────────────

export const kycStatusSchema = z.enum(PROFILE_KYC_STATUS);
export const kycDocumentTypeSchema = z.enum(KYC_DOCUMENT_TYPE);
export const vehicleTypeSchema = z.enum(VEHICLE_TYPE);
export const addressLabelSchema = z.enum(ADDRESS_LABEL);
export const bankAccountTypeSchema = z.enum(BANK_ACCOUNT_TYPE);
export const businessTypeSchema = z.enum(BUSINESS_TYPE);
export const kycDocumentStatusSchema = z.enum(DOC_VERIFICATION_STATUS);

export type KycStatus = z.infer<typeof kycStatusSchema>;
export type KycDocumentType = z.infer<typeof kycDocumentTypeSchema>;
export type AddressLabel = z.infer<typeof addressLabelSchema>;
export type BankAccountType = z.infer<typeof bankAccountTypeSchema>;
export type BusinessType = z.infer<typeof businessTypeSchema>;
export type KycDocumentStatus = z.infer<typeof kycDocumentStatusSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// 6. Cross-field Zod schemas
// ─────────────────────────────────────────────────────────────────────────────

export const addBankAccountSchema = z.object({
  accountHolderName: z.string().min(1).max(255),
  accountNumber: z.string().min(1).max(50),
  ifscCode: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  setAsPrimary: z.boolean().optional(),
});

export type AddBankAccount = z.infer<typeof addBankAccountSchema>;

export const confirmPennyDropSchema = z.object({
  verificationId: z.string().min(1).max(255),
});

export type ConfirmPennyDrop = z.infer<typeof confirmPennyDropSchema>;

export const verifyPanSchema = z.object({
  pan: z
    .string()
    .length(10)
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  name: z.string().min(1).max(255),
  dob: z.coerce.date(),
  frontImageKey: z.string().min(1).max(500).optional(),
  backImageKey: z.string().min(1).max(500).optional(),
  selfieImageKey: z.string().min(1).max(500).optional(),
});

export type VerifyPan = z.infer<typeof verifyPanSchema>;

export const verifyGstinSchema = z.object({
  gstin: z.string().length(15),
  businessName: z.string().min(1).max(255).optional(),
  frontImageKey: z.string().min(1).max(500).optional(),
  backImageKey: z.string().min(1).max(500).optional(),
  selfieImageKey: z.string().min(1).max(500).optional(),
});

export type VerifyGstin = z.infer<typeof verifyGstinSchema>;

export const verifyPanGstinSchema = z.object({
  pan: z
    .string()
    .length(10)
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
});

export type VerifyPanGstin = z.infer<typeof verifyPanGstinSchema>;

export const verifyDrivingLicenseSchema = z.object({
  dlNumber: z.string().min(5).max(25),
  dob: z.coerce.date(),
  frontImageKey: z.string().min(1).max(500).optional(),
  backImageKey: z.string().min(1).max(500).optional(),
  selfieImageKey: z.string().min(1).max(500).optional(),
});

export type VerifyDrivingLicense = z.infer<typeof verifyDrivingLicenseSchema>;

export const reviewApplicationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().max(500).optional(),
  notes: z.string().optional(),
});

export type ReviewApplication = z.infer<typeof reviewApplicationSchema>;

export const verifyDigilockerAccountSchema = z.object({
  verificationId: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9._\-]+$/, "Invalid verification ID"),
  mobileNumber: z.string().min(5).max(15).optional(),
});

export type VerifyDigilockerAccount = z.infer<
  typeof verifyDigilockerAccountSchema
>;

const digilockerDocumentTypeSchema = z.enum(["PAN", "DRIVING_LICENSE"]);

export const createDigilockerUrlSchema = z.object({
  verificationId: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9._\-]+$/, "Invalid verification ID"),
  documentRequested: z
    .array(digilockerDocumentTypeSchema)
    .min(1, "At least one document type required"),
  redirectUrl: z.string().url("Must be a valid URL").max(2048),
  userFlow: z.enum(["signup", "login"]).optional(),
});

export type CreateDigilockerUrl = z.infer<typeof createDigilockerUrlSchema>;

export const getDigilockerDetailsSchema = z
  .object({
    verificationId: z.string().min(1).max(50).optional(),
    referenceId: z.coerce.number().optional(),
  })
  .refine(
    (d) => d.verificationId !== undefined || d.referenceId !== undefined,
    {
      message: "Either verificationId or referenceId is required",
      path: ["verificationId"],
    },
  );

export type GetDigilockerDetails = z.infer<typeof getDigilockerDetailsSchema>;

export const getDigilockerDocumentSchema = z.object({
  type: digilockerDocumentTypeSchema,
  query: getDigilockerDetailsSchema,
});

export type GetDigilockerDocument = z.infer<typeof getDigilockerDocumentSchema>;

export const submitKycSchema = z
  .object({
    documentType: kycDocumentTypeSchema,
    documentNumberEncrypted: z.string().min(1).max(512).optional(),
    documentNumberLast4: z
      .string()
      .length(4)
      .regex(/^\d{4}$/)
      .optional(),
    frontImageKey: z.string().min(1).max(500).optional(),
    backImageKey: z.string().min(1).max(500).optional(),
    selfieImageKey: z.string().min(1).max(500).optional(),
    expiresAt: z.coerce.date().optional(),
  })
  .refine(
    (d) =>
      d.frontImageKey !== undefined || d.documentNumberEncrypted !== undefined,
    {
      message: "At least a front image or document number must be provided",
      path: ["frontImageKey"],
    },
  );

export type SubmitKyc = z.infer<typeof submitKycSchema>;

export const reviewKycSchema = z
  .object({
    status: z.enum(["verified", "rejected", "under_review"]),
    rejectionReason: z.string().min(1).max(500).optional(),
  })
  .refine(
    (d) =>
      d.status !== "rejected" ||
      (d.rejectionReason !== undefined && d.rejectionReason.length > 0),
    {
      message: "rejectionReason is required when status is 'rejected'",
      path: ["rejectionReason"],
    },
  );

export type ReviewKyc = z.infer<typeof reviewKycSchema>;

const addressBaseSchema = z.object({
  label: addressLabelSchema.optional(),
  customLabel: z.string().min(1).max(50).optional(),
  line1: z.string().min(1, "Address line 1 is required").max(255),
  line2: z.string().min(1).max(255).optional(),
  landmark: z.string().min(1).max(150).optional(),
  cityId: z.string().uuid(),
  pincode: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
  state: z.string().min(1).max(100),
  country: z.string().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const addressInsertSchema = addressBaseSchema.refine(
  (d) =>
    d.label !== "other" || (d.customLabel != null && d.customLabel.length > 0),
  {
    message: "customLabel is required when label is 'other'",
    path: ["customLabel"],
  },
);

export type AddressInsert = z.infer<typeof addressInsertSchema>;

export const addressUpdateSchema = addressBaseSchema
  .partial()
  .refine(
    (d) =>
      d.label !== "other" ||
      (d.customLabel != null && d.customLabel.length > 0),
    {
      message: "customLabel is required when label is 'other'",
      path: ["customLabel"],
    },
  );

export type AddressUpdate = z.infer<typeof addressUpdateSchema>;

/**
 * Serviceability check request — used to test if a given coordinate or
 * pincode is within a serviceable zone.
 */
export const serviceabilityCheckSchema = z.union([
  z.object({
    type: z.literal("coordinates"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  z.object({
    type: z.literal("pincode"),
    pincode: z
      .string()
      .length(6)
      .regex(/^\d{6}$/),
  }),
]);
export type ServiceabilityCheck = z.infer<typeof serviceabilityCheckSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// 7. Response shaping (Zod)
// ─────────────────────────────────────────────────────────────────────────────

export const bankAccountPublicSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accountHolderName: z.string(),
  accountNumberLast4: z.string(),
  ifscCode: z.string(),
  bankName: z.string(),
  branchName: z.string().nullable(),
  accountType: bankAccountTypeSchema,
  upiId: z.string().nullable(),
  isPrimary: z.boolean(),
  isVerified: z.boolean(),
  verifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BankAccountPublic = z.infer<typeof bankAccountPublicSchema>;

export function mapToBankAccountPublic(
  account: BankAccount,
): BankAccountPublic {
  return {
    id: account.id,
    userId: account.userId,
    accountHolderName: account.accountHolderName,
    accountNumberLast4: account.accountNumberLast4,
    ifscCode: account.ifscCode,
    bankName: account.bankName,
    branchName: account.branchName,
    accountType: account.accountType as BankAccountType,
    upiId: account.upiId,
    isPrimary: account.isPrimary,
    isVerified: account.isVerified,
    verifiedAt: account.verifiedAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export const kycDocumentPublicSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  documentType: kycDocumentTypeSchema,
  documentNumberLast4: z.string().nullable(),
  frontImageKey: z.string().nullable(),
  backImageKey: z.string().nullable(),
  selfieImageKey: z.string().nullable(),
  status: kycDocumentStatusSchema,
  rejectionReason: z.string().nullable(),
  expiresAt: z.date().nullable(),
  verifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type KycDocumentPublic = z.infer<typeof kycDocumentPublicSchema>;

export function mapToKycDocumentPublic(doc: KycDocument): KycDocumentPublic {
  return {
    id: doc.id,
    userId: doc.userId,
    documentType: doc.documentType as KycDocumentType,
    documentNumberLast4: doc.documentNumberLast4,
    frontImageKey: doc.frontImageKey,
    backImageKey: doc.backImageKey,
    selfieImageKey: doc.selfieImageKey,
    status: doc.status as KycDocumentStatus,
    rejectionReason: doc.rejectionReason,
    expiresAt: doc.expiresAt,
    verifiedAt: doc.verifiedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const addressPublicSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  label: addressLabelSchema,
  customLabel: z.string().nullable(),
  line1: z.string(),
  line2: z.string().nullable(),
  landmark: z.string().nullable(),
  cityId: z.string().uuid(),
  pincode: z.string(),
  state: z.string(),
  country: z.string(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AddressPublic = z.infer<typeof addressPublicSchema>;

export function mapToAddressPublic(address: Address): AddressPublic {
  return {
    id: address.id,
    userId: address.userId,
    label: address.label as AddressLabel,
    customLabel: address.customLabel,
    line1: address.line1,
    line2: address.line1,
    landmark: address.landmark,
    cityId: address.cityId,
    pincode: address.pincode,
    state: address.state,
    country: address.country,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

export const shopOwnerProfilePublicSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  businessName: z.string().nullable(),
  businessType: businessTypeSchema,
  tradeName: z.string().nullable(),
  kycStatus: kycStatusSchema,
  kycVerifiedAt: z.date().nullable(),
  isVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ShopOwnerProfilePublic = z.infer<
  typeof shopOwnerProfilePublicSchema
>;

export function mapToShopOwnerProfilePublic(
  profile: ShopOwnerProfile,
): ShopOwnerProfilePublic {
  return {
    id: profile.id,
    userId: profile.userId,
    businessName: profile.businessName,
    businessType: profile.businessType as BusinessType,
    tradeName: profile.tradeName,
    kycStatus: profile.kycStatus as KycStatus,
    kycVerifiedAt: profile.kycVerifiedAt,
    isVerified: profile.isVerified,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export const deliveryPartnerProfilePublicSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kycStatus: kycStatusSchema,
  kycVerifiedAt: z.date().nullable(),
  vehicleType: vehicleTypeSchema,
  vehicleNumber: z.string().nullable(),
  vehicleNumberVerified: z.boolean(),
  licenseNumber: z.string(),
  licenseExpiresAt: z.date().nullable(),
  licenseVerified: z.boolean(),
  profilePhotoKey: z.string().nullable(),
  cityId: z.string().uuid().nullable(),
  ratingAverage: z.number().nullable(),
  totalDeliveries: z.number(),
  lastActiveAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DeliveryPartnerProfilePublic = z.infer<
  typeof deliveryPartnerProfilePublicSchema
>;

export function mapToDeliveryPartnerProfilePublic(
  profile: DeliveryPartnerProfile,
): DeliveryPartnerProfilePublic {
  return {
    id: profile.id,
    userId: profile.userId,
    kycStatus: profile.kycStatus as KycStatus,
    kycVerifiedAt: profile.kycVerifiedAt,
    vehicleType: profile.vehicleType as VehicleType,
    vehicleNumber: profile.vehicleNumber,
    vehicleNumberVerified: profile.vehicleNumberVerified,
    licenseNumber: profile.licenseNumber,
    licenseExpiresAt: profile.licenseExpiresAt,
    licenseVerified: profile.licenseVerified,
    profilePhotoKey: profile.profilePhotoKey,
    cityId: profile.cityId,
    ratingAverage:
      profile.ratingCount > 0 ? profile.ratingSum / profile.ratingCount : null,
    totalDeliveries: profile.totalDeliveries,
    lastActiveAt: profile.lastActiveAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export const customerProfilePublicSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  loyaltyPoints: z.number(),
  preferences: z.record(z.string(), z.unknown()),
  totalOrders: z.number(),
  lastOrderAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CustomerProfilePublic = z.infer<typeof customerProfilePublicSchema>;

export function mapToCustomerProfilePublic(
  profile: CustomerProfile,
): CustomerProfilePublic {
  return {
    id: profile.id,
    userId: profile.userId,
    loyaltyPoints: profile.loyaltyPoints,
    preferences: profile.preferences as Record<string, unknown>,
    totalOrders: profile.totalOrders,
    lastOrderAt: profile.lastOrderAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export const profileResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    phone: z.string(),
    email: z.string().email().nullable(),
  }),
  shopOwner: shopOwnerProfilePublicSchema.nullable(),
  deliveryPartner: deliveryPartnerProfilePublicSchema.nullable(),
  customer: customerProfilePublicSchema.nullable(),
  addresses: z.array(addressPublicSchema),
  bankAccounts: z.array(bankAccountPublicSchema),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;

export function mapToProfileResponse(data: {
  user: User;
  shopOwner: ShopOwnerProfile | null;
  deliveryPartner: DeliveryPartnerProfile | null;
  customer: CustomerProfile | null;
  addresses: Address[];
  bankAccounts: BankAccount[];
}): ProfileResponse {
  return {
    user: {
      id: data.user.id,
      name: data.user.name,
      phone: data.user.phone,
      email: data.user.email,
    },
    shopOwner: data.shopOwner
      ? mapToShopOwnerProfilePublic(data.shopOwner)
      : null,
    deliveryPartner: data.deliveryPartner
      ? mapToDeliveryPartnerProfilePublic(data.deliveryPartner)
      : null,
    customer: data.customer ? mapToCustomerProfilePublic(data.customer) : null,
    addresses: data.addresses.map(mapToAddressPublic),
    bankAccounts: data.bankAccounts.map(mapToBankAccountPublic),
  };
}

// "02-02-1995" or "02/02/1995" → "1995-02-02"
export function normalizeDob(dob: string | null | undefined): string | null {
  if (!dob) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) return dob;

  const parts = dob.includes("-") ? dob.split("-") : dob.split("/");
  if (parts.length === 3) {
    // DD-MM-YYYY or DD/MM/YYYY
    if (parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // YYYY-MM-DD
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
  }
  return dob;
}

// "Male" | "M" | "MALE" → "M"
export function normalizeGender(
  gender: string | null | undefined,
): string | null {
  if (!gender) return null;
  const g = gender.trim().toUpperCase();
  if (g === "M" || g === "MALE") return "M";
  if (g === "F" || g === "FEMALE") return "F";
  return gender;
}

/**
 * Maps a DigilockerDocumentResult into a KycDocumentInsert object.
 * This can be used to directly insert the verified document into the DB.
 */
export async function mapDigilockerResultToKycInsert(
  userId: string,
  result: DigilockerDocumentResult,
): Promise<KycDocumentInsert> {
  if (result.status !== "SUCCESS") {
    throw new Error(`Cannot map non-success result: ${result.status}`);
  }

  const { type, data, verificationId } = result;
  if (!data) throw new Error(`No data found for document type: ${type}`);

  const base = {
    userId,
    status: "verified" as const,
    kycMethod: "digilocker" as const,
    verificationProvider: "cashfree_digilocker",
    verificationRef: verificationId,
    verifiedAt: new Date(),
  };

  switch (type) {
    case "PAN": {
      const d = data as DigilockerPanData;
      return {
        ...base,
        documentType: "pan",
        documentNumberEncrypted: await encrypt(d.pan),
        documentNumberLast4: d.pan.slice(-4),
        name: d.namePanCard,
        dob: normalizeDob(d.dob),
        gender: normalizeGender(d.gender),
      };
    }
    case "DRIVING_LICENSE": {
      const d = data as DigilockerDlData;
      return {
        ...base,
        documentType: "driving_license",
        documentNumberEncrypted: await encrypt(d.dlNumber),
        documentNumberLast4: d.dlNumber.slice(-4),
        name: d.name,
        dob: normalizeDob(d.dob),
        gender: normalizeGender(d.gender),
        expiresAt: d.expiryDate ? new Date(normalizeDob(d.expiryDate)!) : null,
      };
    }
    default:
      throw new Error(`Unsupported document type: ${type}`);
  }
}

import type { PanVerificationResult } from "../../providers/verification/identity/pan-verifier.interface";
import type { DrivingLicenseVerificationResult } from "../../providers/verification/identity/dl-verifier.interface";

export async function mapManualPanResult(
  userId: string,
  documentTypeId: string,
  data: VerifyPanRequest,
  verifyData?: PanVerificationResult,
) {
  const pan = verifyData?.pan ?? data.pan;

  return {
    userId,
    documentTypeId: documentTypeId,

    documentNumberEncrypted: await encrypt(pan),
    documentNumberLast4: pan.slice(-4),

    frontImageKey: data.frontImageKey,
    backImageKey: data.backImageKey,
    selfieImageKey: data.selfieImageKey,

    name: verifyData?.name ?? data.name,
    dob: normalizeDob(verifyData?.dob ?? data.dob),

    status: ((): KycDocumentStatus => {
      if (!verifyData) return "under_review";
      if (verifyData.status === "VALID") return "verified";
      if (verifyData.status === "INVALID") return "rejected";
      return "under_review";
    })(),

    verificationProvider: verifyData ? "cashfree_pan" : "manual",
    verificationId: verifyData?.verificationId ?? null,
    kycMethod: verifyData ? ("apiProvider" as const) : ("manual" as const),
  };
}

export async function mapManualDrivingLicenseResult(
  userId: string,
  documentTypeId: string,
  data: VerifyDrivingLicenseRequest,
  verifyData?: DrivingLicenseVerificationResult,
) {
  const dlNumber = verifyData?.dlNumber ?? data.dlNumber;

  return {
    userId,
    documentTypeId,

    documentNumberEncrypted: await encrypt(dlNumber),
    documentNumberLast4: dlNumber.slice(-4),

    frontImageKey: data.frontImageKey,
    backImageKey: data.backImageKey,
    selfieImageKey: data.selfieImageKey,

    name: verifyData?.detailsOfDrivingLicence?.name ?? null,
    dob: normalizeDob(verifyData?.dob ?? data.dob),

    status: ((): KycDocumentStatus => {
      if (!verifyData) return "under_review";
      if (verifyData.status === "VALID") return "verified";
      if (verifyData.status === "INVALID") return "rejected";
      return "under_review";
    })(),

    verificationProvider: verifyData ? "cashfree_dl" : "manual",
    verificationId: verifyData?.verificationId ?? null,
    kycMethod: verifyData ? ("apiProvider" as const) : ("manual" as const),
  };
}

export const kycRequirements: Record<string, KycDocumentType[]> = {
  shop_owner: ["pan"],
  delivery_partner: ["pan", "driving_license"],
  admin: ["pan"],
  customer: [],
};

export interface KycDocumentFilter {
  status?: KycDocument["status"][];
  documentTypeId?: string;
}

export const ROLE_REQUIRED_DOCS = {
  delivery_partner: ["pan", "driving_license"],
  shop_owner: ["pan", "gstin"],
};
