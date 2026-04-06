/**
 * modules/profile/profile.service.ts
 *
 * All business logic for the profile domain.
 * Calls repositories for DB access, never touches HTTP.
 * All errors thrown via ProfileErrors factories.
 *
 * Service classes:
 *   1. CityService           — admin CRUD for platform cities
 *   2. PincodeService        — admin CRUD + public serviceability check
 *   3. BankAccountService    — add/list/primary/verify/delete
 *   4. KycDocumentService    — submit/review/list
 *   5. AddressService        — CRUD with default-swap
 *   6. ShopOwnerService      — onboard/update/suspend
 *   7. DeliveryPartnerService — onboard/update/status/location/suspend
 *   8. CustomerService       — get-or-create/preferences/loyalty/order
 */

import {
  CityRepository,
  ServiceablePincodeRepository,
} from "../platform/platform.repository";

import {
  AddressRepository,
  BankAccountRepository,
  CustomerProfileRepository,
  DeliveryPartnerProfileRepository,
  KycDocumentRepository,
  ShopOwnerProfileRepository,
} from "./profile.repository";

import {
  RoleRepository,
  UserRoleRepository,
  AuditLogRepository,
  UserRepository,
} from "../auth/auth.repository";

import { ProfileErrors } from "./profile.errors";
import { PlatformErrors } from "../platform/platform.errors";
import { db } from "../../db";
import { encrypt } from "../../utils/crypto";
import { PincodeService } from "../platform/platform.service";
import { coordsToH3Multi } from "../../utils/h3";

import type { Pagination } from "./profile.schema";

// ── Repo instances ────────────────────────────────────────────────────────────

const cityRepo = new CityRepository(db);
const bankAccountRepo = new BankAccountRepository(db);
const kycRepo = new KycDocumentRepository(db);
const addressRepo = new AddressRepository(db);
const shopOwnerRepo = new ShopOwnerProfileRepository(db);
const dpRepo = new DeliveryPartnerProfileRepository(db);
const customerRepo = new CustomerProfileRepository(db);
const roleRepo = new RoleRepository(db);
const userRoleRepo = new UserRoleRepository(db);
const auditRepo = new AuditLogRepository(db);
const userRepo = new UserRepository(db);

// ── Meta type ─────────────────────────────────────────────────────────────────

type ActorMeta = { actorId: string; actorRoles: string[]; ip: string };
type AdminMeta = ActorMeta;

function requireAdmin(roles: string[]) {
  if (!roles.includes("admin")) throw ProfileErrors.Common.adminRequired();
}

function requireOwnerOrAdmin(
  ownerId: string,
  actorId: string,
  actorRoles: string[],
) {
  if (ownerId !== actorId && !actorRoles.includes("admin"))
    throw ProfileErrors.Common.forbidden();
}

// ── Valid KYC status transitions ──────────────────────────────────────────────

const KYC_TRANSITIONS: Record<string, string[]> = {
  pending: ["under_review", "verified", "rejected"],
  under_review: ["verified", "rejected"],
};

// ── Valid partner-initiated status transitions ────────────────────────────────

const PARTNER_STATUS_TRANSITIONS: Record<string, string[]> = {
  offline: ["available"],
  available: ["offline", "break"],
  break: ["available", "offline"],
};

// =============================================================================
// 3. BankAccountService
// =============================================================================

