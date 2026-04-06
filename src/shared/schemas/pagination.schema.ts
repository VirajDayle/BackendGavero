import { t, type Static } from "elysia";

/**
 * TypeBox Schema for Pagination Query Parameters (HTTP Boundary)
 * All fields are optional because the user might not provide them.
 */
export const PaginationQuerySchema = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  order: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")], { default: "desc" })),
  cursor: t.Optional(t.String()),
});

/**
 * The input type from the HTTP request.
 */
export type PaginationQuery = Static<typeof PaginationQuerySchema>;

/**
 * The resolved type for Services and Repositories.
 * We use `Required` for page, limit, and order because they are guaranteed
 * to have values (even if they fall back to defaults) after the controller layer.
 */
export type Pagination = Required<Omit<PaginationQuery, "cursor">> & {
  cursor?: string;
};

