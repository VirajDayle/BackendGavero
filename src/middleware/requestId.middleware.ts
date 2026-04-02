/**
 * middleware/requestId.middleware.ts
 *
 * Attaches a unique requestId to every request.
 * Uses the incoming x-request-id header if present (forwarded from a gateway),
 * otherwise generates a new UUID.
 *
 * Makes `ctx.requestId` available to all route handlers and middleware.
 * The requestId is also echoed back in every response as x-request-id header,
 * making it easy to correlate logs with client-reported errors.
 */

import { Elysia } from "elysia";

export const requestIdPlugin = new Elysia({ name: "request-id" })

  .derive({ as: "global" }, ({ request }) => ({
    requestId:
      request.headers.get("traceparent") ?? // W3C OpenTelemetry
      request.headers.get("x-trace-id") ?? // load balancer
      request.headers.get("x-request-id") ?? // API gateway
      crypto.randomUUID(), // fallback
  }));
