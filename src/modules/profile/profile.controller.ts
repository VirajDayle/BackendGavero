import {
  BankAccountService,
  KycDocumentService,
  AddressService,
  ShopOwnerService,
  DeliveryPartnerService,
  CustomerService,
  CompositeProfileService,
} from "./profile.service";

import {
  mapToAddressPublic,
  mapToBankAccountPublic,
  mapToCustomerProfilePublic,
  mapToDeliveryPartnerProfilePublic,
  mapToKycDocumentPublic,
  mapToShopOwnerProfilePublic,
} from "./profile.schema";

import type {
  AddBankAccount,
  ConfirmPennyDrop,
  AddressInsert,
  AddressUpdate,
  ReviewKyc,
  SubmitKyc,
  ShopOwnerOnboardRequest,
  UpdateShopOwnerRequest,
  DeliveryPartnerOnboardRequest,
  UpdateDeliveryPartnerRequest,
  VerifyPan,
  VerifyPanGstin,
  VerifyGstin,
  VerifyDrivingLicense,
  VerifyDigilockerAccount,
  CreateDigilockerUrl,
  GetDigilockerDetails,
  DigilockerDocumentType,
} from "./profile.schema";

import type { Pagination } from "../../shared";

// ── Shared Types ─────────────────────────────────────────────────────────────

/** Metadata about the request environment. */
export type Meta = {
  ip: string;
  userAgent?: string;
};

