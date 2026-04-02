import { describe, it, expect, beforeAll } from "bun:test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const TEST_OTP = "123456";

function getUniquePhone() {
  return `+9198${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
}

async function post(path: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: any = null;
  if (res.headers.get("content-type")?.includes("application/json")) {
    json = await res.json();
  }
  return { status: res.status, body: json?.data ?? json, rawBody: json };
}

describe("Security Hardening", () => {
    
  describe("OTP Attempt Counter (Allow exactly 3 attempts)", () => {
    
    it("fails 2 times and succeeds on 3rd", async () => {
      const PHONE = getUniquePhone();
      await post("/auth/otp/send", { phone: PHONE });

      const f1 = await post("/auth/otp/verify", { phone: PHONE, otp: "000000" });
      expect(f1.status).toBe(400);

      const f2 = await post("/auth/otp/verify", { phone: PHONE, otp: "000001" });
      expect(f2.status).toBe(400);

      const s3 = await post("/auth/otp/verify", { phone: PHONE, otp: TEST_OTP });
      if (s3.status !== 200) {
        console.error("OTP 3rd attempt failed", PHONE, JSON.stringify(s3.body));
      }
      expect(s3.status).toBe(200);
      expect(s3.body).toHaveProperty("otpToken");
    });

    it("blocks 4th attempt even if correct", async () => {
      const PHONE = getUniquePhone();
      await post("/auth/otp/send", { phone: PHONE });

      await post("/auth/otp/verify", { phone: PHONE, otp: "000000" });
      await post("/auth/otp/verify", { phone: PHONE, otp: "000001" });
      await post("/auth/otp/verify", { phone: PHONE, otp: "000002" });

      const f4 = await post("/auth/otp/verify", { phone: PHONE, otp: TEST_OTP });
      expect(f4.status).toBe(429);
    });
  });

  describe("Refresh Token Rotation & Reuse Detection", () => {
    const PHONE = getUniquePhone();
    let rt1: string;
    let rt2: string;

    beforeAll(async () => {
      const s = await post("/auth/otp/send", { phone: PHONE });
      if (s.status !== 200) console.error("Send OTP failed", PHONE, s.status);
      
      const v = await post("/auth/otp/verify", { phone: PHONE, otp: TEST_OTP });
      if (v.status !== 200) console.error("Verify OTP failed", PHONE, v.status, JSON.stringify(v.body));
      
      const otpToken = v.body?.otpToken;
      if (!otpToken) return;

      const r = await post("/auth/register", { otpToken, name: "Security Test RT" });
      if (r.status === 200) {
          rt1 = r.body.refreshToken;
      } else {
          const l = await post("/auth/login/otp", { otpToken });
          if (l.status !== 200) console.error("Login failed", PHONE, l.status, JSON.stringify(l.body));
          rt1 = l.body?.refreshToken;
      }
    });

    it("rotates refresh token on every refresh", async () => {
      expect(rt1).toBeDefined();
      const res = await post("/auth/token/refresh", {}, { "x-refresh-token": rt1 });
      if (res.status !== 200) {
        console.error("Refresh failed", JSON.stringify(res.body));
      }
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("refreshToken");
      rt2 = res.body.refreshToken;
      expect(rt2).not.toBe(rt1);
    });

    it("blocks reuse of old refresh token and revokes session", async () => {
      const reuse = await post("/auth/token/refresh", {}, { "x-refresh-token": rt1 });
      expect(reuse.status).toBe(401);
      
      const revoked = await post("/auth/token/refresh", {}, { "x-refresh-token": rt2 });
      expect(revoked.status).toBe(401);
    });
  });
});
