

import { z } from "zod";

// import {
//   addressesTable,
//   bankAccountsTable,
//   customerProfileTable,
//   deliveryPartnerProfileTable,
//   kycDocumentsTable,
//   shopOwnerProfileTable,
// } from "../../db/schema";

import {
  KYC_DOCUMENT_TYPE,
  KYC_STATUS,
  VEHICLE_TYPE,
  ADDRESS_LABEL,
  BANK_ACCOUNT_TYPE,
} from "../../db/shared/enums";

// ========

const uuidSchema = z.uuid();

const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Pincode must be exactly 6 digits");

const ifscSchema = z
  .string()
  .length(11)
  .regex(
    /^[A-Z]{4}0[A-Z0-9]{6}$/,
    "IFSC must be 4 uppercase letters + '0' + 6 alphanumeric characters",
  );

const upiIdSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(/^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/, "Invalid UPI ID format");

const last4Schema = z
  .string()
  .length(4)
  .regex(/^\d{4}$/, "Must be exactly 4 digits");

/**
 * Object-store key — non-empty, max 500 chars, no raw URLs.
 */
const objectStoreKeySchema = z
  .string()
  .min(1, "Object-store key must not be empty")
  .max(500);


const countryCodeSchema = z
  .string()
  .length(2)
  .transform((v) => v.toUpperCase());


const stateCodeSchema = z.string().min(1).max(3).toUpperCase();

