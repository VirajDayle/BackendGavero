/**
 * shared/constants/auth.constants.ts
 */

export const AUTH_CONSTANTS = {
  TOKEN_EXPIRY: "7d",
  REFRESH_TOKEN_EXPIRY: "30d",
} as const;

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  SHOP_OWNER: "shop_owner",
  DELIVERY_PARTNER: "delivery_partner",
  EMPLOYEE: "employee",
  CUSTOMER: "customer",
  SYSTEM: "system",
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];
