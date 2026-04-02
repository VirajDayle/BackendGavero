/**
 * modules/profile/profile.routes.ts
 *
 * PROTECTED — valid JWT + active session required
 *   GET  /profile/me
 *   /addresses/*
 *   /bank-accounts/*
 *   /kyc/*
 *   /shop-owner/*
 *   /delivery-partner/*
 *   /customer/*
 *
 * ADMIN — JWT + admin role required
 *   /admin/kyc/*
 *   /admin/shop-owners/*
 *   /admin/delivery-partners/*
 *   /admin/bank-accounts/*
 */

import { UAParser } from "ua-parser-js";
import { Elysia, t } from "elysia";
import { jwtAuthPlugin } from "../../middleware/auth.middleware";
import type { AuthUser } from "../../middleware/auth.middleware";
import { AuthErrors } from "../auth/auth.errors";
import { ProfileErrors } from "./profile.errors";

import {
  ProfileController,
  BankAccountController,
  KycDocumentController,
  AddressController,
  ShopOwnerController,
  DeliveryPartnerController,
  CustomerController,
} from "./profile.controller";

// ── Shared TypeBox primitives ─────────────────────────────────────────────────

const UUIDParam = t.Object({ id: t.String({ format: "uuid" }) });
const UserIdParam = t.Object({ userId: t.String({ format: "uuid" }) });

const PaginationQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// ── Shared field fragments ────────────────────────────────────────────────────

const AddressLabel = t.Optional(
  t.Union([
    t.Literal("home"),
    t.Literal("work"),
    t.Literal("office"),
    t.Literal("hotel"),
    t.Literal("other"),
  ]),
);

const VehicleType = t.Optional(
  t.Union([
    t.Literal("bicycle"),
    t.Literal("motorcycle"),
    t.Literal("car"),
    t.Literal("auto_rickshaw"),
    t.Literal("van"),
    t.Literal("truck"),
    t.Literal("other"),
  ]),
);

const BusinessType = t.Optional(
  t.Union([
    t.Literal("sole_proprietorship"),
    t.Literal("llp"),
    t.Literal("pvt_ltd"),
    t.Literal("other"),
  ]),
);

// ── Address bodies ────────────────────────────────────────────────────────────

const CreateAddressBody = t.Object({
  label: AddressLabel,
  customLabel: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  line1: t.String({ minLength: 1, maxLength: 255 }),
  line2: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  landmark: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
  cityId: t.String({ format: "uuid" }),
  pincode: t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
  state: t.String({ minLength: 1, maxLength: 100 }),
  country: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
});

const UpdateAddressBody = t.Object({
  label: AddressLabel,
  customLabel: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  line1: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  line2: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  landmark: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
  pincode: t.Optional(
    t.String({ minLength: 6, maxLength: 6, pattern: "^\\d{6}$" }),
  ),
  state: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  country: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  latitude: t.Optional(t.Number({ minimum: -90, maximum: 90 })),
  longitude: t.Optional(t.Number({ minimum: -180, maximum: 180 })),
});

// ── Bank account bodies ───────────────────────────────────────────────────────

const AddBankAccountBody = t.Object({
  accountHolderName: t.String({ minLength: 1, maxLength: 255 }),
  accountNumber: t.String({ minLength: 9, maxLength: 18, pattern: "^\\d+$" }),
  ifscCode: t.String({
    minLength: 11,
    maxLength: 11,
    pattern: "^[A-Z]{4}0[A-Z0-9]{6}$",
  }),
  bankName: t.String({ minLength: 1, maxLength: 150 }),
  branchName: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
  accountType: t.Optional(
    t.Union([t.Literal("savings"), t.Literal("current"), t.Literal("salary")]),
  ),
  upiId: t.Optional(
    t.String({
      minLength: 3,
      maxLength: 100,
      pattern: "^[a-zA-Z0-9.\\-_]+@[a-zA-Z0-9]+$",
    }),
  ),
  setAsPrimary: t.Optional(t.Boolean({ default: false })),
});

