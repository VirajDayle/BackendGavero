// src/utils/slug.ts

import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { db } from "../db/index";
import { sql } from "drizzle-orm";

/**
 * Core slugify — converts any string to a URL-safe slug.
 * Handles Unicode, special chars, and Indian language transliteration via normalization.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .normalize("NFKD") // decompose unicode (é → e + ́)
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // strip non-alphanumeric (except spaces/hyphens)
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

/**
 * Generates a unique slug for a given table + column.
 * Appends -1, -2, -3 ... suffix if base slug already exists.
 *
 * @example
 *   await uniqueSlug("grocery store", shopTypeTable, shopTypeTable.slug)
 *   // "grocery-store" if free, else "grocery-store-2"
 */
export async function uniqueSlug(
  input: string,
  table: AnyPgTable,
  slugColumn: AnyPgColumn,
  excludeId?: string, // pass existing record's id when updating
): Promise<string> {
  const base = slugify(input);

  if (!base) throw new Error("Slug cannot be derived from the given input.");

  // Find all slugs that start with the base
  const rows = await db
    .select({ slug: slugColumn })
    .from(table)
    .where(
      excludeId
        ? sql`${slugColumn} LIKE ${base + "%"} AND id != ${excludeId}`
        : sql`${slugColumn} LIKE ${base + "%"}`,
    );

  const existing = new Set(rows.map((r) => r.slug));

  if (!existing.has(base)) return base;

  // Find the next available suffix
  let counter = 2;
  while (existing.has(`${base}-${counter}`)) counter++;
  return `${base}-${counter}`;
}
