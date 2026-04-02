/**
 * core/logger.ts
 *
 * Pino logger — structured JSON in production, pretty-printed in development.
 * Use this everywhere instead of console.log.
 * Sensitive fields are automatically redacted from all log output.
 */

import pino from "pino";

const nodeEnv = process.env.NODE_ENV || "development";

export const logger = pino({
  level: nodeEnv === "production" ? "info" : "debug",

  ...(nodeEnv !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),

  // Redact secrets from logs — they'll show as "[REDACTED]"
  redact: {
    paths: [
      "*.pin",
      "*.pinHash",
      "*.otpHash",
      "*.refreshToken",
      "*.refreshTokenHash",
      "*.accessTokenJti",
      "req.headers.authorization",
      "*.authorization",
      "*.password",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
});

export type Logger = typeof logger;
