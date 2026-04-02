/**
 * middleware/logger.middleware.ts
 *
 * Request and response logging middleware.
 * Captures request details (method, path, ip, requestId) and response
 * details (status code, duration).
 *
 * Features:
 *   1. Measures performance duration for every request.
 *   2. Logs incoming requests and outgoing responses using Pino.
 *   3. Extracts client IP address and requestId from context.
 *   4. Catches errors and logs failure details with stack traces.
 *   5. Scoped globally for all routes in the application.
 */

import Elysia from "elysia";
import { logger } from "../core/logger";
import { requestIdPlugin } from "./requestId.middleware";

export const loggerPlugin = new Elysia({ name: "logger" })
  .use(requestIdPlugin)
  .state("start", 0 as number)
  .state("ip", "" as string)

  .onRequest(({ request, store, server }) => {
    store.start = performance.now();
    store.ip = server?.requestIP(request)?.address ?? "";
  })

  .onBeforeHandle({ as: "global" }, ({ request, store, requestId }) => {
    const path = new URL(request.url).pathname;

    if (path === "/favicon.ico") return;

    logger.info(
      {
        method: request.method,
        path,
        requestId,
        ip: store.ip,
      },
      "→ request"
    );
  })

  .onAfterHandle({ as: "global" }, ({ request, response, store, requestId }) => {
    const path = new URL(request.url).pathname;

    if (path === "/favicon.ico") return;

    const duration = Math.round(performance.now() - store.start);

    // response is always a Response object in this hook
    const status = response instanceof Response ? response.status : 200;

    logger.info(
      {
        method: request.method,
        path,
        status,
        duration,
        requestId,
        ip: store.ip,
      },
      "← response"
    );
  })

  .onError({ as: "global" }, ({ request, error, store, requestId }) => {
    const path = new URL(request.url).pathname;

    if (path === "/favicon.ico") return;

    const duration = Math.round(performance.now() - store.start);

    // Elysia's typed errors expose .status; fallback to 500
    const status = "status" in error ? error.status : 500;

    logger.error(
      {
        method: request.method,
        path,
        status,
        duration,   // useful to know how long before it failed
        requestId,
        ip: store.ip,
        err: error,
      },
      "✕ request error"
    );
  });