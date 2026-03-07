import { t } from "elysia";

export const envSchema = t.Object({
  DATABASE_URL: t.String(),
  ACCESS_SECRET: t.String(),
  REFRESH_SECRET: t.String(),
  CORS_ORIGIN: t.String(),
  PORT: t.Number(),
});

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  ACCESS_SECRET: process.env.ACCESS_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  PORT: process.env.PORT,
};
