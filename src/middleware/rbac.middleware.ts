/**
 * middleware/rbac.middleware.ts
 *
 * Role-Based Access Control (RBAC) guard.
 * Ensures an authenticated user has the required roles to access a route.
 *
 * Flow:
 *   1. rbacGuard receives allowed role slugs (e.g. "admin", "shop_owner")
 *   2. Resolves slugs → UUIDs via RoleCache (zero DB/network hit)
 *   3. Checks user.roleIds (UUIDs from JWT) against resolved IDs
 *
 * This design keeps JWTs stable (IDs don't change on slug rename)
 * while keeping route definitions readable (ROLES.ADMIN not a UUID).
 *
 * Usage:
 *   import { ROLES } from "../constants/roles";
 *
 *   new Elysia()
 *     .use(jwtAuthPlugin)
 *     .use(rbacPlugin([ROLES.ADMIN, ROLES.SUPER_ADMIN]))
 *     .get("/admin-only", ({ actor }) => actor)
 */

import Elysia from "elysia";
import { AuthErrors } from "../modules/auth/auth.errors";
import { roleCache } from "../lib/role-cache";
import { ROLES, type RoleSlug } from "../shared";
import type { AuthUser } from "./auth.middleware";
import { logger } from "../core/logger";

/**
 * Hook function that enforces role access.
 * Use directly in beforeHandle if you need fine-grained control per route.
 */
export const rbacGuard =
  (allowedSlugs: RoleSlug[]) =>
    ({ user }: { user?: AuthUser }) => {
      if (!user) {
        throw AuthErrors.Common.unauthorized();
      }

      // Resolve slugs → IDs via in-memory cache (throws if slug unknown)
      const allowedIds = allowedSlugs.map((slug) => roleCache.getId(slug));

      const superAdminId = roleCache.getId(ROLES.SUPER_ADMIN);
      const hasAccess =
        user.roleIds.includes(superAdminId) ||
        allowedIds.some((id) => user.roleIds.includes(id));

      if (!hasAccess) {
        logger.warn(
          `[RBAC] Access denied for user ${user.id}. ` +
          `Required: [${allowedSlugs.join(", ")}], ` +
          `User roleIds: [${user.roleIds.join(", ")}]`,
        );
        throw AuthErrors.Common.forbidden(
          "Insufficient permissions for this resource",
        );
      }
    };

/**
 * Plugin that enforces roles for an entire Elysia group.
 * Also exposes `actor` (typed AuthUser) for convenience in handlers.
 *
 * Always mount AFTER jwtAuthPlugin so ctx.user is populated.
 */
export const rbacPlugin = (allowedSlugs: RoleSlug[]) => (app: Elysia) =>
  app.derive({ as: "scoped" }, (ctx: any) => {
    rbacGuard(allowedSlugs)(ctx);
    return { actor: ctx.user as AuthUser };
  });

export { ROLES };
export type { RoleSlug };
