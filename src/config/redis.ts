/**
 * config/redis.ts
 *
 * ioredis client used by the rate-limit middleware.
 * Redis gives us native TTL and atomic INCR — much faster than Postgres for
 * high-frequency rate-limit checks on every request.
 */
import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../core/logger";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,

  retryStrategy(times) {
    if (times > 5) {
      logger.error("[Redis] Max retries reached — giving up");
      return null;
    }
    return Math.min(times * 200, 2000);
  },

  reconnectOnError(err) {
    // Reconnect on READONLY (happens during cluster failover)
    return err.message.includes("READONLY");
  },
});

redis.on("connect", () => logger.info("[Redis] connected"));
redis.on("ready",   () => logger.info("[Redis] ready"));
redis.on("error",   (err: Error) => logger.error({ err }, "[Redis] error"));
redis.on("end",     () => logger.error("[Redis] connection permanently closed"));