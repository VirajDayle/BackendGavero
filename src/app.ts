// app.ts
import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { swagger } from "@elysiajs/swagger"

export const app = new Elysia({ prefix: "/api" })

// Global Middleware
.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
)

// Swagger Documentation
.use(
  swagger({
    path: "/docs",
    documentation: {
      info: {
        title: "My API",
        version: "1.0.0",
      },
    },
  })
)

// Health check
.get("/health", () => ({
  status: "ok",
}))
