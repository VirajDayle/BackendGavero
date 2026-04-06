/**
 * middleware/rbac.middleware.ts
 *
 * Role-Based Access Control (RBAC) guard.
 * Ensures an authenticated user has the required roles to access a route.
 *
 * Usage:
 *   new Elysia().use(jwtAuthPlugin).use(rbacGuard(['admin'])).get("/admin-only", () => ...)
 */

import Elysia from "elysia";
import { AuthErrors } from "../modules/auth/auth.errors";
import type { AuthUser } from "./auth.middleware";

/**
 * Creates a hook function that enforces specific roles.
 * Best for use in `beforeHandle`.
 *
 * @param allowedRoles - Array of roles that are permitted to access the route.
 */
export const rbacGuard = (allowedRoles: string[]) => ({ user }: { user?: AuthUser }) => {
  if (!user) {
    throw AuthErrors.Common.unauthorized();
  }

  const hasAccess = allowedRoles.some((role) => user.roles.includes(role));

  if (!hasAccess) {
    console.warn(
      `[RBAC] Access denied for user ${user.id}. Required roles: [${allowedRoles.join(
        ", ",
      )}], User roles: [${user.roles.join(", ")}]`,
    );
    throw AuthErrors.Common.forbidden("Insufficient permissions for this resource");
  }
};

/**
 * Creates a middleware plugin that enforces specific roles for an entire Elysia instance or group.
 *
 * @param allowedRoles - Array of roles that are permitted.
 */
export const rbacPlugin = (allowedRoles: string[]) => (app: Elysia) =>
  app.derive({ as: "scoped" }, (ctx: any) => {
    rbacGuard(allowedRoles)(ctx);
    return { actor: ctx.user as AuthUser };
  });