/** Authenticated actor identity. */
export type Actor = {
  id: string;
  roles: string[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Maps Actor and Meta to Service-layer ActorMeta. */
const toActorMeta = (actor: Actor, meta: Meta) => ({
  actorId: actor.id,
  actorRoles: actor.roles,
  ip: meta.ip,
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. Composite Profile Controller
// ═════════════════════════════════════════════════════════════════════════════

export const ProfileController = {
  /** Aggregates all user-related profile information for the 'me' view. */
  async getFullProfile(actor: Actor) {
    return await CompositeProfileService.getFullProfile(actor.id);
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. Bank Account Controller
// ═════════════════════════════════════════════════════════════════════════════

export const BankAccountController = {
  /**
   * Add a bank account.
   * Verifies the account via the bank API and saves it with isVerified=false.
   * Penny drop is required separately to mark it verified.
   */
  async add(body: AddBankAccount, actor: Actor, meta: Meta) {
    const account = await BankAccountService.add(body, toActorMeta(actor, meta));
    return mapToBankAccountPublic(account);
  },

  async list(actor: Actor, meta: Meta) {
    const res = await BankAccountService.listByUser(actor.id, toActorMeta(actor, meta));
    return res.items.map(mapToBankAccountPublic);
  },

  /**
   * Initiate penny drop — returns UPI deep-links for the user to send ₹1.
   */
  async initiatePennyDrop(accountId: string, actor: Actor, meta: Meta) {
    return await BankAccountService.initiatePennyDrop(accountId, toActorMeta(actor, meta));
  },

  /**
   * Confirm penny drop — checks status, matches account details, marks verified.
   */
  async confirmPennyDrop(
    accountId: string,
    body: ConfirmPennyDrop,
    actor: Actor,
    meta: Meta,
  ) {
    const updated = await BankAccountService.confirmPennyDrop(
      accountId,
      body.verificationId,
      toActorMeta(actor, meta),
    );
    return mapToBankAccountPublic(updated);
  },

  async setPrimary(accountId: string, actor: Actor, meta: Meta) {
    await BankAccountService.setPrimary(accountId, toActorMeta(actor, meta));
    return { success: true };
  },

  async softDelete(accountId: string, actor: Actor, meta: Meta) {
    await BankAccountService.softDelete(accountId, toActorMeta(actor, meta));
    return { success: true };
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. KYC Document Controller
// ═════════════════════════════════════════════════════════════════════════════

export const KycDocumentController = {
  async submit(body: SubmitKyc, actor: Actor, meta: Meta) {
    const doc = await KycDocumentService.submit(body, toActorMeta(actor, meta));
    return mapToKycDocumentPublic(doc);
  },

  async listByUser(pagination: Pagination, actor: Actor, meta: Meta) {
    const res = await KycDocumentService.listByUser(
      actor.id,
      pagination,
      toActorMeta(actor, meta),
    );
    return {
      items: res.items.map(mapToKycDocumentPublic),
      total: res.total,
    };
  },

  async listPending(pagination: Pagination, actor: Actor, meta: Meta) {
    const res = await KycDocumentService.listPending(pagination, toActorMeta(actor, meta));
    return {
      items: res.items.map(mapToKycDocumentPublic),
      total: res.total,
    };
  },

  async review(docId: string, body: ReviewKyc, actor: Actor, meta: Meta) {
    const updated = await KycDocumentService.review(docId, body, toActorMeta(actor, meta));
    return mapToKycDocumentPublic(updated);
  },

  async verifyPan(body: VerifyPan, actor: Actor, meta: Meta) {
    return await KycDocumentService.verifyPan(body, toActorMeta(actor, meta));
  },

  async verifyPanGstin(body: VerifyPanGstin, actor: Actor, meta: Meta) {
    return await KycDocumentService.verifyPanGstin(
      body,
      toActorMeta(actor, meta),
    );
  },

  async verifyDl(body: VerifyDrivingLicense, actor: Actor, meta: Meta) {
    return await KycDocumentService.verifyDrivingLicense(
      body,
      toActorMeta(actor, meta),
    );
  },


  async verifyGstin(body: VerifyGstin, actor: Actor, meta: Meta) {
    return await KycDocumentService.verifyGstin(body, toActorMeta(actor, meta));
  },

  async verifyDigilockerAccount(
    body: VerifyDigilockerAccount,
    actor: Actor,
    meta: Meta,
  ) {
    return await KycDocumentService.verifyDigilockerAccount(
      body,
      toActorMeta(actor, meta),
    );
  },

  async createDigilockerUrl(
    body: CreateDigilockerUrl,
    actor: Actor,
    meta: Meta,
  ) {
    return await KycDocumentService.createDigilockerUrl(
      body,
      toActorMeta(actor, meta),
    );
  },

  async getDigilockerDetails(
    query: GetDigilockerDetails,
    actor: Actor,
    meta: Meta,
  ) {
    return await KycDocumentService.getDigilockerDetails(
      query,
      toActorMeta(actor, meta),
    );
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. Address Controller
// ═════════════════════════════════════════════════════════════════════════════

export const AddressController = {
  async create(body: AddressInsert, actor: Actor, meta: Meta) {
    const address = await AddressService.create(body, toActorMeta(actor, meta));
    return mapToAddressPublic(address);
  },

  async update(addressId: string, body: AddressUpdate, actor: Actor, meta: Meta) {
    const updated = await AddressService.update(
      addressId,
      body,
      toActorMeta(actor, meta),
    );
    return mapToAddressPublic(updated);
  },

  async getById(addressId: string, actor: Actor, meta: Meta) {
    const address = await AddressService.getById(addressId, toActorMeta(actor, meta));
    return mapToAddressPublic(address);
  },

  async list(actor: Actor, meta: Meta) {
    const res = await AddressService.listByUser(actor.id, toActorMeta(actor, meta));
    return res.items.map(mapToAddressPublic);
  },

  async setDefault(addressId: string, actor: Actor, meta: Meta) {
    await AddressService.setDefault(addressId, toActorMeta(actor, meta));
    return { success: true };
  },

  async softDelete(addressId: string, actor: Actor, meta: Meta) {
    await AddressService.softDelete(addressId, toActorMeta(actor, meta));
    return { success: true };
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// 5. Shop Owner Controller
// ═════════════════════════════════════════════════════════════════════════════

export const ShopOwnerController = {
  async onboard(body: ShopOwnerOnboardRequest, actor: Actor, meta: Meta) {
    const profile = await ShopOwnerService.onboard(body as any, toActorMeta(actor, meta));
    return mapToShopOwnerProfilePublic(profile);
  },

  async getProfile(actor: Actor) {
    const profile = await ShopOwnerService.getProfile(actor.id);
    return mapToShopOwnerProfilePublic(profile);
  },

  async update(body: UpdateShopOwnerRequest, actor: Actor, meta: Meta) {
    const updated = await ShopOwnerService.update(body as any, toActorMeta(actor, meta));
    return mapToShopOwnerProfilePublic(updated);
  },

  async suspend(
    userId: string,
    body: { suspensionReason?: string },
    actor: Actor,
    meta: Meta,
  ) {
    const suspended = await ShopOwnerService.suspend(
      userId,
      body.suspensionReason || "No reason provided",
      toActorMeta(actor, meta),
    );
    return mapToShopOwnerProfilePublic(suspended);
  },

  async unsuspend(userId: string, actor: Actor, meta: Meta) {
    const unsuspended = await ShopOwnerService.unsuspend(userId, toActorMeta(actor, meta));
    return mapToShopOwnerProfilePublic(unsuspended);
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// 6. Delivery Partner Controller
// ═════════════════════════════════════════════════════════════════════════════

export const DeliveryPartnerController = {
  async onboard(body: DeliveryPartnerOnboardRequest, actor: Actor, meta: Meta) {
    const profile = await DeliveryPartnerService.onboard(
      body as any,
      toActorMeta(actor, meta),
    );
    return mapToDeliveryPartnerProfilePublic(profile);
  },

  async getProfile(actor: Actor) {
    const profile = await DeliveryPartnerService.getProfile(actor.id);
    return mapToDeliveryPartnerProfilePublic(profile);
  },

  async update(body: UpdateDeliveryPartnerRequest, actor: Actor, meta: Meta) {
    const updated = await DeliveryPartnerService.update(
      body as any,
      toActorMeta(actor, meta),
    );
    return mapToDeliveryPartnerProfilePublic(updated);
  },

  async suspend(
    userId: string,
    body: { suspensionReason?: string },
    actor: Actor,
    meta: Meta,
  ) {
    const suspended = await DeliveryPartnerService.suspend(
      userId,
      body.suspensionReason || "No reason provided",
      toActorMeta(actor, meta),
    );
    return mapToDeliveryPartnerProfilePublic(suspended);
  },

  async unsuspend(userId: string, actor: Actor, meta: Meta) {
    const unsuspended = await DeliveryPartnerService.unsuspend(
      userId,
      toActorMeta(actor, meta),
    );
    return mapToDeliveryPartnerProfilePublic(unsuspended);
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// 7. Customer Controller
// ═════════════════════════════════════════════════════════════════════════════

export const CustomerController = {
  async getProfile(actor: Actor) {
    const profile = await CustomerService.getOrCreate(actor.id);
    return mapToCustomerProfilePublic(profile!);
  },

  async updatePreferences(
    body: { preferences: Record<string, unknown> },
    actor: Actor,
    meta: Meta,
  ) {
    const updated = await CustomerService.updatePreferences(
      body.preferences,
      toActorMeta(actor, meta),
    );
    return mapToCustomerProfilePublic(updated);
  },
};
