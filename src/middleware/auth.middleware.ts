/**
 * middleware/auth.middleware.ts
 *
 * JWT verification middleware.
 * Verifies the Bearer token on every route this plugin is mounted on.
 *
 * Three checks:
 *   1. JWT signature valid and not expired
 *   2. Required claims present (sub, jti, sid, roles)
 *   3. Redis JTI blacklist check — catches revoked/logged-out sessions
 *      (DB session lookup intentionally omitted — Redis revocation is
 *       sufficient and avoids a DB hit on every request)
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
import type { KycStatus } from "../modules/profile/profile.schema";

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export interface AuthUser {
  id: string;
  sessionId: string;
  roleIds: string[]; // UUIDs — JWT always carries IDs, never slugs
  kycStatus: Record<string, KycStatus>;
}

interface AccessTokenPayload {
  sub: string;
  jti: string;
  sid: string;
  roleIds: string[]; // role UUIDs stored in token
  kycStatus: Record<string, KycStatus>;
  iat: number;
  exp: number;
}

export const jwtAuthPlugin = new Elysia({ name: "jwt-auth" }).derive(
  { as: "scoped" },
  async ({ request }): Promise<{ user?: AuthUser }> => {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { user: undefined };
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return { user: undefined };
    }

    // 1. Verify JWT signature and expiry
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

    // 2. Validate required claims
    if (
      typeof payload.sub !== "string" ||
      typeof payload.jti !== "string" ||
      typeof payload.sid !== "string" ||
      !Array.isArray(payload.roleIds)
    ) {
      throw AuthErrors.Auth.tokenInvalid("Token is missing required claims");
    }

    // 3. Redis JTI blacklist check — catches revoked/signed-out sessions
    try {
      const revoked = await redis.get(`revoke_jti:${payload.jti}`);
      if (revoked) {
        console.warn("[AuthMiddleware] Revoked JTI attempted:", payload.jti);
        throw AuthErrors.Auth.sessionRevoked();
      }

      // 4. Stale token check — forces silent refresh if flag is set (e.g. KYC update)
      const stale = await redis.get(`stale_user:${payload.sub}`);
      if (stale) {
        throw AuthErrors.Auth.tokenStale();
      }
    } catch (err) {
      if (err?.constructor?.name === "AppError") throw err;
      console.error("[AuthMiddleware] Redis error during JTI check:", err);
      // Fail-closed: cannot verify revocation status → force re-auth
      throw AuthErrors.Auth.sessionExpired(
        "Security check failed: Session store unavailable",
      );
    }

    return {
      user: {
        id: payload.sub,
        sessionId: payload.sid,
        roleIds: payload.roleIds,
        kycStatus: payload.kycStatus ?? {},
      },
    };
  },
);
