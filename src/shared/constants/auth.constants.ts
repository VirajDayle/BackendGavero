/**
 * shared/constants/auth.constants.ts
 */

export const AUTH_CONSTANTS = {
  TOKEN_EXPIRY: "7d",
  REFRESH_TOKEN_EXPIRY: "30d",
  ROLES: {
    ADMIN: "admin",
    USER: "user",
    DELIVERY_PARTNER: "delivery_partner",
  },
} as const;
