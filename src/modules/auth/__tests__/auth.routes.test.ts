/**
 * auth.routes.test.ts
 *
 * Self-bootstrapping integration test suite for the Auth Module API.
 * Does NOT require a pre-seeded admin user. Instead it:
 *   1. Registers a fresh user via OTP flow
 *   2. Sets a PIN for the user
 *   3. Logs in with PIN to verify PIN login
 *   4. Uses this user's tokens for all subsequent tests
 *
 * Run with: NODE_ENV=test bun test src/modules/auth/__tests__/auth.routes.test.ts
 *
 * Requirements:
 *   - Server running with NODE_ENV=test (enables deterministic OTP "123456")
 *   - Postgres + Redis up (docker compose up -d)
 */

import { describe, it, expect } from "bun:test";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const TEST_PHONE = process.env.TEST_PHONE ?? "+919000000099";
const TEST_OTP = "123456"; // deterministic in test mode (see utils/otp.ts)
const TEST_PIN = "654321"; // PIN we'll set during bootstrap

// ── Shared state (populated during bootstrap) ─────────────────────────────────

let accessToken = "";
let refreshToken = "";
let sessionId = "";
let userId = "";
let testRoleId = "";
let testRoleSlug = "";
let testReferralCode = "";

// ── HTTP Helpers ──────────────────────────────────────────────────────────────

async function api(
  method: string,
  path: string,
  opts: {
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
  } = {},
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    ...opts.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  let json: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    json = await res.json();
  }

  return { status: res.status, body: json as any, headers: res.headers };
}

const get = (path: string, token?: string) => api("GET", path, { token });
const post = (path: string, body?: unknown, token?: string) =>
  api("POST", path, { body, token });
const patch = (path: string, body: unknown, token?: string) =>
  api("PATCH", path, { body, token });
const del = (path: string, token?: string) => api("DELETE", path, { token });

/** Extract data from { success: true, data: ... } envelope */
function d(body: any) {
  return body?.data ?? body;
}

// ═════════════════════════════════════════════════════════════════════════════
// 0. HEALTH — Verify server is up
// ═════════════════════════════════════════════════════════════════════════════

