/**
 * middleware/error.middleware.ts
 *
 * Global error handling middleware for Elysia.
 * Catches all errors thrown in handlers or other middleware and
 * transforms them into a standardized JSON response envelope.
 *
 * Features:
 *   1. Maps AppError instances to their respective status codes and messages.
 *   2. Handles Elysia/Zod validation errors (422).
 *   3. Catches standard Elysia errors (404, 405, etc.) via status code.
 *   4. Catches unexpected errors and returns 500 INTERNAL_ERROR.
 *   5. Logs server-side faults (5xx) with requestId correlation.
 *   6. Propagates x-request-id header for error tracking.
 */

import Elysia, { status } from "elysia";
import { AppError } from "../core/errors";
import { logger } from "../core/logger";
import type { ErrorMeta } from "../core/errors";
import { requestIdPlugin } from "./requestId.middleware";

// ── Standard error response shape ────────────────────────────────────────────

function errorResponse(
  code: string,
  statusCode: number,
  message: string,
  details?: unknown,
  meta?: ErrorMeta,
  requestId?: string,
) {
  return {
    success: false as const,
    ...(statusCode !== undefined && { statusCode }),
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
    meta,
    ...(requestId ? { requestId } : {}),
  };
}

function statusToCode(status: number): string {
  const map: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
  };
  return map[status] ?? "ERROR";
}

// ─────────────────────────────────────────────────────────────────────────────

export const errorPlugin = new Elysia({ name: "error-handler" })
  .use(requestIdPlugin)
  .onError({ as: "global" }, ({ error, set, requestId }) => {
    // ── AppError (our typed errors) ───────────────────────────────────────
    if (error instanceof AppError) {
      set.status = error.statusCode;

      // Log server-side faults — client errors (4xx) are expected, 5xx are not
      if (error.statusCode >= 500) {
        logger.error({ error, requestId }, "AppError [5xx]");
      }

      return errorResponse(
        error.code,
        error.statusCode,
        error.message,
        error.details,
        error.meta,
        requestId,
      );
    }

    // ── Elysia status() shorthand: throw status(401, "msg") ───────────────
    // Elysia wraps this as { code: <number>, response: <string|object> }
    if (
      typeof error === "object" &&
      error !== null &&
      typeof (error as { code?: unknown }).code === "number" &&
      "response" in (error as Record<string, unknown>)
    ) {
      const e = error as { code: number; response: unknown };
      const msg =
        typeof e.response === "string" ? e.response : "An error occurred";
      set.status = e.code;
      return errorResponse(
        statusToCode(e.code),
        e.code,
        msg,
        undefined,
        undefined,
        requestId,
      );
    }

    // ── Elysia / Zod validation error ─────────────────────────────────────
    const errName = (error as { name?: unknown }).name;
    const errCode = (error as { code?: unknown }).code;

    if (errName === "ValidationError" || errCode === "VALIDATION") {
      const msg =
        (error as { message?: string }).message ?? "Validation failed";
      set.status = 422;
      return errorResponse(
        "VALIDATION_ERROR",
        422,
        "Request validation failed",
        msg,
        { action: "validate" },
        requestId,
      );
    }

    // ── Generic error with status (e.g., Elysia standard errors) ──────────
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
    ) {
      const e = error as { status: number; message?: string; code?: string };
      set.status = e.status;
      return errorResponse(
        e.code ?? statusToCode(e.status),
        e.status,
        e.message ?? "An error occurred",
        undefined,
        undefined,
        requestId,
      );
    }

    // ── Unexpected error ──────────────────────────────────────────────────
    const msg = (error as { message?: string }).message ?? "Unknown error";
    logger.error({ error, requestId }, "Unhandled error");
    set.status = 500;
    return errorResponse(
      "INTERNAL_ERROR",
      500,
      "An unexpected error occurred",
      undefined,
      undefined,
      requestId,
    );
  });
