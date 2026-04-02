/**
 * plugins/redis.plugin.ts
 *
 * Exposes the ioredis `redis` client as an Elysia plugin so it is
 * accessible as `ctx.redis` in route handlers and middleware.
 *
 * Usage in app.ts:
 *   app.use(redisPlugin)
 *
 * Usage in a route:
 *   .get("/example", ({ redis }) => redis.get("key"))
 */

import Elysia from "elysia";
import { redis } from "../config/redis";

export const redisPlugin = new Elysia({ name: "redis" }).decorate(
  "redis",
  redis,
);

export type RedisPlugin = typeof redisPlugin;
