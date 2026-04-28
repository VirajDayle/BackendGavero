// middleware/kyc.middleware.ts

import { AuthErrors } from "../modules/auth/auth.errors";
import { roleCache } from "../lib/role-cache";
import type { AuthUser } from "./auth.middleware";
import type { RoleSlug } from "../shared";
import type { KycStatus } from "../modules/profile/profile.schema";
import Elysia from "elysia";
import { logger } from "../core/logger";

/**
 * Checks if the actor has a verified KYC profile for a specific role.
 *
 * Pattern mirrors rbacGuard: slug → UUID → check against JWT claim.
 * No DB hit — KYC status is embedded in the access token at issuance.
 *
 * @param roleSlug   - The role whose KYC status to check (e.g. ROLES.SHOP_OWNER)
 * @param required   - Minimum required status (default: "verified")
 */
export const kycGuard =
  (roleSlug: RoleSlug, required: KycStatus = "verified") =>
  ({ user }: { user?: AuthUser }) => {
    if (!user) throw AuthErrors.Common.unauthorized();

    let roleId: string;
    try {
      roleId = roleCache.getId(roleSlug);
    } catch {
      logger.error({ roleSlug }, "KYC guard: unknown role slug");
      throw AuthErrors.Common.internalError("KYC guard misconfiguration");
    }

    const status = user.kycStatus[roleId];

    if (!isKycSufficient(status, required)) {
      logger.warn(
        { userId: user.id, roleSlug, status, required },
        "KYC check failed",
      );
      throw AuthErrors.Kyc.notVerified(
        `KYC not ${required} for role: ${roleSlug}`,
      );
    }
  };

/**
 * KYC status has an implicit ordering:
 * not_started < pending < under_review < verified
 * rejected and suspended are terminal failure states.
 */
const KYC_STATUS_RANK: Record<KycStatus, number> = {
  not_submitted: 0,
  pending: 1,
  verified: 2,
  rejected: -1,
  stale: -1,
};

function isKycSufficient(
  actual: KycStatus | undefined,
  required: KycStatus,
): boolean {
  if (!actual) return false;
  return KYC_STATUS_RANK[actual] >= KYC_STATUS_RANK[required];
}

export const kycPlugin =
  (roleSlug: RoleSlug, required: KycStatus = "verified") =>
  (app: Elysia) =>
    app.derive({ as: "scoped" }, (ctx: any) => {
      kycGuard(roleSlug, required)(ctx);
      return { actor: ctx.user as AuthUser };
    });
