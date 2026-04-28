import { Elysia } from "elysia";
import { jwtAuthPlugin } from "../../middleware/auth.middleware";
import { resolveRequestContext, authenticate } from "../../shared";



import {
  ProfileController,
  BankAccountController,
  KycDocumentController,
  AddressController,
  ShopOwnerController,
  DeliveryPartnerController,
  CustomerController,
} from "./profile.controller";

import {
  UUIDParam,
  UserIdParam,
  PaginationQuery,
  CreateAddressBody,
  UpdateAddressBody,
  AddBankAccountBody,
  ConfirmPennyDropBody,
  VerifyPanBody,
  VerifyPanGstinBody,
  VerifyGstinBody,
  VerifyDrivingLicenseBody,
  VerifyDigilockerAccountBody,
  CreateDigilockerUrlBody,
  GetDigilockerDetailsQuery,
  SubmitKycBody,
  ReviewKycBody,
  ShopOwnerOnboardBody,
  UpdateShopOwnerBody,
  DeliveryPartnerOnboardBody,
  UpdateDeliveryPartnerBody,
  UpdateCustomerPreferencesBody,
  SuspendBody,
} from "./profile.schema";


// ═════════════════════════════════════════════════════════════════════════════
// 1. Composite Profile Routes
// ═════════════════════════════════════════════════════════════════════════════