const timezoneSchema = z
  .string()
  .min(1)
  .max(60)
  .refine(
    (tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid IANA timezone" },
  );

const latitudeSchema = z
  .number()
  .min(-90, "Latitude must be ≥ -90")
  .max(90, "Latitude must be ≤ 90");

const longitudeSchema = z
  .number()
  .min(-180, "Longitude must be ≥ -180")
  .max(180, "Longitude must be ≤ 180");

const vehicleNumberSchema = z
  .string()
  .min(4)
  .max(20)
  .regex(
    /^[A-Z0-9 -]+$/i,
    "Vehicle number may only contain letters, digits, spaces, and hyphens",
  )
  .transform((v) => v.toUpperCase());

const licenseNumberSchema = z
  .string()
  .min(6)
  .max(20)
  .regex(/^[A-Z0-9-]+$/i, "Invalid licence number format")
  .transform((v) => v.toUpperCase());

const paisaSchema = z
  .number()
  .int("Amount must be a whole number of paise")
  .min(0, "Amount must be non-negative");

// =============================================================================
// SECTION 1 — ENUMS
// =============================================================================

export const kycStatusSchema = z.enum(KYC_STATUS);
export type KycStatus = z.infer<typeof kycStatusSchema>;

export const kycDocumentTypeSchema = z.enum([
  "aadhaar",
  "pan",
  "passport",
  "driving_license",
  "voter_id",
  "gst_certificate",
  "business_registration",
  "bank_statement",
]);
export type KycDocumentType = z.infer<typeof kycDocumentTypeSchema>;

export const vehicleTypeSchema = z.enum([
  "bicycle",
  "motorcycle",
  "car",
  "auto_rickshaw",
  "van",
  "truck",
  "other",
]);
export type VehicleType = z.infer<typeof vehicleTypeSchema>;

export const addressLabelSchema = z.enum([
  "home",
  "work",
  "office",
  "hotel",
  "other",
]);
export type AddressLabel = z.infer<typeof addressLabelSchema>;

export const bankAccountTypeSchema = z.enum(["savings", "current", "salary"]);
export type BankAccountType = z.infer<typeof bankAccountTypeSchema>;

// =============================================================================
// SECTION 4 — BANK ACCOUNTS
// =============================================================================

export const bankAccountSelectSchema = createSelectSchema(bankAccountsTable, {
  accountHolderName: (s) => s.min(1).max(255),
  accountNumberLast4: () => last4Schema,
  ifscCode: () => ifscSchema,
  bankName: (s) => s.min(1).max(150),
  branchName: (s) => s.min(1).max(150).nullable(),
  accountType: () => bankAccountTypeSchema,
  upiId: () => upiIdSchema.nullable(),
});
export type BankAccount = z.infer<typeof bankAccountSelectSchema>;

/**
 * Strips the encrypted account number from API responses.
 * Expose only last-4 and metadata — never the ciphertext.
 */
export const bankAccountPublicSchema = bankAccountSelectSchema.omit({
  accountNumberEncrypted: true,
  pennyDropRef: true,
});
export type BankAccountPublic = z.infer<typeof bankAccountPublicSchema>;

export const bankAccountInsertSchema = createInsertSchema(bankAccountsTable, {
  userId: () => uuidSchema,
  accountHolderName: (s) => s.min(1).max(255),
  // Accepts raw account number — encryption happens in the service layer
  accountNumberEncrypted: (s) => s.min(1).max(512),
  accountNumberLast4: () => last4Schema,
  ifscCode: () => ifscSchema,
  bankName: (s) => s.min(1).max(150).optional(),
  branchName: (s) => s.min(1).max(150).optional(),
  accountType: () => bankAccountTypeSchema.optional(),
  upiId: () => upiIdSchema.optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type BankAccountInsert = z.infer<typeof bankAccountInsertSchema>;

export const bankAccountUpdateSchema = createUpdateSchema(bankAccountsTable, {
  accountHolderName: (s) => s.min(1).max(255).optional(),
  branchName: (s) => s.min(1).max(150).optional(),
  upiId: () => upiIdSchema.optional(),
  isPrimary: (s) => s.optional(),
}).omit({
  // These fields are immutable or managed by the service layer only
  id: true,
  userId: true,
  accountNumberEncrypted: true,
  accountNumberLast4: true,
  ifscCode: true,
  bankName: true,
  accountType: true,
  isVerified: true,
  verifiedAt: true,
  pennyDropRef: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type BankAccountUpdate = z.infer<typeof bankAccountUpdateSchema>;

// =============================================================================
// SECTION 5 — KYC DOCUMENTS
// =============================================================================

export const kycDocumentSelectSchema = createSelectSchema(kycDocumentsTable, {
  documentType: () => kycDocumentTypeSchema,
  documentNumberLast4: () => last4Schema.nullable(),
  frontImageKey: () => objectStoreKeySchema.nullable(),
  backImageKey: () => objectStoreKeySchema.nullable(),
  selfieImageKey: () => objectStoreKeySchema.nullable(),
  status: () => kycStatusSchema,
  rejectionReason: (s) => s.max(500).nullable(),
  verificationResponse: () => z.record(z.string(), z.unknown()).nullable(),
});
export type KycDocument = z.infer<typeof kycDocumentSelectSchema>;

/**
 * Strips encrypted document number and raw provider payload from API responses.
 */
export const kycDocumentPublicSchema = kycDocumentSelectSchema.omit({
  documentNumberEncrypted: true,
  verificationResponse: true,
  verificationRef: true,
});
export type KycDocumentPublic = z.infer<typeof kycDocumentPublicSchema>;

export const kycDocumentInsertSchema = createInsertSchema(kycDocumentsTable, {
  userId: () => uuidSchema,
  documentType: () => kycDocumentTypeSchema,
  documentNumberEncrypted: (s) => s.min(1).max(512).optional(),
  documentNumberLast4: () => last4Schema.optional(),
  frontImageKey: () => objectStoreKeySchema.optional(),
  backImageKey: () => objectStoreKeySchema.optional(),
  selfieImageKey: () => objectStoreKeySchema.optional(),
}).omit({
  id: true,
  status: true, // Always starts as "pending" — set by the model default
  reviewedBy: true, // Set by admin review flow, never by the submitting user
  reviewedAt: true,
  rejectionReason: true,
  verifiedAt: true,
  verificationProvider: true,
  verificationRef: true,
  verificationResponse: true,
  createdAt: true,
  updatedAt: true,
});
export type KycDocumentInsert = z.infer<typeof kycDocumentInsertSchema>;

/**
 * Admin-only — used when an admin reviews a KYC submission.
 */
export const kycDocumentReviewSchema = z
  .object({
    status: z.enum(["verified", "rejected", "under_review"]),
    reviewedBy: uuidSchema,
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
export type KycDocumentReview = z.infer<typeof kycDocumentReviewSchema>;

// =============================================================================
// SECTION 6 — ADDRESSES
// =============================================================================

export const addressSelectSchema = createSelectSchema(addressesTable, {
  label: () => addressLabelSchema,
  customLabel: (s) => s.min(1).max(50).nullable(),
  line1: (s) => s.min(1).max(255),
  line2: (s) => s.min(1).max(255).nullable(),
  landmark: (s) => s.min(1).max(150).nullable(),
  cityId: () => uuidSchema,
  pincode: () => pincodeSchema,
  state: (s) => s.min(1).max(100),
  country: (s) => s.min(1).max(100),
});
export type Address = z.infer<typeof addressSelectSchema>;

export const addressPublicSchema = addressSelectSchema.omit({
  deletedAt: true,
  isServiceable: true,
});
export type AddressPublic = z.infer<typeof addressPublicSchema>;

export const addressInsertSchema = createInsertSchema(addressesTable, {
  userId: () => uuidSchema,
  label: () => addressLabelSchema.optional(),
  customLabel: (s) => s.min(1).max(50).optional(),
  line1: (s) => s.min(1, "Address line 1 is required").max(255),
  line2: (s) => s.min(1).max(255).optional(),
  landmark: (s) => s.min(1).max(150).optional(),
  cityId: () => uuidSchema,
  pincode: () => pincodeSchema,
  state: (s) => s.min(1).max(100),
  country: (s) => s.min(1).max(100).optional(),
})
  .omit({
    id: true,
    shopId: true, // Server-managed — set when creating shop addresses
    h3IndexRes7: true, // Computed from coordinates
    h3IndexRes9: true, // Computed from coordinates
    isDefault: true, // Managed by service layer to enforce single-default invariant
    isServiceable: true, // Populated async post-geocoding
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(
    (d) =>
      d.label !== "other" ||
      (d.customLabel != null && d.customLabel.length > 0),
    {
      message: "customLabel is required when label is 'other'",
      path: ["customLabel"],
    },
  );
export type AddressInsert = z.infer<typeof addressInsertSchema>;

export const addressUpdateSchema = createUpdateSchema(addressesTable, {
  label: () => addressLabelSchema.optional(),
  customLabel: (s) => s.min(1).max(50).optional(),
  line1: (s) => s.min(1).max(255).optional(),
  line2: (s) => s.min(1).max(255).optional(),
  landmark: (s) => s.min(1).max(150).optional(),
  pincode: () => pincodeSchema.optional(),
  state: (s) => s.min(1).max(100).optional(),
  country: (s) => s.min(1).max(100).optional(),
})
  .omit({
    id: true,
    userId: true,
    cityId: true, // Changing city requires address recreation
    shopId: true, // Server-managed — cannot be changed by user
    h3IndexRes7: true, // Computed from coordinates
    h3IndexRes9: true, // Computed from coordinates
    isDefault: true, // Use setDefaultAddress endpoint instead
    isServiceable: true, // Managed async by geocoding service
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
  })
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

// =============================================================================
// SECTION 7 — SHOP OWNER PROFILES
// =============================================================================

export const shopOwnerProfileSelectSchema = createSelectSchema(
  shopOwnerProfileTable,
  {
    businessName: (s) => s.min(1).max(255).nullable(),
    businessType: (s) => s.min(1).max(100).nullable(),
    tradeName: (s) => s.min(1).max(255).nullable(),
    kycStatus: () => kycStatusSchema,
    primaryBankAccountId: () => uuidSchema.nullable(),
    suspensionReason: (s) => s.max(500).nullable(),
    metadata: () => z.record(z.string(), z.unknown()).nullable(),
  },
);
export type ShopOwnerProfile = z.infer<typeof shopOwnerProfileSelectSchema>;

export const shopOwnerProfilePublicSchema = shopOwnerProfileSelectSchema.omit({
  metadata: true,
  isSuspended: true,
  suspendedAt: true,
  suspensionReason: true,
  primaryBankAccountId: true,
});
export type ShopOwnerProfilePublic = z.infer<
  typeof shopOwnerProfilePublicSchema
>;

/**
 * Called once after a user is granted the shopkeeper role.
 * userId is injected server-side from the authenticated session.
 */
export const shopOwnerProfileInsertSchema = createInsertSchema(
  shopOwnerProfileTable,
  {
    userId: () => uuidSchema,
    businessName: (s) => s.min(1).max(255).optional(),
    businessType: (s) =>
      z.enum(["sole_proprietorship", "llp", "pvt_ltd", "other"]).optional(),
    tradeName: (s) => s.min(1).max(255).optional(),
    metadata: () => z.record(z.string(), z.unknown()).optional(),
  },
).omit({
  id: true,
  kycStatus: true, // Always starts as "not_submitted"
  kycVerifiedAt: true,
  primaryBankAccountId: true,
  isVerified: true,
  isSuspended: true,
  suspendedAt: true,
  suspensionReason: true,
  createdAt: true,
  updatedAt: true,
});
export type ShopOwnerProfileInsert = z.infer<
  typeof shopOwnerProfileInsertSchema
>;

export const shopOwnerProfileUpdateSchema = createUpdateSchema(
  shopOwnerProfileTable,
  {
    businessName: (s) => s.min(1).max(255).optional(),
    businessType: (s) =>
      z.enum(["sole_proprietorship", "llp", "pvt_ltd", "other"]).optional(),
    tradeName: (s) => s.min(1).max(255).optional(),
    primaryBankAccountId: () => uuidSchema.optional(),
    metadata: () => z.record(z.string(), z.unknown()).optional(),
  },
).omit({
  id: true,
  userId: true,
  kycStatus: true, // Managed by background job
  kycVerifiedAt: true,
  isVerified: true, // Managed by admin verification flow
  isSuspended: true, // Use suspend/unsuspend endpoints
  suspendedAt: true,
  suspensionReason: true,
  createdAt: true,
  updatedAt: true,
});
export type ShopOwnerProfileUpdate = z.infer<
  typeof shopOwnerProfileUpdateSchema
>;

/**
 * Admin-only — suspend or unsuspend a shop owner.
 */
export const shopOwnerSuspendSchema = z
  .object({
    isSuspended: z.boolean(),
    suspensionReason: z.string().min(1).max(500).optional(),
  })
  .refine(
    (d) =>
      !d.isSuspended ||
      (d.suspensionReason !== undefined && d.suspensionReason.length > 0),
    {
      message: "suspensionReason is required when suspending",
      path: ["suspensionReason"],
    },
  );
export type ShopOwnerSuspend = z.infer<typeof shopOwnerSuspendSchema>;

// =============================================================================
// SECTION 8 — DELIVERY PARTNER PROFILES
// =============================================================================

export const deliveryPartnerProfileSelectSchema = createSelectSchema(
  deliveryPartnerProfileTable,
  {
    kycStatus: () => kycStatusSchema,
    vehicleType: () => vehicleTypeSchema,
    vehicleNumber: (s) => s.max(20).nullable(),
    licenseNumber: (s) => s.min(6).max(20),
    profilePhotoKey: () => objectStoreKeySchema.nullable(),
    primaryBankAccountId: () => uuidSchema.nullable(),

    cityId: () => uuidSchema.nullable(),
    ratingSum: (s) => s.min(0),
    ratingCount: (s) => s.min(0),
    totalDeliveries: (s) => s.min(0),
    suspensionReason: (s) => s.max(500).nullable(),
    metadata: () => z.record(z.string(), z.unknown()).nullable(),
  },
);
export type DeliveryPartnerProfile = z.infer<
  typeof deliveryPartnerProfileSelectSchema
>;

export const deliveryPartnerProfilePublicSchema =
  deliveryPartnerProfileSelectSchema
    .omit({
      primaryBankAccountId: true,
      metadata: true,
      isSuspended: true,
      suspendedAt: true,
      suspensionReason: true,
      kycVerifiedAt: true,
    })
    .extend({
      // Derived field — computed from ratingSum / ratingCount by the API layer
      ratingAverage: z.number().min(0).max(5).nullable(),
    });
export type DeliveryPartnerProfilePublic = z.infer<
  typeof deliveryPartnerProfilePublicSchema
>;

/**
 * Called after a user is granted the delivery_partner role.
 * licenseNumber is required at registration per RTO mandate.
 */
export const deliveryPartnerProfileInsertSchema = createInsertSchema(
  deliveryPartnerProfileTable,
  {
    userId: () => uuidSchema,
    vehicleType: () => vehicleTypeSchema.optional(),
    vehicleNumber: () => vehicleNumberSchema.optional(),
    licenseNumber: () => licenseNumberSchema,
    cityId: () => uuidSchema.optional(),
    metadata: () => z.record(z.string(), z.unknown()).optional(),
  },
).omit({
  id: true,
  kycStatus: true,
  kycVerifiedAt: true,
  vehicleNumberVerified: true,
  licenseVerified: true,
  profilePhotoKey: true,
  primaryBankAccountId: true,
  ratingSum: true,
  ratingCount: true,
  totalDeliveries: true,
  totalEarnings: true,
  lastActiveAt: true,
  isSuspended: true,
  suspendedAt: true,
  suspensionReason: true,
  createdAt: true,
  updatedAt: true,
});
export type DeliveryPartnerProfileInsert = z.infer<
  typeof deliveryPartnerProfileInsertSchema
>;

export const deliveryPartnerProfileUpdateSchema = createUpdateSchema(
  deliveryPartnerProfileTable,
  {
    vehicleType: () => vehicleTypeSchema.optional(),
    vehicleNumber: () => vehicleNumberSchema.optional(),
    cityId: () => uuidSchema.optional(),
    primaryBankAccountId: () => uuidSchema.optional(),
    metadata: () => z.record(z.string(), z.unknown()).optional(),
  },
).omit({
  id: true,
  userId: true,
  kycStatus: true,
  kycVerifiedAt: true,
  licenseNumber: true, // Immutable — changing requires re-verification
  licenseExpiresAt: true,
  licenseVerified: true,
  vehicleNumberVerified: true,
  profilePhotoKey: true,

  ratingSum: true, // Managed by rating service
  ratingCount: true,
  totalDeliveries: true, // Managed by order event handlers
  totalEarnings: true,
  lastActiveAt: true,
  isSuspended: true, // Use suspend/unsuspend endpoints
  suspendedAt: true,
  suspensionReason: true,
  createdAt: true,
  updatedAt: true,
});
export type DeliveryPartnerProfileUpdate = z.infer<
  typeof deliveryPartnerProfileUpdateSchema
>;

/**
 * Admin-only — suspend or unsuspend a delivery partner.
 */
export const deliveryPartnerSuspendSchema = z
  .object({
    isSuspended: z.boolean(),
    suspensionReason: z.string().min(1).max(500).optional(),
  })
  .refine(
    (d) =>
      !d.isSuspended ||
      (d.suspensionReason !== undefined && d.suspensionReason.length > 0),
    {
      message: "suspensionReason is required when suspending",
      path: ["suspensionReason"],
    },
  );
export type DeliveryPartnerSuspend = z.infer<
  typeof deliveryPartnerSuspendSchema
>;

/**
 * Location update payload — emitted by the mobile app every ~10 s on duty.
 */
export const locationUpdateSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});
export type LocationUpdate = z.infer<typeof locationUpdateSchema>;

/**
 * Status transition — the partner can toggle between offline / available / break.
 * The "on_delivery" and "suspended" values are set only by the platform.
 */
export const partnerStatusUpdateSchema = z.object({
  status: z.enum(["offline", "available", "break"]),
});
export type PartnerStatusUpdate = z.infer<typeof partnerStatusUpdateSchema>;

// =============================================================================
// SECTION 9 — CUSTOMER PROFILES
// =============================================================================

export const customerProfileSelectSchema = createSelectSchema(
  customerProfileTable,
  {
    loyaltyPoints: (s) => s.min(0),
    preferences: () => z.record(z.string(), z.unknown()).nullable(),
    totalOrders: (s) => s.min(0),
    metadata: () => z.record(z.string(), z.unknown()).nullable(),
  },
);
export type CustomerProfile = z.infer<typeof customerProfileSelectSchema>;

export const customerProfilePublicSchema = customerProfileSelectSchema.omit({
  metadata: true,
  referralCodeId: true,
});
export type CustomerProfilePublic = z.infer<typeof customerProfilePublicSchema>;

/**
 * Created automatically when a user registers as a customer.
 * All fields are optional — defaults are set by the model.
 */
export const customerProfileInsertSchema = createInsertSchema(
  customerProfileTable,
  {
    userId: () => uuidSchema,
    preferences: () => z.record(z.string(), z.unknown()).optional(),
    referralCodeId: () => uuidSchema.optional(),
    metadata: () => z.record(z.string(), z.unknown()).optional(),
  },
).omit({
  id: true,
  loyaltyPoints: true, // Managed by loyalty service
  totalOrders: true, // Managed by order event handlers
  totalSpend: true,
  lastOrderAt: true,
  createdAt: true,
  updatedAt: true,
});
export type CustomerProfileInsert = z.infer<typeof customerProfileInsertSchema>;

export const customerProfileUpdateSchema = createUpdateSchema(
  customerProfileTable,
  {
    preferences: () => z.record(z.string(), z.unknown()).optional(),
    metadata: () => z.record(z.string(), z.unknown()).optional(),
  },
).omit({
  id: true,
  userId: true,
  loyaltyPoints: true, // Managed by loyalty service
  referralCodeId: true, // Immutable after sign-up
  totalOrders: true, // Managed by order event handlers
  totalSpend: true,
  lastOrderAt: true,
  createdAt: true,
  updatedAt: true,
});
export type CustomerProfileUpdate = z.infer<typeof customerProfileUpdateSchema>;

// =============================================================================
// SECTION 10 — COMPOSITE / REQUEST SCHEMAS
// =============================================================================

/**
 * Full profile returned to the authenticated user — aggregates across all
 * profile tables. The API layer merges these before sending the response.
 */
export const profileResponseSchema = z.object({
  user: z.object({
    id: uuidSchema,
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

/**
 * Request to onboard a new shop owner.
 * The service layer creates both the role assignment and the profile row.
 */
export const shopOwnerOnboardSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  businessType: z
    .enum(["sole_proprietorship", "llp", "pvt_ltd", "other"])
    .optional(),
  tradeName: z.string().min(1).max(255).optional(),
});
export type ShopOwnerOnboard = z.infer<typeof shopOwnerOnboardSchema>;

/**
 * Request to onboard a new delivery partner.
 */
export const deliveryPartnerOnboardSchema = z.object({
  vehicleType: vehicleTypeSchema,
  vehicleNumber: vehicleNumberSchema.optional(),
  licenseNumber: licenseNumberSchema,
  cityId: uuidSchema,
});
export type DeliveryPartnerOnboard = z.infer<
  typeof deliveryPartnerOnboardSchema
>;

/**
 * KYC document submission — used by shop owners and delivery partners.
 * Image keys are uploaded to object storage first; the upload endpoint
 * returns the keys which are then submitted here.
 */
export const kycDocumentSubmitSchema = z
  .object({
    documentType: kycDocumentTypeSchema,
    documentNumberEncrypted: z.string().min(1).max(512).optional(),
    documentNumberLast4: last4Schema.optional(),
    frontImageKey: objectStoreKeySchema.optional(),
    backImageKey: objectStoreKeySchema.optional(),
    selfieImageKey: objectStoreKeySchema.optional(),
  })
  .refine(
    (d) =>
      d.frontImageKey !== undefined || d.documentNumberEncrypted !== undefined,
    {
      message: "At least a front image or document number must be provided",
      path: ["frontImageKey"],
    },
  );
export type KycDocumentSubmit = z.infer<typeof kycDocumentSubmitSchema>;

/**
 * Request to add a new bank account.
 * Raw account number is accepted here — the service layer encrypts it before
 * persisting. This schema is intentionally narrow: only fields the caller
 * supplies. The service derives accountNumberLast4 and accountNumberEncrypted.
 */
export const addBankAccountSchema = z.object({
  accountHolderName: z.string().min(1).max(255),
  accountNumber: z
    .string()
    .min(9)
    .max(18)
    .regex(/^\d+$/, "Account number must be numeric"),
  ifscCode: ifscSchema,
  bankName: z.string().min(1).max(150),
  branchName: z.string().min(1).max(150).optional(),
  accountType: bankAccountTypeSchema.optional(),
  upiId: upiIdSchema.optional(),
  setAsPrimary: z.boolean().default(false),
});
export type AddBankAccount = z.infer<typeof addBankAccountSchema>;

/**
 * Pagination — reused for list endpoints across all profile resources.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: uuidSchema.optional(),
});
export type Pagination = z.infer<typeof paginationSchema>;

/**
 * Serviceability check request — used to test if a given coordinate or
 * pincode is within a serviceable zone.
 */
export const serviceabilityCheckSchema = z.union([
  z.object({
    type: z.literal("coordinates"),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
  }),
  z.object({
    type: z.literal("pincode"),
    pincode: pincodeSchema,
  }),
]);
export type ServiceabilityCheck = z.infer<typeof serviceabilityCheckSchema>;