export abstract class BankAccountService {
  static async add(
    data: {
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string; // ← now required, not optional
      branchName?: string;
      accountType?: "savings" | "current" | "salary";
      upiId?: string;
      setAsPrimary?: boolean;
    },
    actorMeta: { actorId: string; ip: string },
  ) {
    // bankName must arrive pre-filled from frontend via /platform/ifsc/:code
    if (!data.bankName?.trim()) {
      throw ProfileErrors.BankAccount.invalidIfsc(
        "Bank name is required. Please look up your IFSC code first.",
      );
    }

    const accountNumberLast4 = data.accountNumber.slice(-4);
    const accountNumberEncrypted = await encrypt(data.accountNumber);
    const ifscUpper = data.ifscCode.toUpperCase();

    const created = await db.transaction(async (tx) => {
      const txBankRepo = new BankAccountRepository(tx as unknown as typeof db);

      const existingAddresses = await txBankRepo.listByUser(actorMeta.actorId);
      const isFirst = existingAddresses.length === 0;

      const account = await txBankRepo.create({
        userId: actorMeta.actorId,
        accountHolderName: data.accountHolderName,
        accountNumberEncrypted,
        accountNumberLast4,
        ifscCode: ifscUpper,
        bankName: data.bankName.trim(),
        branchName: data.branchName?.trim(),
        accountType: data.accountType ?? "savings",
        upiId: data.upiId,
        isPrimary: isFirst, // ← first account is always primary automatically
      });

      if (data.setAsPrimary && !isFirst) {
        await txBankRepo.setPrimary(account.id, actorMeta.actorId);
      }

      return account;
    });

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "bank_account.created",
      resource: "bank_account",
      resourceId: created.id,
      after: {
        bankName: data.bankName,
        last4: accountNumberLast4,
        isPrimary: created.isPrimary,
      },
    });

    return created;
  }

  static async listByUser(userId: string, actorMeta: ActorMeta) {
    requireOwnerOrAdmin(userId, actorMeta.actorId, actorMeta.actorRoles);
    return bankAccountRepo.listByUser(userId);
  }

  static async setPrimary(
    accountId: string,
    actorMeta: { actorId: string; ip: string },
  ) {
    const account = await bankAccountRepo.findByIdAndUser(
      accountId,
      actorMeta.actorId,
    );
    if (!account) throw ProfileErrors.BankAccount.notFound();
    if (account.isPrimary) throw ProfileErrors.BankAccount.alreadyPrimary();

    const updated = await db.transaction(async (tx) => {
      const txBankRepo = new BankAccountRepository(tx as unknown as typeof db);
      const txShopOwnerRepo = new ShopOwnerProfileRepository(
        tx as unknown as typeof db,
      );
      const txDpRepo = new DeliveryPartnerProfileRepository(
        tx as unknown as typeof db,
      );

      const res = await txBankRepo.setPrimary(accountId, actorMeta.actorId);

      // Update linked profile primary bank account FKs
      const shopOwner = await txShopOwnerRepo.findByUserId(actorMeta.actorId);
      if (shopOwner) {
        await txShopOwnerRepo.setPrimaryBankAccount(actorMeta.actorId, accountId);
      }

      const dp = await txDpRepo.findByUserId(actorMeta.actorId);
      if (dp) {
        await txDpRepo.setPrimaryBankAccount(actorMeta.actorId, accountId);
      }

      return res;
    });

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "bank_account.set_primary",
      resource: "bank_account",
      resourceId: accountId,
    });

    return updated;
  }

  static async markVerified(
    accountId: string,
    pennyDropRef: string,
    meta: AdminMeta,
  ) {
    requireAdmin(meta.actorRoles);

    const account = await bankAccountRepo.findById(accountId);
    if (!account) throw ProfileErrors.BankAccount.notFound();

    const updated = await bankAccountRepo.markVerified(accountId, pennyDropRef);

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "bank_account.verified",
      resource: "bank_account",
      resourceId: accountId,
      after: { pennyDropRef },
    });

    return updated;
  }

  static async softDelete(
    accountId: string,
    actorMeta: { actorId: string; ip: string },
  ) {
    const account = await bankAccountRepo.findByIdAndUser(
      accountId,
      actorMeta.actorId,
    );
    if (!account) throw ProfileErrors.BankAccount.notFound();
    if (account.isPrimary)
      throw ProfileErrors.BankAccount.cannotDeletePrimary();

    const deleted = await bankAccountRepo.softDelete(
      accountId,
      actorMeta.actorId,
    );

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "bank_account.deleted",
      resource: "bank_account",
      resourceId: accountId,
    });

    return deleted;
  }
}

// =============================================================================
// 4. KycDocumentService
// =============================================================================