export const profileRoutes = new Elysia({ prefix: "/profile", tags: ["Profile"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .get("/me", ({ actor }) => ProfileController.getFullProfile(actor), {
    detail: {
      summary: "Get full composite profile",
      description: "Returns aggregated view of user, role profiles, addresses, and bank accounts.",
      security: [{ bearerAuth: [] }],
    },
  });

// ═════════════════════════════════════════════════════════════════════════════
// 2. Address Routes
// ═════════════════════════════════════════════════════════════════════════════

export const addressRoutes = new Elysia({ prefix: "/addresses", tags: ["Addresses"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .get("/", ({ actor, ip, userAgent }) => AddressController.list(actor, { ip, userAgent }), {
    detail: { summary: "List own addresses", security: [{ bearerAuth: [] }] },
  })
  .get("/:id", ({ params, actor, ip, userAgent }) => AddressController.getById(params.id, actor, { ip, userAgent }), {
    params: UUIDParam,
    detail: { summary: "Get address by ID", security: [{ bearerAuth: [] }] },
  })
  .post("/", ({ body, actor, ip, userAgent }) => AddressController.create(body, actor, { ip, userAgent }), {
    body: CreateAddressBody,
    detail: { summary: "Create a new address", security: [{ bearerAuth: [] }] },
  })
  .patch("/:id", ({ params, body, actor, ip, userAgent }) => AddressController.update(params.id, body, actor, { ip, userAgent }), {
    params: UUIDParam,
    body: UpdateAddressBody,
    detail: { summary: "Update an address", security: [{ bearerAuth: [] }] },
  })
  .post("/:id/default", ({ params, actor, ip, userAgent }) => AddressController.setDefault(params.id, actor, { ip, userAgent }), {
    params: UUIDParam,
    detail: { summary: "Set an address as default", security: [{ bearerAuth: [] }] },
  })
  .delete("/:id", ({ params, actor, ip, userAgent }) => AddressController.softDelete(params.id, actor, { ip, userAgent }), {
    params: UUIDParam,
    detail: { summary: "Soft delete an address", security: [{ bearerAuth: [] }] },
  });

// ═════════════════════════════════════════════════════════════════════════════
// 3. Bank Account Routes
// ═════════════════════════════════════════════════════════════════════════════

export const bankAccountRoutes = new Elysia({ prefix: "/bank-accounts", tags: ["Bank Accounts"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .get("/", ({ actor, ip, userAgent }) => BankAccountController.list(actor, { ip, userAgent }), {
    detail: { summary: "List own bank accounts", security: [{ bearerAuth: [] }] },
  })
  /**
   * Add a bank account.
   * Calls the bank account verification API inline.
   * Saves the account as unverified (pending penny drop).
   */
  .post("/", ({ body, actor, ip, userAgent }) => BankAccountController.add(body as any, actor, { ip, userAgent }), {
    body: AddBankAccountBody,
    detail: {
      summary: "Add a new bank account",
      description: "Verifies account via the bank API. Saves with isVerified=false. Penny drop required to fully verify.",
      security: [{ bearerAuth: [] }],
    },
  })
  .post("/:id/primary", ({ params, actor, ip, userAgent }) => BankAccountController.setPrimary(params.id, actor, { ip, userAgent }), {
    params: UUIDParam,
    detail: { summary: "Set a bank account as primary", security: [{ bearerAuth: [] }] },
  })
  /**
   * Initiate penny drop — returns UPI / GPay / PhonePe / Paytm deep links.
   */
  .post("/:id/penny-drop/initiate", ({ params, actor, ip, userAgent }) => BankAccountController.initiatePennyDrop(params.id, actor, { ip, userAgent }), {
    params: UUIDParam,
    detail: {
      summary: "Initiate penny drop for a bank account",
      description: "Returns UPI deep-links for the user to send ₹1 via any UPI app.",
      security: [{ bearerAuth: [] }],
    },
  })
  /**
   * Confirm penny drop — validates result and marks account as verified.
   */
  .post("/:id/penny-drop/confirm", ({ params, body, actor, ip, userAgent }) => BankAccountController.confirmPennyDrop(params.id, body as any, actor, { ip, userAgent }), {
    params: UUIDParam,
    body: ConfirmPennyDropBody,
    detail: {
      summary: "Confirm penny drop for a bank account",
      description: "Fetches penny drop status from provider, validates account details match, and marks account as verified.",
      security: [{ bearerAuth: [] }],
    },
  })
  .delete("/:id", ({ params, actor, ip, userAgent }) => BankAccountController.softDelete(params.id, actor, { ip, userAgent }), {
    params: UUIDParam,
    detail: { summary: "Soft delete a bank account", security: [{ bearerAuth: [] }] },
  });


// ═════════════════════════════════════════════════════════════════════════════
// 4. KYC Routes
// ═════════════════════════════════════════════════════════════════════════════

export const kycRoutes = new Elysia({ prefix: "/kyc", tags: ["KYC"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .get("/", ({ query, actor, ip, userAgent }) => KycDocumentController.listByUser(query as any, actor, { ip, userAgent }), {
    query: PaginationQuery,
    detail: { summary: "List own KYC documents", security: [{ bearerAuth: [] }] },
  })
  .post("/submit", ({ body, actor, ip, userAgent }) => KycDocumentController.submit(body as any, actor, { ip, userAgent }), {
    body: SubmitKycBody,
    detail: { summary: "Submit a KYC document", security: [{ bearerAuth: [] }] },
  })
  .post("/verify/pan", ({ body, actor, ip, userAgent }) => KycDocumentController.verifyPan(body as any, actor, { ip, userAgent }), {
    body: VerifyPanBody,
    detail: { summary: "Verify PAN card", security: [{ bearerAuth: [] }] },
  })
  .post("/verify/pan-gstin", ({ body, actor, ip, userAgent }) => KycDocumentController.verifyPanGstin(body as any, actor, { ip, userAgent }), {
    body: VerifyPanGstinBody,
    detail: { summary: "Verify all GSTINs for a PAN", security: [{ bearerAuth: [] }] },
  })
  .post("/verify/dl", ({ body, actor, ip, userAgent }) => KycDocumentController.verifyDl(body as any, actor, { ip, userAgent }), {
    body: VerifyDrivingLicenseBody,
    detail: { summary: "Verify Driving License", security: [{ bearerAuth: [] }] },
  })
  .post("/verify/gstin", ({ body, actor, ip, userAgent }) => KycDocumentController.verifyGstin(body as any, actor, { ip, userAgent }), {
    body: VerifyGstinBody,
    detail: { summary: "Verify GSTIN", security: [{ bearerAuth: [] }] },
  })
  .post("/verify/digilocker/account", ({ body, actor, ip, userAgent }) => KycDocumentController.verifyDigilockerAccount(body as any, actor, { ip, userAgent }), {
    body: VerifyDigilockerAccountBody,
    detail: { summary: "Verify Digilocker account", security: [{ bearerAuth: [] }] },
  })
  .post("/verify/digilocker/url", ({ body, actor, ip, userAgent }) => KycDocumentController.createDigilockerUrl(body as any, actor, { ip, userAgent }), {
    body: CreateDigilockerUrlBody,
    detail: { summary: "Create Digilocker consent URL", security: [{ bearerAuth: [] }] },
  })
  .get("/verify/digilocker", ({ query, actor, ip, userAgent }) => KycDocumentController.getDigilockerDetails(query as any, actor, { ip, userAgent }), {
    query: GetDigilockerDetailsQuery,
    detail: { summary: "Get Digilocker session details", security: [{ bearerAuth: [] }] },
  });

// ═════════════════════════════════════════════════════════════════════════════
// 5. Role Profile Routes (Shop Owner, DP, Customer)
// ═════════════════════════════════════════════════════════════════════════════

export const shopOwnerRoutes = new Elysia({ prefix: "/shop-owner", tags: ["Shop Owners"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .post("/onboard", ({ body, actor, ip, userAgent }) => ShopOwnerController.onboard(body as any, actor, { ip, userAgent }), {
    body: ShopOwnerOnboardBody,
    detail: { summary: "Onboard as shop owner", security: [{ bearerAuth: [] }] },
  })
  .get("/me", ({ actor }) => ShopOwnerController.getProfile(actor), {
    detail: { summary: "Get own shop owner profile", security: [{ bearerAuth: [] }] },
  })
  .patch("/me", ({ body, actor, ip, userAgent }) => ShopOwnerController.update(body as any, actor, { ip, userAgent }), {
    body: UpdateShopOwnerBody,
    detail: { summary: "Update own shop owner profile", security: [{ bearerAuth: [] }] },
  });

export const deliveryPartnerRoutes = new Elysia({ prefix: "/delivery-partner", tags: ["Delivery Partners"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .post("/onboard", ({ body, actor, ip, userAgent }) => DeliveryPartnerController.onboard(body as any, actor, { ip, userAgent }), {
    body: DeliveryPartnerOnboardBody,
    detail: { summary: "Onboard as delivery partner", security: [{ bearerAuth: [] }] },
  })
  .get("/me", ({ actor }) => DeliveryPartnerController.getProfile(actor), {
    detail: { summary: "Get own delivery partner profile", security: [{ bearerAuth: [] }] },
  })
  .patch("/me", ({ body, actor, ip, userAgent }) => DeliveryPartnerController.update(body as any, actor, { ip, userAgent }), {
    body: UpdateDeliveryPartnerBody,
    detail: { summary: "Update own delivery partner profile", security: [{ bearerAuth: [] }] },
  });

export const customerRoutes = new Elysia({ prefix: "/customer", tags: ["Customers"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .get("/me", ({ actor }) => CustomerController.getProfile(actor), {
    detail: { summary: "Get own customer profile", security: [{ bearerAuth: [] }] },
  })
  .patch("/me/preferences", ({ body, actor, ip, userAgent }) => CustomerController.updatePreferences(body, actor, { ip, userAgent }), {
    body: UpdateCustomerPreferencesBody,
    detail: { summary: "Update customer preferences", security: [{ bearerAuth: [] }] },
  });

// ═════════════════════════════════════════════════════════════════════════════
// 6. Admin Routes
// ═════════════════════════════════════════════════════════════════════════════

export const adminKycRoutes = new Elysia({ prefix: "/admin/kyc", tags: ["Admin — KYC"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .derive(requireAdminRole)
  .get("/pending", ({ query, actor, ip, userAgent }) => KycDocumentController.listPending(query as any, actor, { ip, userAgent }), {
    query: PaginationQuery,
    detail: { summary: "List pending KYC (admin)", security: [{ bearerAuth: [] }] },
  })
  .post("/:id/review", ({ params, body, actor, ip, userAgent }) => KycDocumentController.review(params.id, body, actor, { ip, userAgent }), {
    params: UUIDParam,
    body: ReviewKycBody,
    detail: { summary: "Review KYC submission (admin)", security: [{ bearerAuth: [] }] },
  });

export const adminShopOwnerRoutes = new Elysia({ prefix: "/admin/shop-owners", tags: ["Admin — Shop Owners"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .derive(requireAdminRole)
  .patch("/:userId/suspend", ({ params, body, actor, ip, userAgent }) => ShopOwnerController.suspend(params.userId, body, actor, { ip, userAgent }), {
    params: UserIdParam,
    body: SuspendBody,
    detail: { summary: "Suspend shop owner (admin)", security: [{ bearerAuth: [] }] },
  })
  .patch("/:userId/unsuspend", ({ params, actor, ip, userAgent }) => ShopOwnerController.unsuspend(params.userId, actor, { ip, userAgent }), {
    params: UserIdParam,
    detail: { summary: "Unsuspend shop owner (admin)", security: [{ bearerAuth: [] }] },
  });

export const adminDeliveryPartnerRoutes = new Elysia({ prefix: "/admin/delivery-partners", tags: ["Admin — Delivery Partners"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .derive(requireAdminRole)
  .patch("/:userId/suspend", ({ params, body, actor, ip, userAgent }) => DeliveryPartnerController.suspend(params.userId, body, actor, { ip, userAgent }), {
    params: UserIdParam,
    body: SuspendBody,
    detail: { summary: "Suspend delivery partner (admin)", security: [{ bearerAuth: [] }] },
  })
  .patch("/:userId/unsuspend", ({ params, actor, ip, userAgent }) => DeliveryPartnerController.unsuspend(params.userId, actor, { ip, userAgent }), {
    params: UserIdParam,
    detail: { summary: "Unsuspend delivery partner (admin)", security: [{ bearerAuth: [] }] },
  });



export const profilePlugin = new Elysia({ name: "profile-plugin" })
  .use(profileRoutes)
  .use(addressRoutes)
  .use(bankAccountRoutes)
  .use(kycRoutes)
  .use(shopOwnerRoutes)
  .use(deliveryPartnerRoutes)
  .use(customerRoutes)
  .use(adminKycRoutes)
  .use(adminShopOwnerRoutes)
  .use(adminDeliveryPartnerRoutes);

