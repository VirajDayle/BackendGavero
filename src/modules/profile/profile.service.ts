/**
 * profile.service.ts
 *
 * All business logic for the profile domain.
 * Calls repositories for DB access — never touches HTTP.
 *
 * Key decisions reflected here:
 * - KYC document type resolved via DocumentTypeRepository (slug → UUID)
 *   never via hardcoded enum strings in DB queries
 * - ROLE_REQUIRED_DOCS map eliminated — role requirements come from DB
 *   via KycRoleRequirementRepository
 * - kycStatus removed from role profile tables — always read from kycProfileTable
 * - Audit logs written after tx commits — never inside transactions
 * - onDocumentUpdated() always runs inside the caller's transaction
 */

import crypto from "crypto";
import { sql, AnyColumn } from "drizzle-orm";

import {
  AddressRepository,
  BankAccountRepository,
  CustomerProfileRepository,
  DeliveryPartnerProfileRepository,
  DocumentTypeRepository,
  KycDocumentRepository,
  KycProfileRepository,
  KycReviewRepository,
  KycRoleRequirementRepository,
  ShopOwnerProfileRepository,
} from "./profile.repository";

import {
  AuditLogRepository,
  RoleRepository,
  UserRoleRepository,
} from "../auth/auth.repository";

import { CityRepository } from "../platform/platform.repository";

import { UserRepository } from "../auth/auth.repository";

import {
  mapManualDrivingLicenseResult,
  mapManualPanResult,
} from "./profile.schema";

import type {
  AddBankAccountRequest,
  AddressLabelType,
  BankAccountType,
  CreateAddressRequest,
  UpdateAddressRequest,
  KycDocumentFilter,
  RoleType,
  VerifyDrivingLicenseRequest,
  VerifyPanRequest,
  UpdateShopOwnerRequest,
  DeliveryPartnerOnboardRequest,
  VehicleType,
  UpdateDeliveryPartnerRequest,
} from "./profile.schema";

import type { DB } from "../../db";
import { encrypt, decrypt } from "../../utils/crypto";
import { ProfileErrors } from "./profile.errors";
import { BankVerificationFactory } from "../../providers/verification/bank/bank.factory";
import { IdentityVerificationFactory } from "../../providers/verification/identity/identity.factory";
import { db } from "../../db";

import { BANK_ACCOUNT_LIMIT, Pagination, ROLES } from "../../shared";
import { AuthErrors } from "../auth/auth.errors";
import { AuthService } from "../auth/auth.service";
import { roleCache } from "../../lib/role-cache";
import { ServiceableZoneService } from "../platform/platform.service";
import { PlatformErrors } from "../platform/platform.errors";
import { coordsToH3Multi } from "../../utils/h3";

// =============================================================================
// Shared types
// =============================================================================

export type ActorMeta = {
  actorId: string;
  actorRoles: RoleType[];
  ip: string;
};

export type AdminMeta = ActorMeta;

export interface ProfileRepositories {
  auditRepo: AuditLogRepository;
  bankAccountRepo: BankAccountRepository;
  kycRepo: KycDocumentRepository;
  kycProfileRepo: KycProfileRepository;
  kycReviewRepo: KycReviewRepository;
  kycRequirementRepo: KycRoleRequirementRepository;
  documentTypeRepo: DocumentTypeRepository;
  addressRepo: AddressRepository;
  shopOwnerRepo: ShopOwnerProfileRepository;
  dpRepo: DeliveryPartnerProfileRepository;
  customerRepo: CustomerProfileRepository;
  cityRepo: CityRepository;
  userRepo: UserRepository;
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. Bank Account Service
// ═════════════════════════════════════════════════════════════════════════════

export class BankAccountServiceImpl {
  constructor(
    private readonly repos: ProfileRepositories,
    private readonly db: DB,
  ) { }