export abstract class KycDocumentService {
  static async submit(
    data: {
      documentType: string;
      documentNumberEncrypted?: string;
      documentNumberLast4?: string;
      frontImageKey?: string;
      backImageKey?: string;
      selfieImageKey?: string;
      expiresAt?: Date;
    },
    actorMeta: { actorId: string; ip: string },
  ) {
    // Check for active submission of same type
    const existing = await kycRepo.findActiveByUserAndType(
      actorMeta.actorId,
      data.documentType as any,
    );
    if (existing) throw ProfileErrors.KycDocument.activeExists();

    const doc = await kycRepo.create({
      userId: actorMeta.actorId,
      documentType: data.documentType as any,
      documentNumberEncrypted: data.documentNumberEncrypted,
      documentNumberLast4: data.documentNumberLast4,
      frontImageKey: data.frontImageKey,
      backImageKey: data.backImageKey,
      selfieImageKey: data.selfieImageKey,
      expiresAt: data.expiresAt,
    });

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "kyc.submitted",
      resource: "kyc_document",
      resourceId: doc.id,
      after: { documentType: data.documentType },
    });

    return doc;
  }

  static async review(
    docId: string,
    decision: {
      status: "verified" | "rejected" | "under_review";
      rejectionReason?: string;
    },
    meta: AdminMeta,
  ) {
    requireAdmin(meta.actorRoles);

    const doc = await kycRepo.findById(docId);
    if (!doc) throw ProfileErrors.KycDocument.notFound();

    // Validate status transition
    const allowedTo = KYC_TRANSITIONS[doc.status];
    if (!allowedTo || !allowedTo.includes(decision.status)) {
      throw ProfileErrors.KycDocument.invalidTransition(
        doc.status,
        decision.status,
      );
    }

    if (decision.status === "rejected" && !decision.rejectionReason) {
      throw ProfileErrors.KycDocument.rejectionReasonRequired();
    }

    const reviewed = await db.transaction(async (tx) => {
      const txKycRepo = new KycDocumentRepository(tx as unknown as typeof db);
      const txShopOwnerRepo = new ShopOwnerProfileRepository(
        tx as unknown as typeof db,
      );
      const txDpRepo = new DeliveryPartnerProfileRepository(
        tx as unknown as typeof db,
      );

      const updated = await txKycRepo.review(
        docId,
        meta.actorId,
        decision.status,
        decision.rejectionReason,
      );

      // Denormalise KYC status onto profile if verified
      if (decision.status === "verified") {
        const businessDocs = ["gst_certificate", "business_registration"];
        const partnerDocs = ["driving_license"];

        const isBusinessDoc = businessDocs.includes(doc.documentType);
        const isPartnerDoc = partnerDocs.includes(doc.documentType);
        const isPersonalDoc = !isBusinessDoc && !isPartnerDoc;

        if (isBusinessDoc || isPersonalDoc) {
          await txShopOwnerRepo.updateKycStatus(doc.userId, "verified");
        }
        if (isPartnerDoc || isPersonalDoc) {
          await txDpRepo.updateKycStatus(doc.userId, "verified");
        }
      }

      return updated;
    });

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: `kyc.${decision.status}`,
      resource: "kyc_document",
      resourceId: docId,
      before: { status: doc.status },
      after: {
        status: decision.status,
        rejectionReason: decision.rejectionReason,
      },
    });

    return reviewed;
  }

  static async listByUser(
    userId: string,
    pagination: Pagination,
    actorMeta: ActorMeta,
  ) {
    requireOwnerOrAdmin(userId, actorMeta.actorId, actorMeta.actorRoles);
    return kycRepo.listByUser(userId, pagination);
  }

  static async listPending(pagination: Pagination, meta: AdminMeta) {
    requireAdmin(meta.actorRoles);
    return kycRepo.listByStatus("pending", pagination);
  }
}

// =============================================================================
// 5. AddressService
// =============================================================================

