/**
 * modules/profile/profile.controller.ts
 *
 * Thin HTTP layer — delegates to profile services, shapes responses.
 * Never touches the database directly.
 * Follows the same conventions as auth.controller.ts.
 */

import type { AuthUser } from "../../middleware/auth.middleware";

import {
  BankAccountService,
  KycDocumentService,
  AddressService,
  ShopOwnerService,
  DeliveryPartnerService,
  CustomerService,
  CompositeProfileService,
} from "./profile.service";

// ── Context type ──────────────────────────────────────────────────────────────
// Subset of the Elysia context relevant to controllers.

interface Ctx {
  user: AuthUser;
  ip: string;
}

function actor(ctx: Ctx) {
  return {
    actorId: ctx.user.id,
    actorRoles: ctx.user.roles,
    ip: ctx.ip,
  };
}

function actorSimple(ctx: Ctx) {
  return {
    actorId: ctx.user.id,
    ip: ctx.ip,
  };
}

// =============================================================================
// COMPOSITE PROFILE
// =============================================================================

export abstract class ProfileController {
  static async getFullProfile(ctx: Ctx) {
    return await CompositeProfileService.getFullProfile(ctx.user.id);
  }
}

// =============================================================================
// BANK ACCOUNTS
// =============================================================================

export abstract class BankAccountController {
  static async add(
    body: {
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branchName?: string;
      accountType?: "savings" | "current" | "salary";
      upiId?: string;
      setAsPrimary?: boolean;
    },
    ctx: Ctx,
  ) {
    const account = await BankAccountService.add(body, actorSimple(ctx));
    // Strip encrypted field from response
    const { accountNumberEncrypted: _, ...safe } = account;
    return safe;
  }

  static async list(ctx: Ctx) {
    const accounts = await BankAccountService.listByUser(
      ctx.user.id,
      actor(ctx),
    );
    // Strip encrypted fields
    const safe = accounts.map(({ accountNumberEncrypted: _, ...rest }) => rest);
    return safe;
  }

  static async setPrimary(accountId: string, ctx: Ctx) {
    return await BankAccountService.setPrimary(
      accountId,
      actorSimple(ctx),
    );
  }

  static async markVerified(
    accountId: string,
    body: { pennyDropRef: string },
    ctx: Ctx,
  ) {
    return await BankAccountService.markVerified(
      accountId,
      body.pennyDropRef,
      actor(ctx),
    );
  }

  static async softDelete(accountId: string, ctx: Ctx) {
    await BankAccountService.softDelete(accountId, actorSimple(ctx));
    return { deleted: true };
  }
}

// =============================================================================
// KYC DOCUMENTS
// =============================================================================

export abstract class KycDocumentController {
  static async submit(
    body: {
      documentType: string;
      documentNumberEncrypted?: string;
      documentNumberLast4?: string;
      frontImageKey?: string;
      backImageKey?: string;
      selfieImageKey?: string;
    },
    ctx: Ctx,
  ) {
    const doc = await KycDocumentService.submit(body, actorSimple(ctx));
    // Strip sensitive fields
    const {
      documentNumberEncrypted: _d,
      verificationResponse: _v,
      verificationRef: _r,
      ...safe
    } = doc;
    return safe;
  }

  static async review(
    docId: string,
    body: {
      status: "verified" | "rejected" | "under_review";
      rejectionReason?: string;
    },
    ctx: Ctx,
  ) {
    return await KycDocumentService.review(docId, body, actor(ctx));
  }

  static async listByUser(
    pagination: { page: number; limit: number },
    ctx: Ctx,
  ) {
    const { items, total } = await KycDocumentService.listByUser(
      ctx.user.id,
      pagination,
      actor(ctx),
    );

    // Strip sensitive fields
    const safe = items.map(
      ({
        documentNumberEncrypted: _d,
        verificationResponse: _v,
        verificationRef: _r,
        ...rest
      }) => rest,
    );

    return { items: safe, total };
  }

  static async listPending(
    pagination: { page: number; limit: number },
    ctx: Ctx,
  ) {
    const { items, total } = await KycDocumentService.listPending(
      pagination,
      actor(ctx),
    );

    // Strip sensitive fields before sending to admin (who might not need the ciphertext)
    const safe = items.map(
      ({
        documentNumberEncrypted: _d,
        verificationResponse: _v,
        verificationRef: _r,
        ...rest
      }) => rest,
    );

    return { items: safe, total };
  }
}

