/**
 * shared/utils/pagination.utils.ts
 */

import { and, gt, lt, type SQL } from "drizzle-orm";
import type { Pagination, PaginationQuery } from "../schemas/pagination.schema";

/**
 * Standard offset-based pagination.
 */
export function applyPagination(limit: number, page: number) {
  return { limit, offset: (page - 1) * limit };
}

/**
 * Cursor-based pagination for Drizzle ORM.
 */
export function applyCursorPagination(
  column: any,
  cursor: string | number | undefined,
  order: "asc" | "desc",
  existingWhere?: SQL | undefined
): SQL | undefined {
  if (!cursor) return existingWhere;

  const cursorClause = order === "asc" ? gt(column, cursor) : lt(column, cursor);

  return existingWhere ? and(existingWhere, cursorClause) : (cursorClause as any);
}

/**
 * Safely parses pagination query parameters into standard numeric values.
 *
 * @param query - The raw query object from Elysia.
 * @returns An object with page, limit, order, and optional cursor.
 */
export function parsePagination(query: PaginationQuery) {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    order: (query.order ?? "desc") as "asc" | "desc",
    cursor: query.cursor,
  };
}