export abstract class AddressService {
  static async create(
    data: {
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
    actorMeta: { actorId: string; ip: string },
  ) {
    // Validate city exists
    const city = await cityRepo.findById(data.cityId);
    if (!city) throw PlatformErrors.City.notFound();

    // Enforce serviceability boundaries
    const serviceability = await PincodeService.checkServiceability({
      type: "coordinates",
      latitude: data.latitude,
      longitude: data.longitude,
    });

    if (!serviceability.serviceable) {
      throw PlatformErrors.Pincode.notServiceable(
        "This address does not fall within our serviceable delivery zones.",
      );
    }

    const address = await db.transaction(async (tx) => {
      const txAddrRepo = new AddressRepository(tx as unknown as typeof db);

      // Check if user has any non-deleted addresses
      const existingAddresses = await txAddrRepo.listByUser(actorMeta.actorId);
      const isFirst = existingAddresses.length === 0;

      const created = await txAddrRepo.create({
        userId: actorMeta.actorId,
        label: (data.label as any) ?? "home",
        customLabel: data.customLabel,
        line1: data.line1,
        line2: data.line2,
        landmark: data.landmark,
        cityId: data.cityId,
        pincode: data.pincode,
        state: data.state,
        country: data.country ?? "India",
        isDefault: isFirst,
      });

      // Compute H3 indexes
      const h3 = coordsToH3Multi(data.latitude, data.longitude);

      // Synchronously set location and serviceability.
      const updated = await txAddrRepo.setLocation(
        created.id,
        data.latitude,
        data.longitude,
        true, // Already validated via PincodeService above
        h3,
      );

      return updated || created;
    });

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "address.created",
      resource: "address",
      resourceId: address.id,
      after: { label: address.label, pincode: address.pincode },
    });

    return address;
  }

  static async update(
    addressId: string,
    data: {
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
    actorMeta: { actorId: string; ip: string },
  ) {
    const address = await addressRepo.findByIdAndUser(
      addressId,
      actorMeta.actorId,
    );
    if (!address) throw ProfileErrors.Address.notFound();

    const updated = await db.transaction(async (tx) => {
      const txAddrRepo = new AddressRepository(tx as unknown as typeof db);

      // We need to pass data as any since it strips lat/lng
      const { latitude, longitude, ...rest } = data as any;
      const res = await txAddrRepo.update(addressId, rest);
      if (!res) throw ProfileErrors.Address.notFound();

      // Update location if coordinates were provided
      if (latitude !== undefined && longitude !== undefined) {
        // Enforce serviceability boundaries on update
        const serviceability = await PincodeService.checkServiceability({
          type: "coordinates",
          latitude,
          longitude,
        });

        if (!serviceability.serviceable) {
          throw PlatformErrors.Pincode.notServiceable(
            "The updated location does not fall within our serviceable delivery zones.",
          );
        }

        // Compute H3 indexes
        const h3 = coordsToH3Multi(latitude, longitude);

        await txAddrRepo.setLocation(addressId, latitude, longitude, true, h3);
      }

      return res;
    });

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "address.updated",
      resource: "address",
      resourceId: addressId,
    });

    return updated;
  }

  static async setDefault(
    addressId: string,
    actorMeta: { actorId: string; ip: string },
  ) {
    const address = await addressRepo.findByIdAndUser(
      addressId,
      actorMeta.actorId,
    );
    if (!address) throw ProfileErrors.Address.notFound();

    const updated = await db.transaction(async (tx) => {
      const txAddrRepo = new AddressRepository(tx as unknown as typeof db);
      return txAddrRepo.setDefault(addressId, actorMeta.actorId);
    });

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "address.set_default",
      resource: "address",
      resourceId: addressId,
    });

    return updated;
  }

  static async softDelete(
    addressId: string,
    actorMeta: { actorId: string; ip: string },
  ) {
    const address = await addressRepo.findByIdAndUser(
      addressId,
      actorMeta.actorId,
    );
    if (!address) throw ProfileErrors.Address.notFound();

    // Cannot delete the default if user has other addresses
    if (address.isDefault) {
      const allAddresses = await addressRepo.listByUser(actorMeta.actorId);
      if (allAddresses.length > 1) {
        throw ProfileErrors.Address.cannotDeleteDefault();
      }
    }

    const deleted = await addressRepo.softDelete(addressId, actorMeta.actorId);

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "address.deleted",
      resource: "address",
      resourceId: addressId,
    });

    return deleted;
  }

  static async getById(
    addressId: string,
    actorMeta: { actorId: string; ip: string },
  ) {
    const address = await addressRepo.findByIdAndUser(
      addressId,
      actorMeta.actorId,
    );
    if (!address) throw ProfileErrors.Address.notFound();
    return address;
  }

  static async listByUser(userId: string, actorMeta: ActorMeta) {
    requireOwnerOrAdmin(userId, actorMeta.actorId, actorMeta.actorRoles);
    return addressRepo.listByUser(userId);
  }
}