// =============================================================================
// ADDRESSES
// =============================================================================

export abstract class AddressController {
  static async create(
    body: {
      label?: string;
      customLabel?: string;
      line1: string;
      line2?: string;
      landmark?: string;
      cityId: string;
      pincode: string;
      state: string;
      country?: string;
      latitude: number;
      longitude: number;
    },
    ctx: Ctx,
  ) {
    return await AddressService.create(body, actorSimple(ctx));
  }

  static async getById(addressId: string, ctx: Ctx) {
    return await AddressService.getById(addressId, actorSimple(ctx));
  }

  static async update(
    addressId: string,
    body: {
      label?: string;
      customLabel?: string;
      line1?: string;
      line2?: string;
      landmark?: string;
      pincode?: string;
      state?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    },
    ctx: Ctx,
  ) {
    return await AddressService.update(
      addressId,
      body,
      actorSimple(ctx),
    );
  }

  static async setDefault(addressId: string, ctx: Ctx) {
    return await AddressService.setDefault(
      addressId,
      actorSimple(ctx),
    );
  }

  static async softDelete(addressId: string, ctx: Ctx) {
    await AddressService.softDelete(addressId, actorSimple(ctx));
    return { deleted: true };
  }

  static async list(ctx: Ctx) {
    return await AddressService.listByUser(
      ctx.user.id,
      actor(ctx),
    );
  }
}

// =============================================================================
// SHOP OWNER
// =============================================================================

export abstract class ShopOwnerController {
  static async onboard(
    body: {
      businessName?: string;
      businessType?: string;
      tradeName?: string;
    },
    ctx: Ctx,
  ) {
    return await ShopOwnerService.onboard(body, actorSimple(ctx));
  }

  static async getProfile(ctx: Ctx) {
    return await ShopOwnerService.getProfile(ctx.user.id);
  }

  static async update(
    body: {
      businessName?: string;
      businessType?: string;
      tradeName?: string;
      primaryBankAccountId?: string;
      metadata?: Record<string, unknown>;
    },
    ctx: Ctx,
  ) {
    return await ShopOwnerService.update(
      body,
      actorSimple(ctx),
    );
  }

  static async suspend(
    userId: string,
    body: { suspensionReason: string },
    ctx: Ctx,
  ) {
    return await ShopOwnerService.suspend(
      userId,
      body.suspensionReason,
      actor(ctx),
    );
  }

  static async unsuspend(userId: string, ctx: Ctx) {
    return await ShopOwnerService.unsuspend(userId, actor(ctx));
  }
}

// =============================================================================
// DELIVERY PARTNER
// =============================================================================

export abstract class DeliveryPartnerController {
  static async onboard(
    body: {
      vehicleType?: string;
      vehicleNumber?: string;
      licenseNumber: string;
      cityId: string;
    },
    ctx: Ctx,
  ) {
    return await DeliveryPartnerService.onboard(
      body,
      actorSimple(ctx),
    );
  }

  static async getProfile(ctx: Ctx) {
    return await DeliveryPartnerService.getProfile(ctx.user.id);
  }

  static async update(
    body: {
      vehicleType?: string;
      vehicleNumber?: string;
      cityId?: string;
      primaryBankAccountId?: string;
      metadata?: Record<string, unknown>;
    },
    ctx: Ctx,
  ) {
    return await DeliveryPartnerService.update(
      body,
      actorSimple(ctx),
    );
  }


  static async suspend(
    userId: string,
    body: { suspensionReason: string },
    ctx: Ctx,
  ) {
    return await DeliveryPartnerService.suspend(
      userId,
      body.suspensionReason,
      actor(ctx),
    );
  }

  static async unsuspend(userId: string, ctx: Ctx) {
    return await DeliveryPartnerService.unsuspend(
      userId,
      actor(ctx),
    );
  }
}

// =============================================================================
// CUSTOMER
// =============================================================================

export abstract class CustomerController {
  static async getProfile(ctx: Ctx) {
    return await CustomerService.getOrCreate(ctx.user.id);
  }

  static async updatePreferences(
    body: { preferences: Record<string, unknown> },
    ctx: Ctx,
  ) {
    return await CustomerService.updatePreferences(
      body.preferences,
      actorSimple(ctx),
    );
  }
}
