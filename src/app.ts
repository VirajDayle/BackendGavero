// app.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db/index";

export const app = new Elysia({ prefix: "/api" })

  // Global Middleware
  .use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: true,
    }),
  )

  // Swagger Documentation
  .use(
    swagger({
      path: "api/docs",
      documentation: {
        info: {
          title: "My API",
          version: "1.0.0",
        },
      },
    }),
  )

  // Health check
  .get("/health", () => ({
    status: "ok",
  }))

  .get("/health/db", async () => {
    await db.execute(`SELECT 1`);
    return { status: "Database working ✅" };
  });