// =============================================================================
// 6. ShopOwnerService
// =============================================================================

export abstract class ShopOwnerService {
  static async onboard(
    data: {
      businessName?: string;
      businessType?: string;
      tradeName?: string;
    },
    actorMeta: { actorId: string; ip: string },
  ) {
    // Idempotent — return existing profile if already onboarded
    const existing = await shopOwnerRepo.findByUserId(actorMeta.actorId);
    if (existing) return existing;

    const profile = await db.transaction(async (tx) => {
      const txShopOwnerRepo = new ShopOwnerProfileRepository(
        tx as unknown as typeof db,
      );
      const txRoleRepo = new RoleRepository(tx as unknown as typeof db);
      const txUserRoleRepo = new UserRoleRepository(tx as unknown as typeof db);

      const created = await txShopOwnerRepo.create({
        userId: actorMeta.actorId,
        businessName: data.businessName,
        businessType: data.businessType,
        tradeName: data.tradeName,
      });

      if (!created) {
        // onConflictDoNothing returned null — fetch existing
        const found = await txShopOwnerRepo.findByUserId(actorMeta.actorId);
        return found!;
      }

      // Assign shopkeeper role
      const role = await txRoleRepo.findBySlug("shopkeeper");
      if (role) {
        await txUserRoleRepo.assign({
          userId: actorMeta.actorId,
          roleId: role.id,
        });
      }

      return created;
    });

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "shop_owner.onboarded",
      resource: "shop_owner_profile",
      resourceId: profile.id,
    });

    return profile;
  }

  static async getProfile(userId: string) {
    const profile = await shopOwnerRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.ShopOwner.notFound();
    return profile;
  }

  static async update(
    data: {
      businessName?: string;
      businessType?: string;
      tradeName?: string;
      primaryBankAccountId?: string;
      metadata?: Record<string, unknown>;
    },
    actorMeta: { actorId: string; ip: string },
  ) {
    const existing = await shopOwnerRepo.findByUserId(actorMeta.actorId);
    if (!existing) throw ProfileErrors.ShopOwner.notFound();

    // Validate bank account FK if changing
    if (data.primaryBankAccountId) {
      const account = await bankAccountRepo.findByIdAndUser(
        data.primaryBankAccountId,
        actorMeta.actorId,
      );
      if (!account) throw ProfileErrors.BankAccount.notFound();
    }

    const updated = await shopOwnerRepo.update(actorMeta.actorId, data as any);
    if (!updated) throw ProfileErrors.ShopOwner.notFound();

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "shop_owner.updated",
      resource: "shop_owner_profile",
      resourceId: existing.id,
    });

    return updated;
  }

  static async suspend(userId: string, reason: string, meta: AdminMeta) {
    requireAdmin(meta.actorRoles);

    const profile = await shopOwnerRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.ShopOwner.notFound();

    const suspended = await shopOwnerRepo.suspend(userId, reason);

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "shop_owner.suspended",
      resource: "shop_owner_profile",
      resourceId: profile.id,
      after: { reason },
    });

    return suspended;
  }

  static async unsuspend(userId: string, meta: AdminMeta) {
    requireAdmin(meta.actorRoles);

    const profile = await shopOwnerRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.ShopOwner.notFound();

    const unsuspended = await shopOwnerRepo.unsuspend(userId);

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "shop_owner.unsuspended",
      resource: "shop_owner_profile",
      resourceId: profile.id,
    });

    return unsuspended;
  }
}

// =============================================================================
// 7. DeliveryPartnerService
// =============================================================================

