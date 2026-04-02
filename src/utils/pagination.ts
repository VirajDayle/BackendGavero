/**
 * utils/pagination.ts
 *
 * Shared pagination helpers used by repositories and services.
 */

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface PaginationOffset {
  limit: number;
  offset: number;
}

/**
 * Converts page + limit into a SQL-ready limit + offset.
 * Pages are 1-indexed. Page 1 = offset 0.
 */
export function toOffset(p: PaginationInput): PaginationOffset {
  const page = Math.max(1, Math.floor(p.page));
  const limit = Math.min(100, Math.max(1, Math.floor(p.limit)));
  return { limit, offset: (page - 1) * limit };
}