  async add(data: AddBankAccountRequest, actorMeta: ActorMeta) {
    const accountNumberLast4 = data.accountNumber.slice(-4);
    const ifscUpper = data.ifscCode.toUpperCase();

    // 1. Duplicate check — decrypt each stored account and compare plaintext
    //    TODO: replace with HMAC-based deduplication to avoid O(n) decrypt loop
    const existingAccounts = await this.repos.bankAccountRepo.listByUser(
      actorMeta.actorId,
    );

    for (const acc of existingAccounts) {
      const decrypted = await decrypt(acc.accountNumberEncrypted);
      if (decrypted === data.accountNumber) {
        throw ProfileErrors.BankAccount.alreadyExists();
      }
    }

    // 2. Per-user limit
    if (existingAccounts.length >= BANK_ACCOUNT_LIMIT) {
      throw ProfileErrors.BankAccount.limitExceeded();
    }

    // 3. External verification
    const verifier = BankVerificationFactory.getAccountVerifier();
    const verifyResult = await verifier.verify(
      data.accountNumber,
      ifscUpper,
      data.accountHolderName,
    );

    if (verifyResult.accountStatus !== "VALID") {
      await this.repos.auditRepo.create({
        actorId: actorMeta.actorId,
        actorIp: actorMeta.ip,
        actorRole: actorMeta.actorRoles[0] ?? null,
        action: "bank_account:add:verification_failed",
        resource: "bank_account",
        metadata: {
          statusCode: verifyResult.accountStatusCode,
          ifsc: ifscUpper,
          last4: accountNumberLast4,
        },
      });
      throw ProfileErrors.BankAccount.verificationFailed(
        `Bank account verification failed: ${verifyResult.accountStatusCode}`,
      );
    }

    const accountNumberEncrypted = await encrypt(data.accountNumber);
    const verificationId = crypto.randomUUID();

    // 4. Persist inside transaction
    const created = await this.db.transaction(async (tx) => {
      const txBankRepo = new BankAccountRepository(tx as unknown as DB);
      const isFirst = existingAccounts.length === 0;

      const account = await txBankRepo.create({
        userId: actorMeta.actorId,
        accountHolderName: verifyResult.accountHolderName,
        accountNumberEncrypted,
        accountNumberLast4,
        ifscCode: verifyResult.ifscCode || ifscUpper,
        bankName: verifyResult.bankName,
        branchName: verifyResult.branchName ?? verifyResult.ifscDetails?.branch,
        isPrimary: isFirst || !!data.setAsPrimary,
        isVerified: false,
        verifiedAt: null,
        verificationId,
      });

      // If this should be primary but isn't the first, unset the old primary
      if (account.isPrimary && !isFirst) {
        await txBankRepo.setPrimary(account.id, actorMeta.actorId);
      }

      return account;
    });

    // 5. Audit after tx commits
    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] ?? null,
      action: "bank_account:add",
      resource: "bank_account",
      resourceId: created.id,
      metadata: {
        referenceId: verifyResult.referenceId,
        bankName: verifyResult.bankName,
        nameMatchResult: verifyResult.nameMatchResult,
      },
    });

    return created;
  }

  async initiatePennyDrop(accountId: string, actorMeta: ActorMeta) {
    // Ownership check — never trust caller-supplied accountId blindly
    const account = await this.repos.bankAccountRepo.findByIdAndUser(
      accountId,
      actorMeta.actorId,
    );
    if (!account) throw ProfileErrors.BankAccount.notFound();
    if (account.isVerified) throw ProfileErrors.BankAccount.alreadyVerified();

    const provider = BankVerificationFactory.getPennyDropProvider();
    const result = await provider.initiate(
      account.verificationId,
      account.accountHolderName,
    );

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] ?? null,
      action: "bank_account:penny_drop:initiate",
      resource: "bank_account",
      resourceId: account.id,
      metadata: { refId: result.refId },
    });

    return result;
  }

  async confirmPennyDrop(accountId: string, actorMeta: ActorMeta) {
    // Ownership check — verificationId always fetched from DB, never from caller
    const account = await this.repos.bankAccountRepo.findByIdAndUser(
      accountId,
      actorMeta.actorId,
    );
    if (!account) throw ProfileErrors.BankAccount.notFound();
    if (account.isVerified) throw ProfileErrors.BankAccount.alreadyVerified();

    const provider = BankVerificationFactory.getPennyDropProvider();
    const status = await provider.getStatus(account.verificationId);

    if (status.status === "PENDING")
      throw ProfileErrors.BankAccount.pennyDropPending();
    if (status.status === "FAILED") {
      throw ProfileErrors.BankAccount.verificationFailed(
        "Penny drop payment failed. Please try again.",
      );
    }

    const decryptedAccountNumber = await decrypt(
      account.accountNumberEncrypted,
    );
    const accountMatch = status.bankAccount
      ? status.bankAccount === decryptedAccountNumber
      : true;
    const ifscMatch = status.ifsc
      ? status.ifsc.toUpperCase() === account.ifscCode.toUpperCase()
      : true;

    if (!accountMatch || !ifscMatch) {
      await this.repos.auditRepo.create({
        actorId: actorMeta.actorId,
        actorIp: actorMeta.ip,
        actorRole: actorMeta.actorRoles[0] ?? null,
        action: "bank_account:penny_drop:mismatch",
        resource: "bank_account",
        resourceId: account.id,
        metadata: { accountMatch, ifscMatch },
      });
      throw ProfileErrors.BankAccount.pennyDropMismatch();
    }

    const updated = await this.repos.bankAccountRepo.markVerified(
      account.id,
      account.verificationId,
      status.accountType as BankAccountType,
    );
    if (!updated) throw ProfileErrors.BankAccount.notFound();

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] ?? null,
      action: "bank_account:penny_drop:confirmed",
      resource: "bank_account",
      resourceId: account.id,
      metadata: { nameMatchResult: status.nameMatchResult },
    });

    return updated;
  }

  async listByUser(userId: string, includeDeleted: boolean) {
    return this.repos.bankAccountRepo.listByUser(userId, { includeDeleted });
  }

  async setPrimary(id: string, actorMeta: ActorMeta) {
    const account = await this.repos.bankAccountRepo.findByIdAndUser(
      id,
      actorMeta.actorId,
    );
    if (!account) throw ProfileErrors.BankAccount.notFound();

    await this.repos.bankAccountRepo.setPrimary(id, actorMeta.actorId);

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] ?? null,
      action: "bank_account:set_primary",
      resource: "bank_account",
      resourceId: id,
    });
  }

  async softDelete(id: string, actorMeta: ActorMeta) {
    const account = await this.repos.bankAccountRepo.findByIdAndUser(
      id,
      actorMeta.actorId,
    );
    if (!account) throw ProfileErrors.BankAccount.notFound();

    await this.repos.bankAccountRepo.softDelete(id, actorMeta.actorId);

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] ?? null,
      action: "bank_account:delete",
      resource: "bank_account",
      resourceId: id,
    });
  }

  async handleRpdWebhookEvent(
    eventType:
      | "RPD_BANK_ACCOUNT_VERIFICATION_SUCCESS"
      | "RPD_BANK_ACCOUNT_VERIFICATION_EXPIRED"
      | "RPD_BANK_ACCOUNT_VERIFICATION_FAILURE",
    verificationId: string,
    extraMeta: {
      utr?: string;
      nameAtBank?: string;
      nameMatchResult?: string;
      reversalStatus?: string;
      accountType?: string;
      status: string;
    },
  ): Promise<void> {
    const account =
      await this.repos.bankAccountRepo.findByVerificationId(verificationId);
    if (!account) return; // unknown or test event

    const auditAction =
      eventType === "RPD_BANK_ACCOUNT_VERIFICATION_SUCCESS"
        ? "bank_account:penny_drop:webhook_success"
        : eventType === "RPD_BANK_ACCOUNT_VERIFICATION_EXPIRED"
          ? "bank_account:penny_drop:webhook_expired"
          : "bank_account:penny_drop:webhook_failure";

    if (eventType !== "RPD_BANK_ACCOUNT_VERIFICATION_SUCCESS") {
      await this.repos.auditRepo.create({
        actorId: account.userId,
        actorIp: "cashfree-webhook",
        actorRole: ROLES.SYSTEM,
        action: auditAction,
        resource: "bank_account",
        resourceId: account.id,
        metadata: { verificationId, status: extraMeta.status, eventType },
      });
      return;
    }

    if (account.isVerified) return; // idempotent skip

    const resolvedType = ((): BankAccountType => {
      const t = (extraMeta.accountType ?? "").toLowerCase();
      if (t === "current") return "current";
      if (t === "salary") return "salary";
      return "savings";
    })();

    const updated = await this.repos.bankAccountRepo.markVerified(
      account.id,
      verificationId,
      resolvedType,
    );
    if (!updated) return; // concurrent soft-delete race

    await this.repos.auditRepo.create({
      actorId: account.userId,
      actorIp: "cashfree-webhook",
      actorRole: "system",
      action: auditAction,
      resource: "bank_account",
      resourceId: account.id,
      metadata: {
        verificationId,
        utr: extraMeta.utr,
        nameAtBank: extraMeta.nameAtBank,
        nameMatchResult: extraMeta.nameMatchResult,
        reversalStatus: extraMeta.reversalStatus,
      },
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. KYC Document Service
// ═════════════════════════════════════════════════════════════════════════════

export class KycDocumentServiceImpl {
  constructor(
    private readonly repos: ProfileRepositories,
    private readonly db: DB,
  ) { }

  async verifyPan(data: VerifyPanRequest, actorMeta: ActorMeta) {
    // Resolve document type slug → UUID once before the transaction
    const docType = await this.repos.documentTypeRepo.findBySlug("pan");
    if (!docType) throw ProfileErrors.KycDocument.documentTypeNotFound("pan");

    const verifier = IdentityVerificationFactory.getPanVerifier();
    const verificationId = crypto.randomUUID();

    const result = await verifier.verify(
      data.pan,
      verificationId,
      data.name,
      data.dob.toString().split("T")[0],
    );

    let shouldStale = false;
    let affectedRoleIds: string[] = [];

    await this.db.transaction(async (tx) => {
      const txKycRepo = new KycDocumentRepository(tx as unknown as DB);

      const existingDocs = await txKycRepo.listByUserFilter(actorMeta.actorId, {
        status: ["under_review", "verified"],
        documentTypeId: docType.id,
      });

      const verifiedDoc = existingDocs.find((d) => d.status === "verified");
      const underReviewDocs = existingDocs.filter(
        (d) => d.status === "under_review",
      );

      const mapped = await mapManualPanResult(
        actorMeta.actorId,
        docType.id,
        data,
        result,
      );

      if (mapped.status === "verified") {
        for (const doc of existingDocs) {
          await txKycRepo.update(doc.id, { status: "superseded" });
        }
        if (verifiedDoc) shouldStale = true;
      } else if (mapped.status === "under_review") {
        for (const doc of underReviewDocs) {
          await txKycRepo.update(doc.id, { status: "superseded" });
        }
      }

      await txKycRepo.create(mapped);

      if (shouldStale) {
        affectedRoleIds = await this.onDocumentUpdated(
          tx as unknown as DB,
          actorMeta,
          docType.id,
        );
      }
    });

    // Audit after tx commits
    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] ?? null,
      action: "kyc:verify_pan",
      resource: "kyc_document",
      metadata: { pan: data.pan, status: result.status, verificationId },
    });

    if (affectedRoleIds.length > 0) {
      await this.repos.auditRepo.create({
        actorId: actorMeta.actorId,
        actorIp: actorMeta.ip,
        actorRole: actorMeta.actorRoles[0] ?? null,
        action: "kyc:document_updated",
        resource: "kyc_document",
        metadata: { documentTypeSlug: "pan", affectedRoleIds },
      });
    }

    return result;
  }

  async verifyDrivingLicense(
    data: VerifyDrivingLicenseRequest,
    actorMeta: ActorMeta,
  ) {
    const docType =
      await this.repos.documentTypeRepo.findBySlug("driving_license");
    if (!docType)
      throw ProfileErrors.KycDocument.documentTypeNotFound("driving_license");

    const verifier = IdentityVerificationFactory.getDrivingLicenseVerifier();
    const verificationId = crypto.randomUUID();

    const result = await verifier.verify(
      data.dlNumber,
      data.dob,
      verificationId,
    );

    let shouldStale = false;
    let affectedRoleIds: string[] = [];

    await this.db.transaction(async (tx) => {
      const txKycRepo = new KycDocumentRepository(tx as unknown as DB);

      const existingDocs = await txKycRepo.listByUserFilter(actorMeta.actorId, {
        status: ["under_review", "verified"],
        documentTypeId: docType.id,
      });

      const verifiedDoc = existingDocs.find((d) => d.status === "verified");
      const underReviewDocs = existingDocs.filter(
        (d) => d.status === "under_review",
      );

      const mapped = await mapManualDrivingLicenseResult(
        actorMeta.actorId,
        docType.id,
        data,
        result,
      );

      if (mapped.status === "verified") {
        for (const doc of existingDocs) {
          await txKycRepo.update(doc.id, { status: "superseded" });
        }
        if (verifiedDoc) shouldStale = true;
      } else if (mapped.status === "under_review") {
        for (const doc of underReviewDocs) {
          await txKycRepo.update(doc.id, { status: "superseded" });
        }
      }

      await txKycRepo.create(mapped);

      if (shouldStale) {
        affectedRoleIds = await this.onDocumentUpdated(
          tx as unknown as DB,
          actorMeta,
          docType.id,
        );
      }
    });

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] ?? null,
      action: "kyc:verify_dl",
      resource: "kyc_document",
      metadata: {
        dlNumber: data.dlNumber,
        status: result.status,
        verificationId,
      },
    });

    if (affectedRoleIds.length > 0) {
      await this.repos.auditRepo.create({
        actorId: actorMeta.actorId,
        actorIp: actorMeta.ip,
        actorRole: actorMeta.actorRoles[0] ?? null,
        action: "kyc:document_updated",
        resource: "kyc_document",
        metadata: { documentTypeSlug: "driving_license", affectedRoleIds },
      });
    }

    return result;
  }

  async submitForReview(actorMeta: ActorMeta, role: RoleType) {
    const roleId = roleCache.getId(role);
    // 1. Ensure user actually has this role
    if (!actorMeta.actorRoles.includes(role)) {
      throw AuthErrors.Role.notFound(role);
    }

    // 2. Guard against duplicate active submissions for this role
    const existing = await this.repos.kycReviewRepo.findPendingByUserAndRole(
      actorMeta.actorId,
      roleId,
    );
    if (existing) throw ProfileErrors.KycDocument.reviewAlreadyExists();

    // 3. Fetch mandatory document type IDs for this role from DB
    const requirements =
      await this.repos.kycRequirementRepo.findByRoleId(roleId);
    const requiredDocTypeIds = requirements.map((r) => r.documentId);

    // 4. Fetch user's active documents
    const docs = await this.repos.kycRepo.listByUserFilter(actorMeta.actorId, {
      status: ["under_review", "verified"],
    });

    // 5. Check for missing mandatory documents
    const missingDocTypeIds = requiredDocTypeIds.filter(
      (typeId) => !docs.some((doc) => doc.documentTypeId === typeId),
    );
    if (missingDocTypeIds.length > 0) {
      throw ProfileErrors.KycDocument.missingDocuments(
        missingDocTypeIds.join(","),
      );
    }

    // 6. Human-readable review ID
    const reviewRequestId = `REV-${new Date().getFullYear()}-${crypto
      .randomInt(0, 1_000_000)
      .toString()
      .padStart(6, "0")}`;

    // 7. Create review + move profile to pending — atomically
    const review = await this.db.transaction(async (tx) => {
      const txReviewRepo = new KycReviewRepository(tx as unknown as DB);
      const txKycProfileRepo = new KycProfileRepository(tx as unknown as DB);

      const created = await txReviewRepo.create({
        userId: actorMeta.actorId,
        roleId,
        reviewRequestId,
        status: "pending",
        metadata: { submittedDocCount: docs.length },
      });

      // Upsert profile row — moves to pending so admin queue picks it up
      await txKycProfileRepo.upsert(actorMeta.actorId, roleId, "pending");

      return created;
    });

    // 8. Audit after tx commits
    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] ?? null,
      action: "kyc:submit_for_review",
      resource: "kyc_review",
      metadata: {
        reviewId: review.id,
        reviewRequestId,
        roleId,
        docCount: docs.length,
      },
    });

    return review;
  }

  async approveReview(reviewId: string, adminMeta: ActorMeta) {
    // Fast-fail before opening a transaction
    const review = await this.repos.kycReviewRepo.findById(reviewId);
    if (!review) throw ProfileErrors.KycReview.notFound(reviewId);
    if (review.status !== "pending") {
      throw ProfileErrors.KycReview.invalidTransition();
    }

    const requirements = await this.repos.kycRequirementRepo.findByRoleId(
      review.roleId,
    );
    const requiredDocTypeIds = requirements.map((r) => r.documentId);

    const resolvedProfileStatus = await this.db.transaction(async (tx) => {
      const txReviewRepo = new KycReviewRepository(tx as unknown as DB);
      const txProfileRepo = new KycProfileRepository(tx as unknown as DB);
      const txKycDocRepo = new KycDocumentRepository(tx as unknown as DB);

      // Consistent snapshot of user's verified docs inside tx
      const userDocs = await txKycDocRepo.listByUserFilter(review.userId, {
        status: ["verified"],
      });

      const missingDocTypeIds = requiredDocTypeIds.filter(
        (typeId) => !userDocs.some((doc) => doc.documentTypeId === typeId),
      );

      // IMPORTANT: If required docs are missing at approval time (e.g. user
      // re-submitted a doc that went under_review after submission), we surface
      // this as an explicit error to the admin rather than silently auto-rejecting.
      // The admin should use rejectReview() with an explicit reason instead.
      if (missingDocTypeIds.length > 0) {
        throw ProfileErrors.KycReview.missingDocumentsAtApproval(
          missingDocTypeIds,
        );
      }

      // Close the review row — stamp who approved and when
      await txReviewRepo.updateStatus(reviewId, "done", {
        reviewedBy: adminMeta.actorId,
      });

      // Update profile to verified
      await txProfileRepo.updateStatus(
        review.userId,
        review.roleId,
        "verified",
      );

      return "verified" as const;
    });

    await this.repos.auditRepo.create({
      actorId: adminMeta.actorId,
      actorIp: adminMeta.ip,
      actorRole: adminMeta.actorRoles[0] ?? null,
      action: "kyc:review_approved",
      resource: "kyc_review",
      metadata: {
        reviewId,
        userId: review.userId,
        roleId: review.roleId,
        resolvedProfileStatus,
      },
    });

    // Revoke existing tokens — user must re-auth to get updated KYC claims
    await AuthService.markTokensStale(review.userId, "kyc_approved");

    return { review, resolvedProfileStatus };
  }

  async rejectReview(
    reviewId: string,
    adminMeta: ActorMeta,
    rejectionReason: string,
    adminNotes?: string,
  ) {
    const review = await this.repos.kycReviewRepo.findById(reviewId);
    if (!review) throw ProfileErrors.KycReview.notFound(reviewId);
    if (review.status !== "pending") {
      throw ProfileErrors.KycReview.invalidTransition();
    }

    await this.db.transaction(async (tx) => {
      const txReviewRepo = new KycReviewRepository(tx as unknown as DB);
      const txProfileRepo = new KycProfileRepository(tx as unknown as DB);

      await txReviewRepo.updateStatus(reviewId, "rejected", {
        reviewedBy: adminMeta.actorId,
        rejectionReason,
        adminNotes,
      });

      await txProfileRepo.updateStatus(
        review.userId,
        review.roleId,
        "rejected",
      );
    });

    await this.repos.auditRepo.create({
      actorId: adminMeta.actorId,
      actorIp: adminMeta.ip,
      actorRole: adminMeta.actorRoles[0] ?? null,
      action: "kyc:review_rejected",
      resource: "kyc_review",
      metadata: {
        reviewId,
        userId: review.userId,
        roleId: review.roleId,
        rejectionReason,
        adminNotes,
      },
    });

    // Revoke tokens so user sees updated status on next login
    await AuthService.markTokensStale(review.userId, "kyc_rejected");

    return { review, resolvedProfileStatus: "rejected" as const };
  }

  // ---------------------------------------------------------------------------
  // Admin: Request more information (keeps review pending)
  // ---------------------------------------------------------------------------

  async requestMoreInfo(
    reviewId: string,
    adminMeta: ActorMeta,
    adminNotes: string,
  ) {
    const review = await this.repos.kycReviewRepo.findById(reviewId);
    if (!review) throw ProfileErrors.KycReview.notFound(reviewId);
    if (review.status !== "pending") {
      throw ProfileErrors.KycReview.invalidTransition();
    }

    // No profile status change — user stays under review.
    // Just append admin notes so the queue shows what's needed.
    await this.repos.kycReviewRepo.updateStatus(reviewId, "pending", {
      adminNotes,
    });

    await this.repos.auditRepo.create({
      actorId: adminMeta.actorId,
      actorIp: adminMeta.ip,
      actorRole: adminMeta.actorRoles[0] ?? null,
      action: "kyc:review_more_info_requested",
      resource: "kyc_review",
      metadata: { reviewId, userId: review.userId, adminNotes },
    });

    return review;
  }

  async reviewlistByUser(userId: string) {
    return this.repos.kycReviewRepo.listByUser(userId);
  }

  async pendingReviewList(pagination: Pagination) {
    return this.repos.kycReviewRepo.listByStatus("pending", pagination);
  }

  private async onDocumentUpdated(
    tx: DB,
    actorMeta: ActorMeta,
    documentTypeId: string,
  ): Promise<string[]> {
    const txReqRepo = new KycRoleRequirementRepository(tx as unknown as DB);
    const requirements =
      await txReqRepo.findRoleIdsByDocumentTypeId(documentTypeId);
    const affectedRoleIds = requirements.map((r) => r.roleId);

    if (affectedRoleIds.length === 0) return [];

    const txKycProfileRepo = new KycProfileRepository(tx as unknown as DB);
    await txKycProfileRepo.markStale(actorMeta.actorId, affectedRoleIds);

    return affectedRoleIds;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. Address Service
// ═════════════════════════════════════════════════════════════════════════════

export class AddressServiceImpl {
  constructor(
    private readonly repos: ProfileRepositories,
    private readonly db: DB,
  ) { }

  async create(data: CreateAddressRequest, actorMeta: ActorMeta) {
    // Check serviceability
    const check = await ServiceableZoneService.checkServiceability(
      data.latitude,
      data.longitude,
    );
    if (!check.serviceable) throw ProfileErrors.Address.notServicableAddress();
    const { res8, res9 } = coordsToH3Multi(data.latitude, data.longitude);
    const cityId = check.cityId;

    return await this.db.transaction(async (tx) => {
      const txAddressRepo = new AddressRepository(tx as unknown as DB);

      const existingCount = await txAddressRepo.countByUser(actorMeta.actorId);

      const address = await txAddressRepo.create({
        userId: actorMeta.actorId,
        formatedAddress: data.formatedAddress,
        label: data.label as AddressLabelType,
        customLabel: data.label === "other" ? data.customLabel : null,
        line1: data.line1,
        line2: data.line2,
        landmark: data.landmark,
        cityId: cityId,
        pincode: data.pincode,
        state: data.state,
        country: data.country,
        location: { lng: data.longitude, lat: data.latitude },
        h3IndexRes8: res8,
        h3IndexRes9: res9,
        isCurrent: existingCount === 0,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
      });

      return address;
    });
  }

  async update(
    addressId: string,
    data: UpdateAddressRequest,
    actorMeta: ActorMeta,
  ) {
    const updated = await this.repos.addressRepo.updateByIdAndUser(
      addressId,
      actorMeta.actorId,
      {
        label: data.label as AddressLabelType,
        customLabel: data.label === "other" ? data.customLabel : null,
        line1: data.line1,
        line2: data.line2,
        landmark: data.landmark,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
      },
    );
    if (!updated) throw ProfileErrors.Address.notFound();

    return updated;
  }

  async getById(id: string) {
    const address = await this.repos.addressRepo.findById(id);
    if (!address) throw ProfileErrors.Address.notFound();
    return address;
  }

  async getByIdAndUser(id: string, actorMeta: ActorMeta) {
    const address = await this.repos.addressRepo.findByIdAndUser(
      id,
      actorMeta.actorId,
    );
    if (!address) throw ProfileErrors.Address.notFound();
    return address;
  }

  async listByUser(userId: string) {
    return await this.repos.addressRepo.listByUser(userId);
  }

  async setDefault(id: string, actorMeta: ActorMeta) {
    const address = await this.repos.addressRepo.findById(id);
    if (!address) throw ProfileErrors.Address.notFound();

    await this.repos.addressRepo.setCurrent(id, actorMeta.actorId);
  }

  async softDelete(id: string, actorMeta: ActorMeta) {
    const address = await this.repos.addressRepo.findById(id);
    if (!address) throw ProfileErrors.Address.notFound();

    await this.repos.addressRepo.softDelete(id, actorMeta.actorId);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. Shop Owner Service
// ═════════════════════════════════════════════════════════════════════════════

export class ShopOwnerServiceImpl {
  constructor(
    private readonly repos: ProfileRepositories,
    private readonly db: DB,
  ) { }

  async onboard(actorMeta: ActorMeta) {
    const existing = await this.repos.shopOwnerRepo.findByUserId(
      actorMeta.actorId,
    );
    if (existing) return existing;

    const profile = await this.db.transaction(async (tx) => {
      const txShopOwnerRepo = new ShopOwnerProfileRepository(
        tx as unknown as DB,
      );
      const txUserRoleRepo = new UserRoleRepository(tx as unknown as DB);
      const txAuditLogRepo = new AuditLogRepository(tx as unknown as DB);

      const created = await txShopOwnerRepo.create({
        userId: actorMeta.actorId,
      });

      if (created) {
        const roleId = roleCache.getId(ROLES.SHOP_OWNER);
        if (roleId) {
          const roleAssign = await txUserRoleRepo.assign({
            userId: actorMeta.actorId,
            roleId: roleId,
          });
          if (!roleAssign) {
            throw ProfileErrors.ShopOwner.shopRoleNotAssign();
          }
        }
      } else {
        throw ProfileErrors.ShopOwner.notCreated();
      }

      await txAuditLogRepo.create({
        actorId: actorMeta.actorId,
        actorIp: actorMeta.ip,
        actorRole: actorMeta.actorRoles[0] as any,
        action: "profile:shop_owner:onboard",
        resource: "shop_owner_profile",
        resourceId: created.id,
      });

      return created;
    });

    return profile;
  }

  async getProfile(userId: string) {
    const profile = await this.repos.shopOwnerRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.ShopOwner.notFound();
    return profile;
  }

  async update(data: UpdateShopOwnerRequest, actorMeta: ActorMeta) {
    const profile = await this.repos.shopOwnerRepo.findByUserId(
      actorMeta.actorId,
    );
    if (!profile) throw ProfileErrors.Profile.notFound();

    const updated = await this.repos.shopOwnerRepo.update(profile.id!, data);
    if (!updated) throw ProfileErrors.Profile.notFound();

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] as any,
      action: "profile:shop_owner:update",
      resource: "shop_owner_profile",
      resourceId: profile!.id,
    });

    return updated;
  }

  async suspend(reason: string, actorMeta: AdminMeta) {
    const profile = await this.repos.shopOwnerRepo.findByUserId(
      actorMeta.actorId,
    );
    if (!profile) throw ProfileErrors.ShopOwner.notFound();

    const updated = await this.repos.shopOwnerRepo.suspend(profile.id!, reason);
    if (!updated) throw ProfileErrors.ShopOwner.notFound();

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: "admin",
      action: "profile:shop_owner:suspend",
      resource: "shop_owner_profile",
      resourceId: profile!.id,
      metadata: { reason },
    });

    return updated;
  }

  async unsuspend(userId: string, actorMeta: AdminMeta) {
    const profile = await this.repos.shopOwnerRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.ShopOwner.notFound();

    const updated = await this.repos.shopOwnerRepo.unsuspend(profile.id!);
    if (!updated) throw ProfileErrors.ShopOwner.notFound();

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: ROLES.ADMIN,
      action: "profile:shop_owner:unsuspend",
      resource: "shop_owner_profile",
      resourceId: profile!.id,
    });

    return updated;
  }

  async verify(userId: string, actorMeta: AdminMeta) {
    const profile = await this.repos.shopOwnerRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.ShopOwner.notFound();

    const roleId = roleCache.getId(ROLES.SHOP_OWNER);
    const isKyc = await this.repos.kycProfileRepo.findByUserAndRole(
      userId,
      roleId,
    );

    if (!isKyc || isKyc?.status !== "verified")
      throw ProfileErrors.KycProfile.kycNotVerified();

    if (!profile.primaryBankAccountId) {
      throw ProfileErrors.ShopOwner.bankAccountNotLink();
    }

    if (!profile.profilePhotoKey) {
      throw ProfileErrors.ShopOwner.profilePhotoNotUpload();
    }

    const verifiedUpdated = this.db.transaction(async (tx) => {
      const txShopOwner = new ShopOwnerProfileRepository(tx as unknown as DB);
      const txAuditLogRepo = new AuditLogRepository(tx as unknown as DB);

      const update = await txShopOwner.update(userId, {
        isVerified: true,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      });

      await txAuditLogRepo.create({
        actorId: actorMeta.actorId,
        actorIp: actorMeta.ip,
        actorRole: ROLES.ADMIN,
        action: "profile:shop_owner:verified",
        resource: "shop_owner_profile",
        resourceId: profile!.id,
      });

      return update;
    });
    return verifiedUpdated;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. Delivery Partner Service
// ═════════════════════════════════════════════════════════════════════════════

export class DeliveryPartnerServiceImpl {
  constructor(
    private readonly repos: ProfileRepositories,
    private readonly db: DB,
  ) { }

  async onboard(data: DeliveryPartnerOnboardRequest, actorMeta: ActorMeta) {
    const city = await this.repos.cityRepo.findById(data.cityId);
    if (!city) throw PlatformErrors.City.notFound();

    const existing = await this.repos.dpRepo.findByUserId(actorMeta.actorId);
    if (existing) return existing;

    const profile = await this.db.transaction(async (tx) => {
      const txDeliveryPartnerRepo = new DeliveryPartnerProfileRepository(
        tx as unknown as DB,
      );
      const txUserRoleRepo = new UserRoleRepository(tx as unknown as DB);
      const txAuditLogRepo = new AuditLogRepository(tx as unknown as DB);

      const created = await txDeliveryPartnerRepo.create({
        userId: actorMeta.actorId,
        cityId: data.cityId,
        vehicleType: data.vehicleType as VehicleType,
      });

      if (created) {
        const roleId = roleCache.getId(ROLES.DELIVERY_PARTNER);
        if (roleId) {
          const roleAssign = await txUserRoleRepo.assign({
            userId: actorMeta.actorId,
            roleId: roleId,
          });
          if (!roleAssign) {
            throw ProfileErrors.DeliveryPartner.roleNotAssign();
          }
        }
      } else {
        throw ProfileErrors.DeliveryPartner.notFound();
      }

      await txAuditLogRepo.create({
        actorId: actorMeta.actorId,
        actorIp: actorMeta.ip,
        actorRole: actorMeta.actorRoles[0] as any,
        action: "profile:delivery_partner:onboard",
        resource: "delivery_partner",
        resourceId: created.id,
      });

      return created;
    });

    return profile;
  }

  async getProfile(userId: string) {
    const profile = await this.repos.dpRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.DeliveryPartner.notFound();
    return profile;
  }

  async update(data: UpdateDeliveryPartnerRequest, actorMeta: ActorMeta) {
    const profile = await this.repos.dpRepo.findByUserId(actorMeta.actorId);
    if (!profile) throw ProfileErrors.Profile.notFound();

    const updated = await this.repos.dpRepo.update(profile.id!, data as any);
    if (!updated) throw ProfileErrors.Profile.notFound();

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] as any,
      action: "profile:delivery_partner:update",
      resource: "delivery_partner_profile",
      resourceId: profile!.id,
    });

    return updated;
  }

  async suspend(userId: string, reason: string, actorMeta: AdminMeta) {
    const profile = await this.repos.dpRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.DeliveryPartner.notFound();

    const updated = await this.repos.dpRepo.suspend(profile.id!, reason);
    if (!updated) throw ProfileErrors.DeliveryPartner.notFound();

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: "admin",
      action: "profile:dp:suspend",
      resource: "delivery_partner_profile",
      resourceId: profile!.id,
      metadata: { reason },
    });

    return updated;
  }

  async unsuspend(userId: string, actorMeta: AdminMeta) {
    const profile = await this.repos.dpRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.DeliveryPartner.notFound();

    const updated = await this.repos.dpRepo.unsuspend(profile.id!);
    if (!updated) throw ProfileErrors.DeliveryPartner.notFound();

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: "admin",
      action: "profile:dp:unsuspend",
      resource: "delivery_partner_profile",
      resourceId: profile!.id,
    });

    return updated;
  }

  async verify(userId: string, actorMeta: AdminMeta) {
    const profile = await this.repos.dpRepo.findByUserId(userId);
    if (!profile) throw ProfileErrors.DeliveryPartner.notFound();

    const roleId = roleCache.getId(ROLES.DELIVERY_PARTNER);
    const isKyc = await this.repos.kycProfileRepo.findByUserAndRole(
      userId,
      roleId,
    );

    if (!isKyc || isKyc?.status !== "verified")
      throw ProfileErrors.KycProfile.kycNotVerified();

    if (!profile.primaryBankAccountId) {
      throw ProfileErrors.ShopOwner.bankAccountNotLink();
    }

    if (!profile.profilePhotoKey) {
      throw ProfileErrors.ShopOwner.profilePhotoNotUpload();
    }

    const verifiedUpdated = this.db.transaction(async (tx) => {
      const txDeliveryPartnerRepo = new DeliveryPartnerProfileRepository(
        tx as unknown as DB,
      );
      const txAuditLogRepo = new AuditLogRepository(tx as unknown as DB);

      const update = await txDeliveryPartnerRepo.update(userId, {
        isVerified: true,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      });

      await txAuditLogRepo.create({
        actorId: actorMeta.actorId,
        actorIp: actorMeta.ip,
        actorRole: ROLES.ADMIN,
        action: "profile:delivery_partner:verified",
        resource: "delivery_partner_profile",
        resourceId: profile!.id,
      });

      return update;
    });
    return verifiedUpdated;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. Customer Service
// ═════════════════════════════════════════════════════════════════════════════

export class CustomerServiceImpl {
  constructor(
    private readonly repos: ProfileRepositories,
    private readonly db: DB,
  ) { }

  async getOrCreate(userId: string) {
    const existing = await this.repos.customerRepo.findByUserId(userId);
    if (existing) return existing;

    const created = await this.repos.customerRepo.create({ userId });
    return created;
  }

  async updatePreferences(
    preferences: Record<string, unknown>,
    actorMeta: ActorMeta,
  ) {
    const profile = await this.getOrCreate(actorMeta.actorId);
    const updated = await this.repos.customerRepo.update(profile!.id, {
      preferences,
    });
    if (!updated) throw ProfileErrors.Profile.notFound();

    await this.repos.auditRepo.create({
      actorId: actorMeta.actorId,
      actorIp: actorMeta.ip,
      actorRole: actorMeta.actorRoles[0] as any,
      action: "profile:customer:preferences_update",
      resource: "customer_profile",
      resourceId: profile!.id,
    });

    return updated;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. Composite Profile Service
// ═════════════════════════════════════════════════════════════════════════════

export class CompositeProfileServiceImpl {
  constructor(private readonly repos: ProfileRepositories) { }

  async getFullProfile(userId: string) {
    const user = await this.repos.userRepo.findById(userId);
    if (!user) throw AuthErrors.User.notFound();

    const [shopOwner, dp, customer, addresses, bankAccounts] =
      await Promise.all([
        this.repos.shopOwnerRepo.findByUserId(userId),
        this.repos.dpRepo.findByUserId(userId),
        this.repos.customerRepo.findByUserId(userId),
        this.repos.addressRepo.listByUser(userId),
        this.repos.bankAccountRepo.listByUser(userId),
      ]);

    return {
      user,
      shopOwner,
      deliveryPartner: dp,
      customer,
      addresses: addresses,
      bankAccounts: bankAccounts,
    };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. Service Exports (Singletons/Default Instances)
// ═════════════════════════════════════════════════════════════════════════════

export const defaultRepos: ProfileRepositories = {
  auditRepo: new AuditLogRepository(db),
  bankAccountRepo: new BankAccountRepository(db),
  kycRepo: new KycDocumentRepository(db),
  kycProfileRepo: new KycProfileRepository(db),
  kycReviewRepo: new KycReviewRepository(db),
  kycRequirementRepo: new KycRoleRequirementRepository(db),
  documentTypeRepo: new DocumentTypeRepository(db),
  addressRepo: new AddressRepository(db),
  shopOwnerRepo: new ShopOwnerProfileRepository(db),
  dpRepo: new DeliveryPartnerProfileRepository(db),
  customerRepo: new CustomerProfileRepository(db),
  cityRepo: new CityRepository(db),
  userRepo: new UserRepository(db),
};

export const AddressService = new AddressServiceImpl(defaultRepos, db);
export const BankAccountService = new BankAccountServiceImpl(defaultRepos, db);
export const KycDocumentService = new KycDocumentServiceImpl(defaultRepos, db);
export const ShopOwnerService = new ShopOwnerServiceImpl(defaultRepos, db);
export const DeliveryPartnerService = new DeliveryPartnerServiceImpl(
  defaultRepos,
  db,
);
export const CustomerService = new CustomerServiceImpl(defaultRepos, db);
export const CompositeProfileService = new CompositeProfileServiceImpl(
  defaultRepos,
);