export abstract class DeliveryPartnerService {
  static async onboard(
    data: {
      vehicleType?: string;
      vehicleNumber?: string;
      licenseNumber: string;
      cityId: string;
    },
    actorMeta: { actorId: string; ip: string },
  ) {
    // Validate city
    const city = await cityRepo.findById(data.cityId);
    if (!city) throw PlatformErrors.City.notFound();

    // Check license uniqueness
    const existingLicense = await dpRepo.findByLicenseNumber(
      data.licenseNumber,
    );
    if (existingLicense && existingLicense.userId !== actorMeta.actorId) {
      throw ProfileErrors.DeliveryPartner.licenseConflict();
    }

    // Idempotent
    const existing = await dpRepo.findByUserId(actorMeta.actorId);
    if (existing) return existing;

    const profile = await db.transaction(async (tx) => {
      const txDpRepo = new DeliveryPartnerProfileRepository(
        tx as unknown as typeof db,
      );
      const txRoleRepo = new RoleRepository(tx as unknown as typeof db);
      const txUserRoleRepo = new UserRoleRepository(tx as unknown as typeof db);

      const created = await txDpRepo.create({
        userId: actorMeta.actorId,
        vehicleType: (data.vehicleType as any) ?? "motorcycle",
        vehicleNumber: data.vehicleNumber,
        licenseNumber: data.licenseNumber.toUpperCase(),
        cityId: data.cityId,
      });

      if (!created) {
        const found = await txDpRepo.findByUserId(actorMeta.actorId);
        return found!;
      }

      // Assign delivery_partner role
      const role = await txRoleRepo.findBySlug("delivery_partner");
      if (role) {
        await txUserRoleRepo.assign({
          userId: actorMeta.actorId,
          roleId: role.id,
        });
      }

      return created;
    });

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "delivery_partner.onboarded",
      resource: "delivery_partner_profile",
      resourceId: profile.id,
      after: { licenseNumber: data.licenseNumber, cityId: data.cityId },
    });

    return profile;
  }

  static async getProfile(userId: string) {
    const profile = await dpRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.DeliveryPartner.notFound();

    const ratingAverage =
      profile.ratingCount > 0
        ? Math.round((profile.ratingSum / profile.ratingCount) * 100) / 100
        : null;

    return { ...profile, ratingAverage };
  }

  static async update(
    data: {
      vehicleType?: string;
      vehicleNumber?: string;
      cityId?: string;
      primaryBankAccountId?: string;
      metadata?: Record<string, unknown>;
    },
    actorMeta: { actorId: string; ip: string },
  ) {
    const existing = await dpRepo.findByUserId(actorMeta.actorId);
    if (!existing) throw ProfileErrors.DeliveryPartner.notFound();

    if (data.cityId) {
      const city = await cityRepo.findById(data.cityId);
      if (!city) throw PlatformErrors.City.notFound();
    }

    if (data.primaryBankAccountId) {
      const account = await bankAccountRepo.findByIdAndUser(
        data.primaryBankAccountId,
        actorMeta.actorId,
      );
      if (!account) throw ProfileErrors.BankAccount.notFound();
    }

    const updated = await dpRepo.update(actorMeta.actorId, data as any);
    if (!updated) throw ProfileErrors.DeliveryPartner.notFound();

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "delivery_partner.updated",
      resource: "delivery_partner_profile",
      resourceId: existing.id,
    });

    return updated;
  }

  static async suspend(userId: string, reason: string, meta: AdminMeta) {
    requireAdmin(meta.actorRoles);

    const profile = await dpRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.DeliveryPartner.notFound();

    const suspended = await dpRepo.suspend(userId, reason);

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "delivery_partner.suspended",
      resource: "delivery_partner_profile",
      resourceId: profile.id,
      after: { reason },
    });

    return suspended;
  }

  static async unsuspend(userId: string, meta: AdminMeta) {
    requireAdmin(meta.actorRoles);

    const profile = await dpRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.DeliveryPartner.notFound();

    const unsuspended = await dpRepo.unsuspend(userId);

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "delivery_partner.unsuspended",
      resource: "delivery_partner_profile",
      resourceId: profile.id,
    });

    return unsuspended;
  }

  static async appendRating(userId: string, rating: number) {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw ProfileErrors.DeliveryPartner.invalidRating();
    }

    const updated = await dpRepo.appendRating(userId, rating);
    if (!updated) throw ProfileErrors.DeliveryPartner.notFound();
    return updated;
  }

  static async recordDelivery(userId: string, earningsPaise: bigint) {
    if (earningsPaise < BigInt(0)) {
      throw ProfileErrors.Common.validation(
        "Earnings amount must be non-negative",
      );
    }

    const updated = await dpRepo.recordDelivery(userId, earningsPaise);
    if (!updated) throw ProfileErrors.DeliveryPartner.notFound();
    return updated;
  }
}

