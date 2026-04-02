/**
 * middleware/auth.middleware.ts
 *
 * JWT verification middleware.
 * Verifies the Bearer token on every route this plugin is mounted on.
 *
 * Three checks:
 *   1. JWT signature valid and not expired
 *   2. Required claims present (sub, jti, roles)
 *   3. Session row exists in DB, is active, and not expired
 *      → catches tokens for revoked/logged-out sessions
 *
 * On success  → merges { user: AuthUser } into ctx
 * On failure  → throws 401
 *
 * Mount ONLY on protected route groups, NOT on the whole app.
 * Public routes (/auth/otp/send, /auth/register etc.) must NOT use this.
 *
 * Usage:
 *   new Elysia().use(jwtAuthPlugin).get("/protected", ({ user }) => user)
 */

import Elysia from "elysia";
import { jwtVerify } from "jose";
import { env } from "../config/env";
import { redis } from "../config/redis";
import { AuthErrors } from "../modules/auth/auth.errors";
const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export interface AuthUser {
  id: string;
  sessionId: string;
  roles: string[];
}

interface AccessTokenPayload {
  sub: string;
  jti: string;
  sid: string;
  roles: string[];
  iat: number;
  exp: number;
}

export const jwtAuthPlugin = new Elysia({ name: "jwt-auth" }).derive(
  { as: "scoped" }, // "scoped" — only runs on route groups that explicitly .use(jwtAuthPlugin)
  async ({ request }): Promise<{ user?: AuthUser }> => {
    // No Authorization header → public route, skip silently
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { user: undefined };
    }
    // take authheader if it start with bearer then we go further
    const token = authHeader.slice(7).trim();
    if (!token) {
      return { user: undefined };
    }

    // Verify JWT signature and expiry
    let payload: AccessTokenPayload;
    try {
      const { payload: raw } = await jwtVerify(token, ACCESS_SECRET);
      payload = raw as unknown as AccessTokenPayload;
    } catch (err) {
      const expired = err instanceof Error && err.message.includes("expired");
      throw expired
        ? AuthErrors.Auth.tokenExpired()
        : AuthErrors.Auth.tokenInvalid();
    }

    // Validate required claims
    if (
      typeof payload.sub !== "string" ||
      typeof payload.jti !== "string" ||
      typeof payload.sid !== "string" ||
      !Array.isArray(payload.roles)
    ) {
      throw AuthErrors.Auth.tokenInvalid("Token is missing required claims");
    }

    // Redis JTI Blacklist check — catches revoked / signed-out sessions
    try {
      const revoked = await redis.get(`revoke_jti:${payload.jti}`);
      if (revoked) {
        console.log("[AuthMiddleware] Session revoked/logged out for JTI:", payload.jti);
        throw AuthErrors.Auth.sessionRevoked();
      }
    } catch (err) {
      // If it's already one of our known AppErrors (e.g. sessionRevoked), re-throw it.
      if (err?.constructor?.name === "AppError") throw err;

      console.error("[AuthMiddleware] Redis error during JTI check:", err);
      // Fail-Closed: If we can't verify the revocation status, we must assume the worst.
      // We throw a 401 Session Expired to force the user to re-authenticate or refresh.
      throw AuthErrors.Auth.sessionExpired("Security check failed: Session store unavailable");
    }

    return {
      user: {
        id: payload.sub,
        sessionId: payload.sid,
        roles: payload.roles,
      },
    };
  },
);