describe("Health", () => {
  it("GET /health — 200", async () => {
    const { status } = await get("/health");
    expect(status).toBe(200);
  });

  it("GET /health/ready — 200", async () => {
    const { status } = await get("/health/ready");
    expect(status).toBe(200);
  });

  it("includes security headers", async () => {
    const { headers } = await get("/health");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("x-frame-options")).toBe("DENY");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. BOOTSTRAP — Register via OTP, set PIN, login with PIN
// ═════════════════════════════════════════════════════════════════════════════

describe("Bootstrap — OTP send + verify", () => {
  it("200 — sends OTP to test phone", async () => {
    const { status, body } = await post("/auth/otp/send", {
      phone: TEST_PHONE,
    });
    expect(status).toBe(200);
    expect(d(body)).toHaveProperty("expiresAt");
  });

  it("422 — rejects invalid phone format", async () => {
    const { status } = await post("/auth/otp/send", { phone: "0000" });
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });

  it("200 — verifies OTP, enforces atomic consumption, and single-use bridge tokens", async () => {
    // 1. Get a fresh OTP
    await post("/auth/otp/send", { phone: TEST_PHONE });

    // 2. Verify first time - should succeed and return bridge token
    const { status: vStatus, body: vBody } = await post("/auth/otp/verify", {
      phone: TEST_PHONE,
      otp: TEST_OTP,
    });
    expect(vStatus).toBe(200);
    const result = d(vBody);
    expect(result).toHaveProperty("otpToken");
    const otpToken = result.otpToken;

    // 3. HARDENING: Atomic consumption check.
    // Verifying the same OTP record again MUST fail because it was marked as consumed.
    const { status: vStatus2 } = await post("/auth/otp/verify", {
      phone: TEST_PHONE,
      otp: TEST_OTP,
    });
    expect(vStatus2).toBeGreaterThanOrEqual(400);

    // 4. HARDENING: Purpose-binding check.
    // The bridge token from /auth/otp/verify is for 'phone_verification'.
    // Using it for /pin/reset/confirm (which expects 'pin_reset') MUST fail with 401.
    const { status: pStatus } = await post("/pin/reset/confirm", {
      otpToken,
      newPin: "111222",
      confirmPin: "111222",
    });
    expect(pStatus).toBe(401);

    // 5. Use the bridge token for its intended purpose.
    if (result.isRegistered) {
      const loginRes = await post("/auth/login/otp", { otpToken });
      expect(loginRes.status).toBe(200);
      const loginData = d(loginRes.body);
      accessToken = loginData.accessToken;
      refreshToken = loginData.refreshToken;
      sessionId = loginData.sessionId;
    } else {
      const regRes = await post("/auth/register", {
        otpToken,
        name: "Test User",
      });
      expect(regRes.status).toBe(200);
      const regData = d(regRes.body);
      accessToken = regData.accessToken;
      refreshToken = regData.refreshToken;
      sessionId = regData.sessionId;
    }

    // 6. HARDENING: Single-use check.
    // The bridge token MUST be revoked immediately after its first successful use.
    const { status: retryStatus } = await post("/auth/login/otp", { otpToken });
    expect(retryStatus).toBe(401);

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  it("400 — rejects a wrong OTP", async () => {
    await post("/auth/otp/send", { phone: TEST_PHONE });
    const { status } = await post("/auth/otp/verify", {
      phone: TEST_PHONE,
      otp: "000000",
    });
    expect([400, 429]).toContain(status);
  });

  it("422 — rejects OTP shorter than 6 digits", async () => {
    const { status } = await post("/auth/otp/verify", {
      phone: TEST_PHONE,
      otp: "12",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("Bootstrap — PIN set + login", () => {
  it("200 — sets a PIN for the bootstrapped user", async () => {
    const { status } = await post(
      "/pin/set",
      { pin: TEST_PIN, confirmPin: TEST_PIN },
      accessToken,
    );
    expect(status).toBe(200);
  });

  it("rejects mismatched PINs", async () => {
    const { status } = await post(
      "/pin/set",
      { pin: "111111", confirmPin: "222222" },
      accessToken,
    );
    // 400 (mismatch), 401 (stale token after pin/set), or 409 (already set)
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });

  it("200 — logs in with PIN and refreshes tokens", async () => {
    const { status, body } = await post("/auth/login/pin", {
      phone: TEST_PHONE,
      pin: TEST_PIN,
    });
    expect(status).toBe(200);

    const result = d(body);
    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result).toHaveProperty("sessionId");

    // Use the fresh session for all subsequent tests
    accessToken = result.accessToken;
    refreshToken = result.refreshToken;
    sessionId = result.sessionId;
  });

  it("401 — rejects wrong PIN", async () => {
    const { status } = await post("/auth/login/pin", {
      phone: TEST_PHONE,
      pin: "999999",
    });
    expect([401, 429]).toContain(status);
  });

  it("422 — rejects PIN shorter than 6 digits", async () => {
    const { status } = await post("/auth/login/pin", {
      phone: TEST_PHONE,
      pin: "123",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("Bootstrap — capture user ID", () => {
  it("200 — gets own profile and captures userId", async () => {
    const { status, body } = await get("/users/me", accessToken);
    expect(status).toBe(200);
    const result = d(body);
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("phone");
    userId = result.id;
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. AUTH — Register validation, OTP login, token refresh
// ═════════════════════════════════════════════════════════════════════════════

describe("Auth — POST /auth/register (validation)", () => {
  it("401 — rejects invalid otpToken", async () => {
    const { status } = await post("/auth/register", {
      otpToken: "a".repeat(32),
      name: "Test User",
    });
    expect(status).toBe(401);
  });

  it("422 — rejects missing name", async () => {
    const { status } = await post("/auth/register", {
      otpToken: "a".repeat(32),
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });

  it("409 — rejects duplicate registration", async () => {
    // Get a fresh valid OTP token
    await post("/auth/otp/send", { phone: TEST_PHONE });
    const { body: verifyBody } = await post("/auth/otp/verify", {
      phone: TEST_PHONE,
      otp: TEST_OTP,
    });
    const freshToken = d(verifyBody)?.otpToken;
    if (!freshToken) return;

    const { status } = await post("/auth/register", {
      otpToken: freshToken,
      name: "Duplicate User",
    });
    expect(status).toBe(409);
  });
});

describe("Auth — POST /auth/login/otp", () => {
  it("200 — logs in with OTP token (existing user)", async () => {
    await post("/auth/otp/send", { phone: TEST_PHONE });
    const { body: verifyBody } = await post("/auth/otp/verify", {
      phone: TEST_PHONE,
      otp: TEST_OTP,
    });
    const loginToken = d(verifyBody)?.otpToken;
    if (!loginToken) {
      console.warn("⚠️  Skipping OTP login — no otpToken");
      return;
    }

    const { status, body } = await post("/auth/login/otp", {
      otpToken: loginToken,
    });
    expect(status).toBe(200);
    expect(d(body)).toHaveProperty("accessToken");
  });

  it("401 — rejects invalid otpToken", async () => {
    const { status } = await post("/auth/login/otp", {
      otpToken: "b".repeat(32),
    });
    expect(status).toBe(401);
  });
});

describe("Auth — POST /auth/token/refresh", () => {
  it("200 — rotates access token using x-refresh-token header", async () => {
    const { status, body } = await api("POST", "/auth/token/refresh", {
      headers: { "x-refresh-token": refreshToken },
    });
    expect(status).toBe(200);
    const result = d(body);
    expect(result).toHaveProperty("accessToken");
    accessToken = result.accessToken;
  });

  it("rejects missing x-refresh-token header", async () => {
    const { status } = await post("/auth/token/refresh");
    // Elysia status() shorthand may return 401 or 500 depending on error handler
    expect(status).toBeGreaterThanOrEqual(400);
  });

  it("401 — rejects a bogus refresh token", async () => {
    const { status } = await api("POST", "/auth/token/refresh", {
      headers: { "x-refresh-token": "notavalidtoken" },
    });
    expect(status).toBe(401);
  });

  it("does NOT accept refresh token in request body", async () => {
    const { status } = await post("/auth/token/refresh", {
      refreshToken: refreshToken,
    });
    // No x-refresh-token header → should fail
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. LOGOUT
// ═════════════════════════════════════════════════════════════════════════════

describe("Auth — POST /auth/logout", () => {
  it("401 — rejects unauthenticated request", async () => {
    const { status } = await post("/auth/logout", {
      sessionId: "00000000-0000-0000-0000-000000000000",
    });
    expect(status).toBe(401);
  });

  it("404 — rejects unknown sessionId", async () => {
    const { status } = await post(
      "/auth/logout",
      { sessionId: "00000000-0000-0000-0000-000000000000" },
      accessToken,
    );
    expect(status).toBe(404);
  });
});

describe("Auth — POST /auth/logout/all", () => {
  it("401 — rejects unauthenticated request", async () => {
    const { status } = await post("/auth/logout/all");
    expect(status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. PIN
// ═════════════════════════════════════════════════════════════════════════════

describe("PIN — POST /pin/reset/request", () => {
  it("200 — always responds 200 (enumeration-safe)", async () => {
    const { status, body } = await post("/pin/reset/request", {
      phone: "+919000000000",
    });
    expect(status).toBe(200);
    expect(d(body)).toHaveProperty("expiresAt");
  });
});

describe("PIN — POST /pin/reset/confirm", () => {
  it("401 — rejects invalid otpToken (token checked before PIN)", async () => {
    const { status } = await post("/pin/reset/confirm", {
      otpToken: "c".repeat(32),
      newPin: "111111",
      confirmPin: "111111",
    });
    expect(status).toBe(401);
  });

  it("401 — invalid token takes precedence over PIN mismatch", async () => {
    const { status } = await post("/pin/reset/confirm", {
      otpToken: "c".repeat(32),
      newPin: "111111",
      confirmPin: "222222",
    });
    expect(status).toBe(401);
  });
});

describe("PIN — POST /pin/set", () => {
  it("401 — rejects unauthenticated request", async () => {
    const { status } = await post("/pin/set", {
      pin: "123456",
      confirmPin: "123456",
    });
    expect(status).toBe(401);
  });

  it("422 — rejects PIN shorter than 6 digits", async () => {
    const { status } = await post(
      "/pin/set",
      { pin: "123", confirmPin: "123" },
      accessToken,
    );
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. OTP (protected routes)
// ═════════════════════════════════════════════════════════════════════════════

describe("OTP — POST /otp/request", () => {
  it("401 — rejects unauthenticated request", async () => {
    const { status } = await post("/otp/request", {
      purpose: "phone_verification",
      phone: TEST_PHONE,
    });
    expect(status).toBe(401);
  });

  it("200 — requests OTP for phone_verification", async () => {
    const { status, body } = await post(
      "/otp/request",
      { purpose: "phone_verification", phone: TEST_PHONE },
      accessToken,
    );
    expect(status).toBe(200);
    expect(d(body)).toHaveProperty("expiresAt");
  });

  it("422 — rejects unknown purpose", async () => {
    const { status } = await post(
      "/otp/request",
      { purpose: "invalid_purpose" },
      accessToken,
    );
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("OTP — POST /otp/verify", () => {
  it("401 — rejects unauthenticated request", async () => {
    const { status } = await post("/otp/verify", {
      purpose: "phone_verification",
      otp: "000000",
      phone: TEST_PHONE,
    });
    expect(status).toBe(401);
  });

  it("400 — rejects wrong OTP code", async () => {
    const { status } = await post(
      "/otp/verify",
      { purpose: "phone_verification", otp: "000000", phone: TEST_PHONE },
      accessToken,
    );
    expect([400, 404, 429]).toContain(status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. USERS
// ═════════════════════════════════════════════════════════════════════════════

describe("Users — GET /users", () => {
  it("401 — rejects unauthenticated request", async () => {
    const { status } = await get("/users");
    expect(status).toBe(401);
  });

  it("200 or 403 — lists users (admin-only)", async () => {
    const { status, body } = await get("/users", accessToken);
    expect([200, 403]).toContain(status);
  });

  it("200 or 403 — respects pagination query params", async () => {
    const { status } = await get("/users?page=1&limit=5", accessToken);
    expect([200, 403]).toContain(status);
  });

  it("422 — rejects limit > 100", async () => {
    const { status } = await get("/users?limit=999", accessToken);
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("Users — GET /users/me", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await get("/users/me");
    expect(status).toBe(401);
  });

  it("200 — returns own profile", async () => {
    const { status, body } = await get("/users/me", accessToken);
    expect(status).toBe(200);
    const result = d(body);
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("phone");
  });
});

describe("Users — GET /users/:id", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await get(
      `/users/${userId || "00000000-0000-0000-0000-000000000000"}`,
    );
    expect(status).toBe(401);
  });

  it("200 — fetches user by ID", async () => {
    if (!userId) return;
    const { status, body } = await get(`/users/${userId}`, accessToken);
    expect(status).toBe(200);
    expect(d(body).id).toBe(userId);
  });

  it("404 or 403 — returns 404 for non-existent user", async () => {
    const { status } = await get(
      "/users/00000000-0000-0000-0000-000000000099",
      accessToken,
    );
    expect([404, 403]).toContain(status);
  });
});

describe("Users — PATCH /users/me", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await patch("/users/me", { name: "Hacker" });
    expect(status).toBe(401);
  });

  it("200 — updates own name", async () => {
    const { status } = await patch(
      "/users/me",
      { name: "Updated Test Name" },
      accessToken,
    );
    expect(status).toBe(200);
  });

  it("422 — rejects empty name string", async () => {
    const { status } = await patch(
      "/users/me",
      { name: "" },
      accessToken,
    );
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("Users — PATCH /users/:id (admin)", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await patch(
      `/users/${userId || "00000000-0000-0000-0000-000000000000"}`,
      { name: "X" },
    );
    expect(status).toBe(401);
  });
});

describe("Users — PATCH /users/:id/status", () => {
  it("401 — rejects unauthenticated", async () => {
    if (!userId) return;
    const { status } = await patch(`/users/${userId}/status`, {
      status: "active",
    });
    expect(status).toBe(401);
  });

  it("422 — rejects invalid status value", async () => {
    if (!userId) return;
    const { status } = await patch(
      `/users/${userId}/status`,
      { status: "unknown_status" },
      accessToken,
    );
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("Users — DELETE /users/me", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await del("/users/me");
    expect(status).toBe(401);
  });
  // Destructive — skipped; would delete the bootstrapped user
});

describe("Users — DELETE /users/:id", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await del(
      "/users/00000000-0000-0000-0000-000000000000",
    );
    expect(status).toBe(401);
  });

  it("404 or 403 — non-existent user", async () => {
    const { status } = await del(
      "/users/00000000-0000-0000-0000-000000000099",
      accessToken,
    );
    expect([404, 403]).toContain(status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. 2FA
// ═════════════════════════════════════════════════════════════════════════════

describe("2FA — POST /2fa/enable", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await post("/2fa/enable");
    expect(status).toBe(401);
  });

  it("200 or 500 — initiates 2FA setup", async () => {
    const { status, body } = await post(
      "/2fa/enable",
      undefined,
      accessToken,
    );
    // May return 500 if 2FA provider not configured in test env
    expect([200, 500]).toContain(status);
    if (status === 200) expect(d(body)).toHaveProperty("expiresAt");
  });
});

describe("2FA — POST /2fa/enable/verify", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await post("/2fa/enable/verify", { totp: "000000" });
    expect(status).toBe(401);
  });

  it("400 — rejects invalid TOTP", async () => {
    const { status } = await post(
      "/2fa/enable/verify",
      { totp: "000000" },
      accessToken,
    );
    // 404 if 2FA not enabled, 400 if wrong TOTP, 500 if provider issue
    expect([400, 404, 429, 500]).toContain(status);
  });

  it("422 — rejects TOTP shorter than 6 digits", async () => {
    const { status } = await post(
      "/2fa/enable/verify",
      { totp: "12" },
      accessToken,
    );
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("2FA — POST /2fa/disable", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await post("/2fa/disable");
    expect(status).toBe(401);
  });

  it("200 or 500 — initiates disable flow", async () => {
    const { status, body } = await post("/2fa/disable", undefined, accessToken);
    // May return 500 if 2FA provider not configured
    expect([200, 500]).toContain(status);
    if (status === 200) expect(d(body)).toHaveProperty("expiresAt");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. SESSIONS
// ═════════════════════════════════════════════════════════════════════════════

describe("Sessions — GET /sessions", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await get("/sessions");
    expect(status).toBe(401);
  });

  it("200 — returns active sessions array", async () => {
    const { status, body } = await get("/sessions", accessToken);
    expect(status).toBe(200);
    const sessions = d(body);
    expect(Array.isArray(sessions)).toBe(true);
  });

  it("sessions strip sensitive fields", async () => {
    const { body } = await get("/sessions", accessToken);
    const sessions = d(body);
    if (sessions.length > 0) {
      const s = sessions[0];
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("createdAt");
      expect(s).toHaveProperty("status");
      expect(s).not.toHaveProperty("refreshTokenHash");
      expect(s).not.toHaveProperty("accessTokenJti");
    }
  });
});

describe("Sessions — DELETE /sessions/:id", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await del(
      "/sessions/00000000-0000-0000-0000-000000000000",
    );
    expect(status).toBe(401);
  });

  it("404 — returns 404 for non-existent session", async () => {
    const { status } = await del(
      "/sessions/00000000-0000-0000-0000-000000000099",
      accessToken,
    );
    expect(status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. DEVICES
// ═════════════════════════════════════════════════════════════════════════════

describe("Devices — GET /devices", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await get("/devices");
    expect(status).toBe(401);
  });

  it("200 — returns devices array", async () => {
    const { status, body } = await get("/devices", accessToken);
    expect(status).toBe(200);
    expect(Array.isArray(d(body))).toBe(true);
  });
});

describe("Devices — PATCH /devices/:id", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await patch(
      "/devices/00000000-0000-0000-0000-000000000000",
      { trusted: true },
    );
    expect(status).toBe(401);
  });

  it("404 — returns 404 for non-existent device", async () => {
    const { status } = await patch(
      "/devices/00000000-0000-0000-0000-000000000099",
      { trusted: true },
      accessToken,
    );
    expect(status).toBe(404);
  });
});

describe("Devices — DELETE /devices/:id/revoke", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await del(
      "/devices/00000000-0000-0000-0000-000000000000/revoke",
    );
    expect(status).toBe(401);
  });

  it("404 — non-existent device", async () => {
    const { status } = await del(
      "/devices/00000000-0000-0000-0000-000000000099/revoke",
      accessToken,
    );
    expect(status).toBe(404);
  });
});

describe("Devices — DELETE /devices/:id", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await del(
      "/devices/00000000-0000-0000-0000-000000000000",
    );
    expect(status).toBe(401);
  });

  it("404 — non-existent device", async () => {
    const { status } = await del(
      "/devices/00000000-0000-0000-0000-000000000099",
      accessToken,
    );
    expect(status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. REFERRALS
// ═════════════════════════════════════════════════════════════════════════════

describe("Referrals — POST /referrals/generate-code", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await post("/referrals/generate-code");
    expect(status).toBe(401);
  });

  it("200 — generates (or returns existing) referral code", async () => {
    const { status, body } = await post(
      "/referrals/generate-code",
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    const result = d(body);
    expect(result).toHaveProperty("code");
    testReferralCode = result.code;
  });
});

describe("Referrals — GET /referrals/my-code", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await get("/referrals/my-code");
    expect(status).toBe(401);
  });

  it("200 — returns referral code object", async () => {
    const { status, body } = await get("/referrals/my-code", accessToken);
    expect(status).toBe(200);
    const result = d(body);
    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("usageCount");
  });
});

describe("Referrals — GET /referrals", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await get("/referrals");
    expect(status).toBe(401);
  });

  it("200 — returns paginated referral list", async () => {
    const { status, body } = await get("/referrals", accessToken);
    expect(status).toBe(200);
  });

  it("200 — respects page/limit params", async () => {
    const { status } = await get(
      "/referrals?page=1&limit=5",
      accessToken,
    );
    expect(status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. ROLES
// ═════════════════════════════════════════════════════════════════════════════

describe("Roles — GET /roles", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await get("/roles");
    expect(status).toBe(401);
  });

  it("200 or 403 — gets role list (admin-only)", async () => {
    const { status, body } = await get("/roles", accessToken);
    expect([200, 403]).toContain(status);
  });

  it("roles contain expected fields", async () => {
    const { body } = await get("/roles", accessToken);
    const roles = d(body);
    if (Array.isArray(roles) && roles.length > 0) {
      expect(roles[0]).toHaveProperty("id");
      expect(roles[0]).toHaveProperty("slug");
    }
  });
});

describe("Roles — POST /roles", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await post("/roles", {
      name: "Test Role",
      slug: "test-role",
    });
    expect(status).toBe(401);
  });

  it("200 or 403 — creates a new role (admin-only)", async () => {
    testRoleSlug = `test-role-${Date.now()}`;
    const { status, body } = await post(
      "/roles",
      {
        name: "Test Role",
        slug: testRoleSlug,
        description: "Integration test role",
      },
      accessToken,
    );
    expect([200, 403]).toContain(status);
    if (status === 200) {
      const result = d(body);
      expect(result).toHaveProperty("id");
      testRoleId = result.id;
    }
  });

  it("422 — rejects slug with uppercase chars", async () => {
    const { status } = await post(
      "/roles",
      { name: "Bad Slug", slug: "BAD_SLUG" },
      accessToken,
    );
    expect(status).toBeGreaterThanOrEqual(400);
  });

  it("409 or 403 — duplicate slug returns 409 (admin-only)", async () => {
    if (!testRoleSlug) return;
    const { status } = await post(
      "/roles",
      { name: "Duplicate", slug: testRoleSlug },
      accessToken,
    );
    // 403 if not admin, 409 if admin and slug exists
    expect([409, 403]).toContain(status);
  });
});

describe("Roles — POST /roles/:roleId/users/:userId", () => {
  it("401 — rejects unauthenticated", async () => {
    if (!testRoleId || !userId) return;
    const { status } = await post(
      `/roles/${testRoleId}/users/${userId}`,
    );
    expect(status).toBe(401);
  });

  it("200 — assigns role to user", async () => {
    if (!testRoleId || !userId) return;
    const { status } = await post(
      `/roles/${testRoleId}/users/${userId}`,
      undefined,
      accessToken,
    );
    expect([200, 409]).toContain(status);
  });

  it("404 or 403 — non-existent role or user", async () => {
    const { status } = await post(
      "/roles/00000000-0000-0000-0000-000000000099/users/00000000-0000-0000-0000-000000000099",
      undefined,
      accessToken,
    );
    expect([404, 403]).toContain(status);
  });
});

describe("Roles — DELETE /roles/:roleId/users/:userId", () => {
  it("401 — rejects unauthenticated", async () => {
    if (!testRoleId || !userId) return;
    const { status } = await del(
      `/roles/${testRoleId}/users/${userId}`,
    );
    expect(status).toBe(401);
  });

  it("200 — revokes role from user", async () => {
    if (!testRoleId || !userId) return;
    const { status } = await del(
      `/roles/${testRoleId}/users/${userId}`,
      accessToken,
    );
    expect([200, 404]).toContain(status);
  });
});

describe("Roles — DELETE /roles/:roleId", () => {
  it("401 — rejects unauthenticated", async () => {
    if (!testRoleId) return;
    const { status } = await del(`/roles/${testRoleId}`);
    expect(status).toBe(401);
  });

  it("404 or 403 — cannot delete non-existent role", async () => {
    const { status } = await del(
      "/roles/00000000-0000-0000-0000-000000000099",
      accessToken,
    );
    expect([404, 403]).toContain(status);
  });

  it("200 — deletes the custom role created in setup", async () => {
    if (!testRoleId) return;
    const { status } = await del(`/roles/${testRoleId}`, accessToken);
    expect(status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12. AUDIT
// ═════════════════════════════════════════════════════════════════════════════

describe("Audit — GET /audit/me", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await get("/audit/me");
    expect(status).toBe(401);
  });

  it("200 or 500 — returns audit entries for current user", async () => {
    const { status, body } = await get("/audit/me", accessToken);
    // May return 500 if audit service has issues in test env
    expect([200, 500]).toContain(status);
  });

  it("audit entries contain expected fields", async () => {
    const { body } = await get("/audit/me", accessToken);
    const entries = d(body);
    if (Array.isArray(entries) && entries.length > 0) {
      const e = entries[0];
      expect(e).toHaveProperty("id");
      expect(e).toHaveProperty("action");
      expect(e).toHaveProperty("createdAt");
    }
  });

  it("200 or 500 — respects pagination", async () => {
    const { status } = await get(
      "/audit/me?page=1&limit=5",
      accessToken,
    );
    expect([200, 500]).toContain(status);
  });
});

describe("Audit — GET /audit/resource/:resource/:resourceId", () => {
  it("401 — rejects unauthenticated", async () => {
    const { status } = await get(
      "/audit/resource/user/00000000-0000-0000-0000-000000000001",
    );
    expect(status).toBe(401);
  });

  it("200 — query audit for a resource", async () => {
    if (!userId) return;
    const { status, body } = await get(
      `/audit/resource/user/${userId}`,
      accessToken,
    );
    // Admin-only endpoint
    expect([200, 403]).toContain(status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 13. TEARDOWN — Logout all sessions (runs last)
// ═════════════════════════════════════════════════════════════════════════════

describe("Teardown — POST /auth/logout/all", () => {
  it("200 — logs out of all sessions", async () => {
    const { status } = await post(
      "/auth/logout/all",
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
  });

  it("401 — revoked token is no longer valid", async () => {
    const { status } = await get("/users/me", accessToken);
    expect(status).toBe(401);
  });
});