// =============================================================================
// 8. CustomerService
// =============================================================================

export abstract class CustomerService {
  /** Idempotent — returns existing or creates a new customer profile. */
  static async getOrCreate(userId: string) {
    const existing = await customerRepo.findByUserId(userId);
    if (existing) return existing;

    const created = await customerRepo.create({ userId });
    // onConflictDoNothing — race-safe
    if (!created) {
      return (await customerRepo.findByUserId(userId))!;
    }
    return created;
  }

  static async getProfile(userId: string) {
    const profile = await customerRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.Customer.notFound();
    return profile;
  }

  static async updatePreferences(
    preferences: Record<string, unknown>,
    actorMeta: { actorId: string; ip: string },
  ) {
    let profile = await customerRepo.findByUserId(actorMeta.actorId);
    if (!profile) {
      // Auto-create customer profile
      profile = await CustomerService.getOrCreate(actorMeta.actorId);
    }

    const updated = await customerRepo.update(actorMeta.actorId, {
      preferences,
    });

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action: "customer.preferences_updated",
      resource: "customer_profile",
      resourceId: profile.id,
    });

    return updated;
  }

  static async adjustLoyalty(
    userId: string,
    delta: number,
    actorMeta: { actorId: string; ip: string },
  ) {
    const profile = await customerRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.Customer.notFound();

    // Verify sufficient points for debit
    if (delta < 0 && profile.loyaltyPoints + delta < 0) {
      throw ProfileErrors.Customer.insufficientPoints();
    }

    const updated = await customerRepo.adjustLoyaltyPoints(userId, delta);

    await auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      action:
        delta >= 0 ? "customer.loyalty_credited" : "customer.loyalty_debited",
      resource: "customer_profile",
      resourceId: profile.id,
      after: { delta },
    });

    return updated;
  }

  /** Called by order event handlers — atomic stat update. */
  static async recordOrder(userId: string, amountPaise: bigint) {
    let profile = await customerRepo.findByUserId(userId);
    if (!profile) {
      profile = await CustomerService.getOrCreate(userId);
    }
    return customerRepo.recordOrder(userId, amountPaise);
  }
}

// =============================================================================
// 9. CompositeProfileService
// =============================================================================

export abstract class CompositeProfileService {
  /** Returns the full aggregated profile for the authenticated user. */
  static async getFullProfile(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw ProfileErrors.Common.validation("User not found");

    const [shopOwner, deliveryPartner, customer, addresses, bankAccounts] =
      await Promise.all([
        shopOwnerRepo.findByUserId(userId),
        dpRepo.findByUserId(userId),
        customerRepo.findByUserId(userId),
        addressRepo.listByUser(userId),
        bankAccountRepo.listByUser(userId),
      ]);

    // Compute rating average for delivery partner
    let dpWithRating = null;
    if (deliveryPartner) {
      const ratingAverage =
        deliveryPartner.ratingCount > 0
          ? Math.round(
            (deliveryPartner.ratingSum / deliveryPartner.ratingCount) * 100,
          ) / 100
          : null;
      dpWithRating = { ...deliveryPartner, ratingAverage };
    }

    // Strip internal-only fields before returning to the user
    const shopOwnerPublic = shopOwner
      ? (() => {
        const {
          isSuspended: _s,
          suspendedAt: _sa,
          suspensionReason: _sr,
          primaryBankAccountId: _pb,
          metadata: _m,
          ...rest
        } = shopOwner;
        return rest;
      })()
      : null;

    const customerPublic = customer
      ? (() => {
        const { metadata: _m, referralCodeId: _r, ...rest } = customer;
        return rest;
      })()
      : null;

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
      shopOwner: shopOwnerPublic,
      deliveryPartner: dpWithRating,
      customer: customerPublic,
      addresses,
      bankAccounts: bankAccounts.map(
        ({ accountNumberEncrypted: _, pennyDropRef: _p, ...rest }) => rest,
      ),
    };
  }
}
