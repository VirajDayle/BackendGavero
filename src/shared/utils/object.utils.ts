/**
 * shared/utils/object.utils.ts
 */

/**
 * Removes undefined values from an object.
 */
export function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
