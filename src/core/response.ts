/**
 * core/response.ts
 *
 * Canonical API response envelopes and factory helpers.
 * Ensures consistent JSON structure for success, failure, and pagination.
 */

import type { ErrorMeta } from "./errors";

// ── Pagination tag ────────────────────────────────────────────────────────────
const PAGINATED_TAG = '__paginated__' as const;

// ── Success ───────────────────────────────────────────────────────────────────
export interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  requestId?: string;
}

export function ok<T>(data: T, requestId?: string): SuccessResponse<T> {
  return { success: true, statusCode: 200, data, ...(requestId && { requestId }) };
}

export function created<T>(data: T, requestId?: string): SuccessResponse<T> {
  return { success: true, statusCode: 201, data, ...(requestId && { requestId }) };
}

export function accepted<T>(data: T, requestId?: string): SuccessResponse<T> {
  return { success: true, statusCode: 202, data, ...(requestId && { requestId }) };
}

// ── Paginated raw (internal marker — never reaches client) ────────────────────
export function paginatedRaw<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
) {
  return { [PAGINATED_TAG]: true as const, items, page, limit, total };
}

export function isPaginatedRaw(
  val: unknown,
): val is ReturnType<typeof paginatedRaw> {
  return typeof val === 'object' && val !== null && PAGINATED_TAG in val;
}

// ── Paginated (final client shape) ────────────────────────────────────────────
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function paginated<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  requestId?: string,
): PaginatedResponse<T> {
  return {
    success: true,
    statusCode: 200,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    ...(requestId && { requestId }),
  };
}

// ── Error ─────────────────────────────────────────────────────────────────────
export interface ErrorResponse {
  success: false;
  statusCode?: number;
  error: { code: string; message: string; details?: unknown };
  meta?: ErrorMeta;
  requestId?: string;
}