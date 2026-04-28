/**
 * plugins/jwt.plugin.ts
 *
 * Jose-based JWT helpers exposed as an Elysia plugin.
 * Provides `ctx.jwt.sign()` and `ctx.jwt.verify()` in route handlers.
 *
 * Used directly by auth.service.ts for access token issuing.
 * The jwtAuthPlugin in middleware/auth.middleware.ts uses jose directly
 * for verification (no ctx needed there since it runs before routes).
 */

import Elysia from "elysia";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env";

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export interface JwtPayload {
  sub: string;
  jti: string;
  sid: string;
  roleIds: string[];
}

const jwtHelpers = {
  /**
   * Signs an access token JWT.
   * Returns both the token string and the expiry Date.
   */
  async sign(payload: JwtPayload): Promise<string> {
    return new SignJWT({ roles: payload.roleIds, sid: payload.sid })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(payload.sub)
      .setJti(payload.jti)
      .setIssuedAt()
      .setExpirationTime(`${env.JWT_ACCESS_TTL_MIN ?? 15}m`)
      .sign(ACCESS_SECRET);
  },

  /**
   * Verifies an access token JWT.
   * Returns the decoded payload or throws if invalid / expired.
   */
  async verify(token: string): Promise<JwtPayload> {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return {
      sub: payload.sub as string,
      jti: payload.jti as string,
      roleIds: (payload["roleIds"] as string[]) ?? [],
    };
  },
};

export const jwtPlugin = new Elysia({ name: "jwt" }).decorate(
  "jwt",
  jwtHelpers,
);

export type JwtPlugin = typeof jwtPlugin;
