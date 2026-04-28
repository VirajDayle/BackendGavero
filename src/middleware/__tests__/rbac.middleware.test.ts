import { describe, it, expect, vi, beforeEach, beforeAll } from "bun:test";
import { rbacGuard, rbacPlugin } from "../rbac.middleware";
import { AuthErrors } from "../../modules/auth/auth.errors";
import { roleCache } from "../../lib/role-cache";
import { ROLES } from "../../shared/constants/auth.constants";
import Elysia from "elysia";

// Mock DB to prevent hanging connections from transitive imports
vi.mock("../../db", () => ({
  db: {
    query: {},
    select: () => ({ from: () => ({ where: () => [] }) }),
  },
}));

// Mock Redis to prevent hanging connections
vi.mock("../../config/redis", () => ({
  redis: {
    get: () => null,
    set: () => null,
    quit: () => Promise.resolve(),
    on: () => ({}),
  },
}));

beforeAll(() => {
  // Mock data for role cache
  roleCache.load([
    { id: "admin-uuid", slug: ROLES.ADMIN },
    { id: "superadmin-uuid", slug: ROLES.SUPER_ADMIN },
    { id: "customer-uuid", slug: ROLES.CUSTOMER },
  ]);
});

describe("rbacGuard (Hook)", () => {
  const allowedRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
  const guard = rbacGuard(allowedRoles);

  it("should throw unauthorized error if user is missing", () => {
    expect(() => guard({ user: undefined } as any)).toThrow();
  });

  it("should throw forbidden error if user does not have required roles", () => {
    const user = { id: "1", roleIds: ["customer-uuid"] };
    expect(() => guard({ user } as any)).toThrow();
  });

  it("should allow access if user has one of the required roles", () => {
    const user = { id: "1", roleIds: ["admin-uuid"] };
    expect(() => guard({ user } as any)).not.toThrow();
  });

  it("should allow access if user has multiple roles including a required one", () => {
    const user = { id: "1", roleIds: ["customer-uuid", "superadmin-uuid"] };
    expect(() => guard({ user } as any)).not.toThrow();
  });

  it("should allow access if user is super admin and only admin is required", () => {
    const guard = rbacGuard([ROLES.ADMIN]);
    const user = { id: "1", roleIds: ["superadmin-uuid"] };
    // This depends on the cache setup in beforeAll
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
      .derive(() => ({ user: { id: "test-uid", roleIds: ["customer-uuid"] } }))
      .use(rbacPlugin([ROLES.ADMIN]))
      .get("/", () => "OK");

    const response = await app.handle(new Request("http://localhost/"));
    expect(response.status).toBe(403);
    const body: any = await response.json();
    expect(body.code).toBe("FORBIDDEN");
  });

  it("should allow request if user has correct role", async () => {
    const app = new Elysia()
      .derive(() => ({ user: { id: "admin-uid", roleIds: ["admin-uuid"] } }))
      .use(rbacPlugin([ROLES.ADMIN]))
      .get("/", () => "OK");

    const response = await app.handle(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });
});
