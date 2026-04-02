/**
 * config/env.ts
 *
 * Single source of truth for all environment variables.
 * Validated at startup — process exits immediately with a clear message
 * if any required variable is missing or wrong.
 * Import `env` everywhere. Never use process.env directly.
 */

import { z } from "zod";
import { logger } from "../core/logger";

const schema = z
  .object({
    // Server
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default("0.0.0.0"),

    // Database
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),

    // Redis
    REDIS_URL: z.string().default("redis://localhost:6379"),


    // JWT
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_ACCESS_TTL_MIN: z.coerce.number().int().positive().default(15),
    JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

    // OTP bridge token (short-lived JWT after phone verify)
    OTP_TOKEN_SECRET: z
      .string()
      .min(32, "OTP_TOKEN_SECRET must be at least 32 characters"),
    OTP_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(5),
    OTP_TTL_MIN: z.coerce.number().int().positive().default(10),

    // SMS
    SMS_PROVIDER: z.enum(["msg91", "fast2sms", "twilio", "dev"]).default("dev"),
    MSG91_AUTH_KEY: z.string().optional(),
    MSG91_TEMPLATE_ID: z.string().optional(),
    FAST2SMS_API_KEY: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),

    // Email
    EMAIL_PROVIDER: z.enum(["resend", "sendgrid", "dev"]).default("dev"),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
    SENDGRID_API_KEY: z.string().optional(),
    SENDGRID_FROM_EMAIL: z.string().email().optional(),

    // Rate limiting — general
    RATE_LIMIT_WINDOW_MIN: z.coerce.number().int().positive().default(15),
    RATE_LIMIT_BYPASS: z.coerce.boolean().default(false),
    TRUST_PROXY: z.coerce.boolean().default(false),

    // Rate limiting — per-action IP caps
    RATE_LIMIT_OTP_SEND_MAX: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_OTP_VERIFY_MAX: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_LOGIN_PIN_MAX: z.coerce.number().int().positive().default(5),
    RATE_LIMIT_LOGIN_OTP_MAX: z.coerce.number().int().positive().default(5),
    RATE_LIMIT_PIN_RESET_MAX: z.coerce.number().int().positive().default(3),
    RATE_LIMIT_REFRESH_MAX: z.coerce.number().int().positive().default(20),

    // Rate limiting — window / cooldown overrides
    RATE_LIMIT_OTP_WINDOW_SEC: z.coerce.number().int().positive().default(900),
    RATE_LIMIT_COOLDOWN_SEC: z.coerce.number().int().positive().default(30),

    // Encryption (AES-256-GCM for bank account numbers, KYC document numbers, etc.)
    ENCRYPTION_KEY: z.string().length(64, "ENCRYPTION_KEY must be a 64-char hex string (32 bytes)").optional(),

    // Mapbox API
    MAPBOX_ACCESS_TOKEN: z.string().min(1, "Mapbox Access Token is required"),

    // CORS
    CORS_ORIGIN: z.string().default("*"),
  })
  .superRefine((d, ctx) => {
    const need = (key: string, cond: string) =>
      ctx.addIssue({
        code: "custom",
        path: [key],
        message: `${key} required when ${cond}`,
      });

    if (d.SMS_PROVIDER === "msg91") {
      if (!d.MSG91_AUTH_KEY) need("MSG91_AUTH_KEY", "SMS_PROVIDER=msg91");
      if (!d.MSG91_TEMPLATE_ID) need("MSG91_TEMPLATE_ID", "SMS_PROVIDER=msg91");
    }
    if (d.SMS_PROVIDER === "fast2sms") {
      if (!d.FAST2SMS_API_KEY)
        need("FAST2SMS_API_KEY", "SMS_PROVIDER=fast2sms");
    }
    if (d.SMS_PROVIDER === "twilio") {
      if (!d.TWILIO_ACCOUNT_SID)
        need("TWILIO_ACCOUNT_SID", "SMS_PROVIDER=twilio");
      if (!d.TWILIO_AUTH_TOKEN)
        need("TWILIO_AUTH_TOKEN", "SMS_PROVIDER=twilio");
      if (!d.TWILIO_PHONE_NUMBER)
        need("TWILIO_PHONE_NUMBER", "SMS_PROVIDER=twilio");
    }
    if (d.EMAIL_PROVIDER === "resend") {
      if (!d.RESEND_API_KEY) need("RESEND_API_KEY", "EMAIL_PROVIDER=resend");
      if (!d.RESEND_FROM_EMAIL)
        need("RESEND_FROM_EMAIL", "EMAIL_PROVIDER=resend");
    }
    if (d.EMAIL_PROVIDER === "sendgrid") {
      if (!d.SENDGRID_API_KEY)
        need("SENDGRID_API_KEY", "EMAIL_PROVIDER=sendgrid");
      if (!d.SENDGRID_FROM_EMAIL)
        need("SENDGRID_FROM_EMAIL", "EMAIL_PROVIDER=sendgrid");
    }
  });

const result = schema.safeParse(process.env);

if (!result.success) {
  logger.error("\n❌  Invalid environment variables:\n");
  for (const issue of result.error.issues) {
    logger.error(`   ${issue.path.join(".")}  →  ${issue.message}`);
  }
  logger.error("\nFix the above in your .env and restart.\n");
  process.exit(1);
}

export const env = result.data;
export type Env = typeof env;