// ── KYC body ──────────────────────────────────────────────────────────────────

const SubmitKycBody = t.Object({
  documentType: t.Union([
    t.Literal("aadhaar"),
    t.Literal("pan"),
    t.Literal("passport"),
    t.Literal("driving_license"),
    t.Literal("voter_id"),
    t.Literal("gst_certificate"),
    t.Literal("business_registration"),
    t.Literal("bank_statement"),
  ]),
  documentNumberEncrypted: t.Optional(
    t.String({ minLength: 1, maxLength: 512 }),
  ),
  documentNumberLast4: t.Optional(
    t.String({ minLength: 4, maxLength: 4, pattern: "^\\d{4}$" }),
  ),
  frontImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  backImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  selfieImageKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
});

// ── Shop owner bodies ─────────────────────────────────────────────────────────

const ShopOwnerOnboardBody = t.Object({
  businessName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  businessType: BusinessType,
  tradeName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
});

const UpdateShopOwnerBody = t.Object({
  businessName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  businessType: BusinessType,
  tradeName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  primaryBankAccountId: t.Optional(t.String({ format: "uuid" })),
  metadata: t.Optional(t.Record(t.String(), t.Unknown())),
});

// ── Delivery partner bodies ───────────────────────────────────────────────────

const DeliveryPartnerOnboardBody = t.Object({
  vehicleType: VehicleType,
  vehicleNumber: t.Optional(
    t.String({ minLength: 4, maxLength: 20, pattern: "^[A-Z0-9 -]+$" }),
  ),
  licenseNumber: t.String({
    minLength: 6,
    maxLength: 20,
    pattern: "^[A-Z0-9-]+$",
  }),
  cityId: t.String({ format: "uuid" }),
});

const UpdateDeliveryPartnerBody = t.Object({
  vehicleType: VehicleType,
  vehicleNumber: t.Optional(
    t.String({ minLength: 4, maxLength: 20, pattern: "^[A-Z0-9 -]+$" }),
  ),
  cityId: t.Optional(t.String({ format: "uuid" })),
  primaryBankAccountId: t.Optional(t.String({ format: "uuid" })),
  metadata: t.Optional(t.Record(t.String(), t.Unknown())),
});

// ── Customer body ─────────────────────────────────────────────────────────────

const UpdateCustomerPreferencesBody = t.Object({
  preferences: t.Record(t.String(), t.Unknown()),
});

// ── Admin — KYC body ──────────────────────────────────────────────────────────

const ReviewKycBody = t.Object({
  status: t.Union([
    t.Literal("verified"),
    t.Literal("rejected"),
    t.Literal("under_review"),
  ]),
  rejectionReason: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
});

// ── Admin — suspend body ──────────────────────────────────────────────────────

const SuspendBody = t.Object({
  isSuspended: t.Boolean(),
  suspensionReason: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
});

// ── Admin — bank account body ─────────────────────────────────────────────────

const VerifyBankAccountBody = t.Object({
  pennyDropRef: t.String({ minLength: 1, maxLength: 255 }),
});

// ── resolveRequestContext ─────────────────────────────────────────────────────

type DeviceInfo = {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: string;
  userAgent: string;
  ip: string;
};

type RequestContext = {
  ip: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
};

function resolveRequestContext({
  request,
  server,
}: {
  request: Request;
  server: { requestIP(req: Request): { address: string } | null } | null;
}): RequestContext {
  const ip = server?.requestIP(request)?.address ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "";
  const parseResult = new UAParser(userAgent).getResult();
  const deviceInfo = {
    browser: parseResult.browser.name || "Unknown",
    browserVersion: parseResult.browser.version || "Unknown",
    os: parseResult.os.name || "Unknown",
    deviceType: parseResult.device.type || "desktop",
    userAgent,
    ip,
  };
  return { ip, userAgent, deviceInfo };
}

