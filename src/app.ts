/**
 * app.ts
 *
 * Main Elysia application instance.
 * Wires all plugins, middleware, and route modules together.
 *
 * Mount order matters:
 *   1. requestIdPlugin   — attach unique requestId to every request
 *   2. loggerPlugin      — log req/res + extract ip/userAgent/deviceInfo into ctx
 *   3. errorPlugin       — global error handler (wraps everything below)
 *   4. dbPlugin          — expose db on ctx
 *   5. redisPlugin       — expose redis on ctx
 *   6. jwtAuthPlugin     — verify Bearer JWT, populate ctx.user (global scope)
 *   7. swagger           — API docs at /docs
 *   8. Public route groups with rate limiters
 *   9. Protected route groups
 */

import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { sql } from "drizzle-orm";

// Plugins
import { dbPlugin } from "./plugins/db.plugin"; //0
import { redisPlugin } from "./plugins/redis.plugin";

// Middleware
import { requestIdPlugin } from "./middleware/requestId.middleware";
import { loggerPlugin } from "./middleware/logger.middleware";
import { errorPlugin } from "./middleware/error.middleware";

// Auth module
import { authPlugin } from "./modules/auth/auth.routes";

// Profile module
import { profilePlugin } from "./modules/profile/profile.routes";

// Platform module
import { platformPlugin } from "./modules/platform/platform.routes";

// Shop module
import { shopPlugin } from "./modules/shop/shop.routes";

// Catalog module
import { catalogPlugin } from "./modules/catalog/catalog.routes";

// Webhooks
import { cashfreeRpdWebhookPlugin } from "./modules/webhooks/cashfree-rpd-webhook.routes";
import { cashfreeDigilockerWebhookPlugin } from "./modules/webhooks/cashfree-digilocker-webhook.routes";

// Config
import { env } from "./config/env";
import { responsePlugin } from "./middleware/response.middleware";

