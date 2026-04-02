/**
 * plugins/db.plugin.ts
 *
 * Exposes the Drizzle `db` instance as an Elysia plugin so it is
 * accessible as `ctx.db` in any route handler that uses this plugin.
 *
 * Usage in app.ts:
 *   app.use(dbPlugin)
 *
 * Usage in a route:
 *   .get("/example", ({ db }) => db.select().from(users))
 */

import Elysia from "elysia";
import { db } from "../db";

export const dbPlugin = new Elysia({ name: "db" }).decorate("db", db);

export type DbPlugin = typeof dbPlugin;
