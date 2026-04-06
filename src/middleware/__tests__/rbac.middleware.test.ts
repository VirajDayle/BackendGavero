import { describe, it, expect, vi, beforeEach } from "bun:test";
import { rbacGuard, rbacPlugin } from "../rbac.middleware";
import { AuthErrors } from "../../modules/auth/auth.errors";
import Elysia from "elysia";

describe("rbacGuard (Hook)", () => {
  const allowedRoles = ["admin", "superadmin"];
  const guard = rbacGuard(allowedRoles);

  it("should throw unauthorized error if user is missing", () => {
    expect(() => guard({ user: undefined } as any)).toThrow();
  });

  it("should throw forbidden error if user does not have required roles", () => {
    const user = { id: "1", roles: ["customer"] };
    expect(() => guard({ user } as any)).toThrow();
  });

  it("should allow access if user has one of the required roles", () => {
    const user = { id: "1", roles: ["admin"] };
    expect(() => guard({ user } as any)).not.toThrow();
  });

  it("should allow access if user has multiple roles including a required one", () => {
    const user = { id: "1", roles: ["customer", "superadmin"] };
    expect(() => guard({ user } as any)).not.toThrow();
  });
});

import { AppError } from "../../core/errors";

describe("rbacPlugin (Plugin)", () => {
  it("should integrate with Elysia and throw forbidden for wrong role", async () => {
    const app = new Elysia()
      .error({ APP_ERROR: AppError })
      .onError(({ error, set }) => {
        if (error instanceof AppError) {
          set.status = error.statusCode;
          return { code: error.code, message: error.message };
        }
      })
      .derive(() => ({ user: { id: "test-uid", roles: ["customer"] } }))
      .use(rbacPlugin(["admin"]))
      .get("/", () => "OK");

    const response = await app.handle(new Request("http://localhost/"));
    expect(response.status).toBe(403);
    const body: any = await response.json();
    expect(body.code).toBe("FORBIDDEN");
  });

  it("should allow request if user has correct role", async () => {
    const app = new Elysia()
      .derive(() => ({ user: { id: "admin-uid", roles: ["admin"] } }))
      .use(rbacPlugin(["admin"]))
      .get("/", () => "OK");

    const response = await app.handle(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });
});