export const app = new Elysia()

  // ── 1. Request ID — must be first so all other middleware can use requestId ──
  .use(requestIdPlugin)

  // ── 2. Logger + context extraction (ip, userAgent, deviceInfo) ────────────
  .use(loggerPlugin)

  // ── 3. CORS ────────────────────────────────────────────────────────────────
  .use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token", "x-request-id"],
      credentials: true,
    }),
  )

  // ── 4. Security headers ────────────────────────────────────────────────────
  .onAfterHandle(({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    set.headers["X-XSS-Protection"] = "0"; // modern browsers: CSP is preferred
    if (env.NODE_ENV === "production") {
      set.headers["Strict-Transport-Security"] =
        "max-age=31536000; includeSubDomains";
    }
  })

  // ── 5. Global error handler ───────────────────────────────────────────────
  .use(responsePlugin)
  .use(errorPlugin)

  // ── 6. DB + Redis on ctx ──────────────────────────────────────────────────
  .use(dbPlugin)
  .use(redisPlugin)

  // ── 7. Swagger docs ───────────────────────────────────────────────────────
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "My API",
          version: "1.0.0",
          description: "Auto-generated from Elysia route definitions",
        },
        tags: [
          {
            name: "Auth",
            description:
              "OTP send/verify, registration, PIN login, OTP login, token refresh, logout",
          },
          {
            name: "OTP",
            description:
              "Non-auth OTP flows: email verification, 2FA setup, account deletion",
          },
          {
            name: "PIN",
            description: "PIN set, reset request, and reset confirmation",
          },
          {
            name: "2FA",
            description:
              "Two-factor authentication enable, verify, and disable",
          },
          {
            name: "Users",
            description: "User profile management and admin status controls",
          },
          { name: "Sessions", description: "Session listing and revocation" },
          {
            name: "Roles",
            description:
              "RBAC role management and user-role assignment (admin)",
          },
          {
            name: "Referrals",
            description: "Referral codes and referral tracking",
          },
          {
            name: "Devices",
            description: "Device fingerprint trust, revocation, and removal",
          },
          {
            name: "Audit",
            description:
              "Immutable audit log — per-user and per-resource queries",
          },
          { name: "Health", description: "Liveness and readiness probes" },
          // Profile module
          {
            name: "Profile",
            description: "Composite user profile aggregating all role profiles",
          },
          {
            name: "Addresses",
            description: "User address CRUD with default management",
          },
          {
            name: "Bank Accounts",
            description: "Bank account management with encrypted storage",
          },
          {
            name: "KYC",
            description: "KYC document submission and admin review",
          },
          {
            name: "Shop Owners",
            description: "Shop owner onboarding and profile management",
          },
          {
            name: "Delivery Partners",
            description:
              "Delivery partner onboarding, status, location, and ratings",
          },
          {
            name: "Customers",
            description: "Customer profile, preferences, and loyalty points",
          },
          {
            name: "Platform",
            description: "General platform services: location, geocoding, and static data",
          },
          {
            name: "Platform Admin",
            description: "Admin-level configuration for cities and pincodes",
          },
          // Profile Admin tags
          {
            name: "Admin — KYC",
            description: "Admin review and verification of KYC documents",
          },
          {
            name: "Admin — Shop Owners",
            description: "Admin management and suspension of shop owner profiles",
          },
          {
            name: "Admin — Delivery Partners",
            description: "Admin management and suspension of delivery partner profiles",
          },
          {
            name: "Admin — Bank Accounts",
            description: "Admin verification of user bank accounts",
          },
          // Webhooks
          {
            name: "Webhooks",
            description: "Machine-to-machine callbacks from payment providers (Cashfree RPD, etc.)",
          },
          // Shop module
          {
            name: "Shops",
            description: "Shop listing, creation, and management",
          },
          {
            name: "Branches",
            description: "Shop branch management and operating hours",
          },
          {
            name: "Catalog",
            description: "Shop types and category browsing",
          },
          // Catalog module
          {
            name: "Brands",
            description: "Brand management and category associations",
          },
          {
            name: "Master Products",
            description: "Platform-wide master product catalog (admin)",
          },
          {
            name: "Shop Products",
            description: "Per-shop product listings, variants, and images",
          },
          {
            name: "Product Pricing",
            description: "Product pricing, discounts, and bulk tiers",
          },
          {
            name: "Collections",
            description: "Shop product collections and groupings",
          },
          {
            name: "Bundles",
            description: "Product bundles and combo deals",
          },
          {
            name: "Announcements",
            description: "Shop announcements and banners",
          },
          {
            name: "Product Q&A",
            description: "Product questions and answers",
          },
          {
            name: "Saved Items",
            description: "Saved-for-later and wishlists",
          },
          {
            name: "Product Links",
            description: "Cross-sell, upsell, and related product links",
          },
          {
            name: "Daily Picks",
            description: "Daily featured product picks and merchandising",
          },
          {
            name: "Coupons",
            description: "Shop coupons, discounts, and promotional codes",
          },
        ],
        components: {
          securitySchemes: {
            // Defines the Bearer scheme so individual routes can reference it.
            // Not applied globally — only routes with `security` in their
            // detail will show the lock icon in Swagger UI.
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          },
        },
        // ↓ Removed global security: [{ bearerAuth: [] }]
        // That was forcing every endpoint (including /docs and /health)
        // to show as requiring auth in Swagger UI.
      },
    }),
  )

  // ── 8. Health probes ──────────────────────────────────────────────────────

  .get("/health", () => ({ status: "ok" }), {
    detail: { tags: ["Health"], summary: "Liveness probe" },
  })
  .get("/health/ready", async ({ db, redis }) => {
    try {
      await Promise.all([
        db.execute(sql`SELECT 1`),
        redis.ping()
      ]);
      return { status: "ok", db: true, redis: true };
    } catch (err) {
      return { status: "error", db: false, redis: false };
    }
  }, {
    detail: { tags: ["Health"], summary: "Readiness probe" },
  })

  // ── 9. Auth routes (rate limiting is per-route inside auth.routes.ts) ─────

  .use(authPlugin)

  // ── 10. Profile routes ────────────────────────────────────────────────────

  .use(profilePlugin)

  // ── 11. Platform routes ───────────────────────────────────────────────────

  .use(platformPlugin)

  // ── 12. Shop routes ───────────────────────────────────────────────────────

  .use(shopPlugin)

  // ── 13. Catalog routes ────────────────────────────────────────────────────

  .use(catalogPlugin)

  // ── 14. Webhook receivers (no JWT — machine-to-machine) ───────────────────

  .use(cashfreeRpdWebhookPlugin)
  .use(cashfreeDigilockerWebhookPlugin);

export type App = typeof app;
