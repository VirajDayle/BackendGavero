/**
 * middleware/response.middleware.ts
 *
 * Shapes every successful handler response into a canonical envelope.
 * Runs after the handler, before the response is sent to the client.
 *
 * Depends on requestIdPlugin being mounted first — reads ctx.requestId.
 *
 * Skipped for:
 *   - /docs  (Swagger UI — raw HTML)
 *   - /health (plain health check — no envelope needed)
 *   - Already-shaped responses (avoids double-wrapping)
 */

import Elysia from "elysia";
import { ok, paginated, isPaginatedRaw } from "../core/response";
import type {
  SuccessResponse,
  PaginatedResponse,
  ErrorResponse,
} from "../core/response";
import { requestIdPlugin } from "./requestId.middleware";

// ── Routes that bypass response shaping ──────────────────────────────────────

const SKIP_PREFIXES = ["/docs", "/health"] as const;

function shouldSkip(pathname: string): boolean {
  return SKIP_PREFIXES.some((p) => pathname.startsWith(p));
}

// ── Already-shaped guard ──────────────────────────────────────────────────────
// Prevents double-wrapping if a handler explicitly returns ok() or err().

function isAlreadyShaped(
  val: unknown,
): val is
  | SuccessResponse<unknown>
  | PaginatedResponse<unknown>
  | ErrorResponse {
  return typeof val === "object" && val !== null && "success" in val;
}

// ── Plugin ────────────────────────────────────────────────────────────────────

export const responsePlugin = new Elysia({
  name: "response-shaper",
})
  .use(requestIdPlugin)
  .onAfterHandle(
    { as: "global" },
    ({ set, request, responseValue, requestId }) => {
      // requestId may or may not be on ctx depending on plugin mount order

      if (requestId) set.headers["x-request-id"] = requestId;
      set.status = 200;
      const url = new URL(request.url);

      // ── Skip raw routes ──
      if (shouldSkip(url.pathname)) return responseValue;

      // ── Skip already-shaped responses ──
      if (isAlreadyShaped(responseValue)) {
        if (
          "statusCode" in responseValue &&
          typeof responseValue.statusCode === "number"
        ) {
          set.status = responseValue.statusCode;
        }
        return responseValue;
      }

      // ── Null / undefined → ok(null) ──
      if (responseValue === null || responseValue === undefined) {
        return ok(null, requestId);
      }

      // ── Paginated marker → paginated envelope ──
      if (isPaginatedRaw(responseValue)) {
        const { items, page, limit, total } = responseValue;
        return paginated(items, page, limit, total, requestId);
      }

      // ── Everything else → ok envelope ──
      return ok(responseValue, requestId);
    },
  );