// ── authenticate ──────────────────────────────────────────────────────────────

function authenticate(ctx: { user?: AuthUser; [key: string]: unknown }): {
  actor: AuthUser;
} {
  if (!ctx.user) throw AuthErrors.Common.unauthorized();
  return { actor: ctx.user };
}

// ── requireAdminRole ─────────────────────────────────────────────────────────
// Route-level guard — rejects non-admin users before the request reaches the
// service layer. Defence-in-depth: service methods still call requireAdmin().

function requireAdminRole({ actor }: { actor: AuthUser }) {
  if (!actor.roles.includes("admin")) {
    throw AuthErrors.Common.unauthorized();
  }
  return {};
}

// ═════════════════════════════════════════════════════════════════════════════
// PROTECTED — JWT required
// ═════════════════════════════════════════════════════════════════════════════

// ── Composite profile ─────────────────────────────────────────────────────────

export const profileRoutes = new Elysia({
  prefix: "/profile",
  tags: ["Profile"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get(
    "/me",
    ({ actor, ip }) => ProfileController.getFullProfile({ user: actor, ip }),
    {
      detail: {
        summary: "Get full composite profile",
        description:
          "Returns user info + all role profiles + addresses + bank accounts",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── Addresses ─────────────────────────────────────────────────────────────────

export const addressRoutes = new Elysia({
  prefix: "/addresses",
  tags: ["Addresses"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get("/", ({ actor, ip }) => AddressController.list({ user: actor, ip }), {
    detail: { summary: "List own addresses", security: [{ bearerAuth: [] }] },
  })

  .get(
    "/:id",
    ({ actor, params, ip }) =>
      AddressController.getById(params.id, { user: actor, ip }),
    {
      params: UUIDParam,
      detail: { summary: "Get address by ID", security: [{ bearerAuth: [] }] },
    },
  )

  .post(
    "/",
    ({ actor, body, ip }) =>
      AddressController.create(body, { user: actor, ip }),
    {
      body: CreateAddressBody,
      detail: {
        summary: "Create a new address",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch(
    "/:id",
    ({ actor, params, body, ip }) =>
      AddressController.update(params.id, body, { user: actor, ip }),
    {
      params: UUIDParam,
      body: UpdateAddressBody,
      detail: { summary: "Update an address", security: [{ bearerAuth: [] }] },
    },
  )

  .post(
    "/:id/default",
    ({ actor, params, ip }) =>
      AddressController.setDefault(params.id, { user: actor, ip }),
    {
      params: UUIDParam,
      detail: {
        summary: "Set an address as default",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete(
    "/:id",
    ({ actor, params, ip }) =>
      AddressController.softDelete(params.id, { user: actor, ip }),
    {
      params: UUIDParam,
      detail: {
        summary: "Delete an address (soft delete)",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── Bank accounts ─────────────────────────────────────────────────────────────

export const bankAccountRoutes = new Elysia({
  prefix: "/bank-accounts",
  tags: ["Bank Accounts"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get(
    "/",
    ({ actor, ip }) => BankAccountController.list({ user: actor, ip }),
    {
      detail: {
        summary: "List own bank accounts",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/",
    ({ actor, body, ip }) =>
      BankAccountController.add(body, { user: actor, ip }),
    {
      body: AddBankAccountBody,
      detail: {
        summary: "Add a new bank account",
        description:
          "Account number is encrypted at rest. Only last-4 digits are stored in cleartext.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/:id/primary",
    ({ actor, params, ip }) =>
      BankAccountController.setPrimary(params.id, { user: actor, ip }),
    {
      params: UUIDParam,
      detail: {
        summary: "Set a bank account as primary",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete(
    "/:id",
    ({ actor, params, ip }) =>
      BankAccountController.softDelete(params.id, { user: actor, ip }),
    {
      params: UUIDParam,
      detail: {
        summary: "Delete a bank account (soft delete)",
        description:
          "Cannot delete the primary bank account. Set another as primary first.",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── KYC documents ─────────────────────────────────────────────────────────────

export const kycRoutes = new Elysia({ prefix: "/kyc", tags: ["KYC"] })
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get(
    "/",
    ({ actor, query, ip }) =>
      KycDocumentController.listByUser(
        { page: query.page ?? 1, limit: query.limit ?? 20 },
        { user: actor, ip },
      ),
    {
      query: PaginationQuery,
      detail: {
        summary: "List own KYC documents",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/submit",
    ({ actor, body, ip }) =>
      KycDocumentController.submit(body, { user: actor, ip }),
    {
      body: SubmitKycBody,
      detail: {
        summary: "Submit a KYC document",
        description:
          "Upload images to object storage first, then submit keys here.",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── Shop owner ────────────────────────────────────────────────────────────────

export const shopOwnerRoutes = new Elysia({
  prefix: "/shop-owner",
  tags: ["Shop Owners"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .post(
    "/onboard",
    ({ actor, body, ip }) =>
      ShopOwnerController.onboard(body, { user: actor, ip }),
    {
      body: ShopOwnerOnboardBody,
      detail: {
        summary: "Onboard as a shop owner",
        description:
          "Creates shop owner profile and assigns the shopkeeper role. Idempotent — returns existing profile if already onboarded.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .get(
    "/me",
    ({ actor, ip }) => ShopOwnerController.getProfile({ user: actor, ip }),
    {
      detail: {
        summary: "Get own shop owner profile",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch(
    "/me",
    ({ actor, body, ip }) =>
      ShopOwnerController.update(body, { user: actor, ip }),
    {
      body: UpdateShopOwnerBody,
      detail: {
        summary: "Update own shop owner profile",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── Delivery partner ──────────────────────────────────────────────────────────

export const deliveryPartnerRoutes = new Elysia({
  prefix: "/delivery-partner",
  tags: ["Delivery Partners"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .post(
    "/onboard",
    ({ actor, body, ip }) =>
      DeliveryPartnerController.onboard(body, { user: actor, ip }),
    {
      body: DeliveryPartnerOnboardBody,
      detail: {
        summary: "Onboard as a delivery partner",
        description:
          "Creates delivery partner profile and assigns the delivery_partner role. Validates license uniqueness. Idempotent.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .get(
    "/me",
    ({ actor, ip }) =>
      DeliveryPartnerController.getProfile({ user: actor, ip }),
    {
      detail: {
        summary: "Get own delivery partner profile",
        description:
          "Includes computed ratingAverage from ratingSum/ratingCount",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch(
    "/me",
    ({ actor, body, ip }) =>
      DeliveryPartnerController.update(body, { user: actor, ip }),
    {
      body: UpdateDeliveryPartnerBody,
      detail: {
        summary: "Update own delivery partner profile",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── Customer ──────────────────────────────────────────────────────────────────

export const customerRoutes = new Elysia({
  prefix: "/customer",
  tags: ["Customers"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)

  .get(
    "/me",
    ({ actor, ip }) => CustomerController.getProfile({ user: actor, ip }),
    {
      detail: {
        summary: "Get own customer profile",
        description:
          "Idempotent — auto-creates customer profile if not present.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch(
    "/me/preferences",
    ({ actor, body, ip }) =>
      CustomerController.updatePreferences(body, { user: actor, ip }),
    {
      body: UpdateCustomerPreferencesBody,
      detail: {
        summary: "Update customer preferences",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN — JWT + admin role required
// ═════════════════════════════════════════════════════════════════════════════

// ── Admin — KYC ───────────────────────────────────────────────────────────────

export const adminKycRoutes = new Elysia({
  prefix: "/admin/kyc",
  tags: ["Admin — KYC"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .derive(requireAdminRole)

  .get(
    "/pending",
    ({ actor, query, ip }) =>
      KycDocumentController.listPending(
        { page: query.page ?? 1, limit: query.limit ?? 20 },
        { user: actor, ip },
      ),
    {
      query: PaginationQuery,
      detail: {
        summary: "List pending KYC submissions (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/:id/review",
    ({ actor, params, body, ip }) =>
      KycDocumentController.review(params.id, body, { user: actor, ip }),
    {
      params: UUIDParam,
      body: ReviewKycBody,
      detail: {
        summary: "Review a KYC submission (admin)",
        description:
          "Validates status transitions: pending → under_review → verified/rejected",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── Admin — shop owners ───────────────────────────────────────────────────────

export const adminShopOwnerRoutes = new Elysia({
  prefix: "/admin/shop-owners",
  tags: ["Admin — Shop Owners"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .derive(requireAdminRole)

  .patch(
    "/:userId/suspend",
    ({ actor, params, body, ip }) => {
      if (body.isSuspended && !body.suspensionReason) {
        throw ProfileErrors.Common.validation(
          "suspensionReason is required when suspending",
        );
      }
      return body.isSuspended
        ? ShopOwnerController.suspend(
            params.userId,
            { suspensionReason: body.suspensionReason! },
            { user: actor, ip },
          )
        : ShopOwnerController.unsuspend(params.userId, { user: actor, ip });
    },
    {
      params: UserIdParam,
      body: SuspendBody,
      detail: {
        summary: "Suspend or unsuspend a shop owner (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── Admin — delivery partners ─────────────────────────────────────────────────

export const adminDeliveryPartnerRoutes = new Elysia({
  prefix: "/admin/delivery-partners",
  tags: ["Admin — Delivery Partners"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .derive(requireAdminRole)

  .patch(
    "/:userId/suspend",
    ({ actor, params, body, ip }) => {
      if (body.isSuspended && !body.suspensionReason) {
        throw ProfileErrors.Common.validation(
          "suspensionReason is required when suspending",
        );
      }
      return body.isSuspended
        ? DeliveryPartnerController.suspend(
            params.userId,
            { suspensionReason: body.suspensionReason! },
            { user: actor, ip },
          )
        : DeliveryPartnerController.unsuspend(params.userId, {
            user: actor,
            ip,
          });
    },
    {
      params: UserIdParam,
      body: SuspendBody,
      detail: {
        summary: "Suspend or unsuspend a delivery partner (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ── Admin — bank account verification ─────────────────────────────────────────

export const adminBankAccountRoutes = new Elysia({
  prefix: "/admin/bank-accounts",
  tags: ["Admin — Bank Accounts"],
})
  .derive(resolveRequestContext)
  .use(jwtAuthPlugin)
  .derive(authenticate)
  .derive(requireAdminRole)

  .post(
    "/:id/verify",
    ({ actor, params, body, ip }) =>
      BankAccountController.markVerified(params.id, body, { user: actor, ip }),
    {
      params: UUIDParam,
      body: VerifyBankAccountBody,
      detail: {
        summary: "Mark a bank account as verified (admin)",
        description:
          "Used after penny-drop verification. Records the penny-drop reference.",
        security: [{ bearerAuth: [] }],
      },
    },
  );

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSED PLUGIN — exported for app.ts
// ═════════════════════════════════════════════════════════════════════════════

export const profilePlugin = new Elysia({ name: "profile-plugin" })
  // Protected
  .use(profileRoutes)
  .use(addressRoutes)
  .use(bankAccountRoutes)
  .use(kycRoutes)
  .use(shopOwnerRoutes)
  .use(deliveryPartnerRoutes)
  .use(customerRoutes)
  // Admin
  .use(adminKycRoutes)
  .use(adminShopOwnerRoutes)
  .use(adminDeliveryPartnerRoutes)
  .use(adminBankAccountRoutes);
