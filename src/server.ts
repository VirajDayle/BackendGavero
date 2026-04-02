/**
 * server.ts
 *
 * Bun entry point.
 * Imports the app, starts listening, and handles graceful shutdown.
 * Keep this file minimal — all app logic lives in app.ts.
 *
 * Run: bun run src/server.ts
 */

import { app } from "./app";
import { env } from "./config/env";
import { redis } from "./config/redis";
import { logger } from "./core/logger";

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen({ port: env.PORT, hostname: env.HOST }, () => {
  logger.info(
    { port: env.PORT, host: env.HOST, env: env.NODE_ENV },
    "🚀  Server started",
  );
  logger.info(`📖  API docs → http://${env.HOST}:${env.PORT}/docs`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down gracefully...");

  try {
    await app.stop();
    logger.info("HTTP server closed");
  } catch (err) {
    logger.error({ err }, "Error closing HTTP server");
  }

  try {
    await redis.quit();
    logger.info("Redis connection closed");
  } catch (err) {
    logger.error({ err }, "Error closing Redis connection");
  }

  logger.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "Unhandled rejection");
  process.exit(1);
});
