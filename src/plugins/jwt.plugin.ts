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
  sub: string; // userId
  jti: string; // accessTokenJti
  roles: string[];
}

export interface SignedToken {
  token: string;
  expiresAt: Date;
}

const jwtHelpers = {
  /**
   * Signs an access token JWT.
   * Returns both the token string and the expiry Date.
   */
  async sign(payload: JwtPayload): Promise<SignedToken> {
    const ttlMin = env.JWT_ACCESS_TTL_MIN;
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    const token = await new SignJWT({
      sub: payload.sub,
      roles: payload.roles,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setJti(payload.jti)
      .setIssuedAt()
      .setExpirationTime(`${ttlMin}m`)
      .sign(ACCESS_SECRET);

    return { token, expiresAt };
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
      roles: (payload["roles"] as string[]) ?? [],
    };
  },
};

export const jwtPlugin = new Elysia({ name: "jwt" }).decorate(
  "jwt",
  jwtHelpers,
);

export type JwtPlugin = typeof jwtPlugin;
