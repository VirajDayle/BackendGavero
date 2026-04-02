/**
 * middleware/rateLimit.middleware.ts
 *
 * Redis-backed sliding-window rate limiter.
 * Uses atomic INCR + EXPIRE so every check is a single Redis round-trip.
 *
 * Features:
 *  - Proxy-aware IP extraction (honours TRUST_PROXY env flag)
 *  - Standard X-RateLimit-* response headers on every request
 *  - Retry-After header on 429 responses
 *  - Configurable bypass via RATE_LIMIT_BYPASS env var (for tests/dev)
 *  - Fail-open on Redis errors (logs a warning, never crashes the request)
 *
 * Two modes:
 *
 * 1. Plugin mode — apply to a route group (all routes under it share one counter):
 *      new Elysia().use(rateLimitPlugin({ max: 5, windowSec: 60, action: "otp:send" }))
 *
 * 2. Guard mode — apply to a specific route via beforeHandle array:
 *      .post("/otp/send", handler, { beforeHandle: [rateLimit({ max: 5, windowSec: 60, action: "otp:send" })] })
 */

import Elysia from "elysia";
import { redis } from "../config/redis";
import { env } from "../config/env";
import { AppError } from "../core/errors";
import { logger } from "../core/logger";

export interface RateLimitOptions {
  max: number;
  windowSec: number;
  action: string;
  /**
   * Custom identifier for the rate limit bucket.
   * If provided as a function, it receives the Elysia context.
   * If not provided, it defaults to the request IP address.
   */
  key?: string | ((ctx: any) => string | Promise<string>);
}

/**
 * Lua script — atomically increments the counter and sets TTL on first call.
 * Returns [count, ttl] so we get both values in a single round-trip.
 */
const RATE_LIMIT_SCRIPT = `
  local key   = KEYS[1]
  local ttl   = tonumber(ARGV[1])
  local count = redis.call('INCR', key)
  if count == 1 then
    redis.call('EXPIRE', key, ttl)
  end
  return { count, redis.call('TTL', key) }
`;

/**
 * Resolves the client IP address.
 * When TRUST_PROXY=true, checks X-Forwarded-For and CF-Connecting-IP first.
 * This is safe only when your reverse proxy is responsible for setting these headers.
 */
function resolveClientIp(ctx: any): string {
  const { request, server } = ctx;

  if (env.TRUST_PROXY) {
    // Cloudflare sets this directly (single IP, trustworthy behind CF)
    const cfIp = request.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();

    // Standard X-Forwarded-For: "client, proxy1, proxy2" — take the first
    const fwdFor = request.headers.get("x-forwarded-for");
    if (fwdFor) {
      const firstIp = fwdFor.split(",")[0].trim();
      if (firstIp) return firstIp;
    }
  }

  return server?.requestIP(request)?.address ?? "unknown";
}

/**
 * Core rate-limit check. Returns an Elysia-compatible beforeHandle function.
 * Use this for per-route rate limiting in route options.
 *
 * Sets X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset on
 * every response so clients can self-throttle gracefully.
 */
export function rateLimit(opts: RateLimitOptions) {
  return async (ctx: any) => {
    // Disable limiter via env flag — used in test environments
    if (env.RATE_LIMIT_BYPASS) return;

    const { set } = ctx;

    let identifier: string;

    if (typeof opts.key === "function") {
      identifier = await opts.key(ctx);
    } else if (typeof opts.key === "string") {
      identifier = opts.key;
    } else {
      identifier = resolveClientIp(ctx);
    }

    const key = `rl:${opts.action}:${identifier}`;

    let attempts: number;
    let retryAfter: number;

    try {
      // Single atomic round-trip: INCR + conditional EXPIRE + TTL read
      const result = (await redis.eval(
        RATE_LIMIT_SCRIPT,
        1,           // number of KEYS
        key,         // KEYS[1]
        opts.windowSec, // ARGV[1]
      )) as [number, number];

      attempts = result[0];
      const ttl = result[1];
      retryAfter = ttl > 0 ? ttl : opts.windowSec;
    } catch (err) {
      // Redis unavailable — fail open so a Redis outage doesn't take down auth
      logger.warn(
        { err, action: opts.action, identifier },
        "[RateLimit] Redis error — skipping check",
      );
      return;
    }

    // Attach standard rate-limit headers on every response (even non-blocked ones)
    const remaining = Math.max(0, opts.max - attempts);
    const resetAt = Math.floor(Date.now() / 1000) + retryAfter;

    set.headers["X-RateLimit-Limit"] = String(opts.max);
    set.headers["X-RateLimit-Remaining"] = String(remaining);
    set.headers["X-RateLimit-Reset"] = String(resetAt);

    if (attempts >= opts.max) {
      set.headers["Retry-After"] = String(retryAfter);

      throw new AppError(
        429,
        "RATE_LIMITED",
        `Too many requests. Retry after ${retryAfter} seconds`,
        { module: "rate_limit", action: opts.action, identifier },
      );
    }
  };
}

/**
 * Plugin mode — mounts as global beforeHandle on an Elysia instance.
 * Use this only when you want ALL routes in a group to share one counter.
 */
export function rateLimitPlugin(opts: RateLimitOptions) {
  return new Elysia({ name: `rate-limit:${opts.action}` }).onBeforeHandle(
    { as: "scoped" },
    rateLimit(opts),
  );
}
