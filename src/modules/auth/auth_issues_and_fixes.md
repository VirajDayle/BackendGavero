# Authentication Module - Audit Report & Fixes

This document outlines the critical and medium severity issues found in the authentication module, along with their respective technical fixes.

---

## 1. TOCTOU Brute-Force Bypass on OTP & PIN

**Severity:** 🔴 CRITICAL  
**Location:** `auth.service.ts` -> `verifyOtp` and `loginWithPin`

### The Issue
The application checks if a user has exceeded their `failedAttempts` or `maxAttempts` **before** performing the computationally expensive Argon2/Bcrypt hash verification.
Because hash checking takes time (e.g., ~100ms+), an attacker can launch 50 parallel requests. All 50 requests will read the `attempts` count (e.g., `0`), pass the threshold check, spend 100ms verifying the hash, and *then* atomically increment the counter. This completely bypasses the local brute-force tracking mechanism.

### The Fix
The atomic increment or check must be done **before or during** the hash verification. Alternatively, use a Redis lock for the given user/phone.

**Implementation (Redis Lock Approach):**
```typescript
// At the top of verifyOtp / loginWithPin:
const lockKey = `lock:auth:${phone}`;
// Try to acquire lock for 2 seconds
const acquired = await redis.set(lockKey, "1", "NX", "EX", 2);
if (!acquired) throw AuthErrors.Common.rateLimited("Too many concurrent requests");

// Do DB checks, hash verify, and increment failed counter

// Finally, release lock
await redis.del(lockKey);
```

---

## 2. Incomplete Session Revocation on Logout

**Severity:** 🔴 CRITICAL  
**Location:** `auth.service.ts` -> `signOut` and `signOutAll`

### The Issue
When a user logs out, the database status for the session is updated to `logged_out`. However, unlike `refreshSession`, the Access Token's `JTI` is **not added to the Redis blacklist**. Because Elysia/JWT auth middlewares are usually stateless (or rely on Redis for blacklists instead of a DB lookup on every request), the access tokens remain fully valid until they naturally expire (e.g., up to 15 minutes). A stolen token can be used by an attacker even after the legitimate user clicks "Logout Everywhere".

### The Fix
Blacklist the `accessTokenJti` during any revocation.

**Implementation:**
```typescript
// Inside signOut:
if (session.accessTokenJti) {
  // Same code as in refreshSession
  await redis.setex(
    `revoke_jti:${session.accessTokenJti}`, 
    (env.JWT_ACCESS_TTL_MIN ?? 15) * 60, 
    "revoked"
  );
}

// Inside signOutAll:
const activeSessions = await this.repos.sessionRepo.listActiveByUser(meta.actorId);
for (const session of activeSessions) {
  if (session.accessTokenJti) {
    await redis.setex(
      `revoke_jti:${session.accessTokenJti}`, 
      (env.JWT_ACCESS_TTL_MIN ?? 15) * 60, 
      "revoked"
    );
  }
}
await this.repos.sessionRepo.revokeAllByUser(meta.actorId, "user_sign_out_all");
```

---

## 3. Non-Atomic JWT Consumption (Race Condition)

**Severity:** 🔴 CRITICAL  
**Location:** `auth.controller.ts` -> `verifyAndConsumeOtpToken`

### The Issue
OTP tokens are designed to be single-use. However, the controller checks and updates Redis in two distinct steps:
```typescript
const revoked = await redis.get(`revoke_otp_jti:${payload.jti}`);
if (revoked) throw AuthErrors(...);

// Consume immediately
await redis.setex(`revoke_otp_jti:${payload.jti}`, TTL, "1");
```
Two rapid parallel requests can arrive between `get` and `setex`, bypassing the single-use enforcement, creating account logic bugs or duped registrations.

### The Fix
Use an atomic `SET NX` command.

**Implementation:**
```typescript
// Replace the .get and .setex with:
const wasSet = await redis.set(
  `revoke_otp_jti:${payload.jti}`, 
  "1", 
  "NX", 
  "EX", 
  env.OTP_TOKEN_TTL_MIN * 60
);

if (!wasSet) {
  throw AuthErrors.Otp.tokenInvalid("OTP token already used");
}
```

---

## 4. XSS Exposure of Refresh Tokens

**Severity:** 🔴 CRITICAL  
**Location:** `auth.controller.ts` -> `toSessionResponse`

### The Issue
The `/auth/login/pin`, `/auth/register` and `/auth/token/refresh` endpoints return both the `accessToken` and `refreshToken` directly in the JSON response. If the frontend stores the long-lived refresh token in `localStorage`, a simple Cross-Site Scripting (XSS) vulnerability allows an attacker to easily steal it and maintain permanent access to the user account payload because the token allows generating fresh sessions.

### The Fix
Access tokens can remain in the JSON body, but refresh tokens should be set exclusively as tracking-resilient `HttpOnly` cookies.

**Implementation:**
1. Do not return `refreshToken` from `toSessionResponse`.
2. In the route layer (`auth.routes.ts`), inject the token into a cookie.
```typescript
// Example in auth.routes.ts
.post("/login/pin", async ({ body, ip, userAgent, deviceInfo, cookie: { refreshToken } }) => {
   const result = await AuthController.loginWithPin(body, { ip, userAgent, deviceInfo });
   
   refreshToken.set({
     value: result.rawRefreshToken,
     httpOnly: true,
     secure: env.NODE_ENV === "production",
     sameSite: "strict",
     path: "/auth", // Limit cookie exposure
     maxAge: env.JWT_REFRESH_TTL_DAYS * 86400
   });

   return result.clientResponse; // Just accessToken & user data
})
```

---

## 5. Architectural Violations (Controller interacting with Redis / jose)

**Severity:** 🟠 MEDIUM  
**Location:** `auth.controller.ts` and `auth.service.ts`

### The Issue
The controller directly uses `redis` to consume bridge tokens and `jwtVerify` to parse payloads. Similarly, `auth.service.ts` generates JWTs using `jose` top-level functions instead of a centralized token generation service. This locks your infrastructure into specific files making unit testing very brittle and breaking standard layered separation.

### The Fix
Create an `auth.tokens.service.ts` to coordinate blacklisting, encoding, decoding, and JWT extraction. Migrate `verifyAndConsumeOtpToken` into an `OtpService` implementation.

---

## 6. DB Exhaustion DDoS Vulnerability

**Severity:** 🟠 MEDIUM  
**Location:** `auth.service.ts` -> `sendOtp`, `loginWithPin`

### The Issue
`this.repos.abuseRepo.checkAndIncrement` hits the `rateLimitsTable` in Postgres. A flood of unauthenticated requests designed to scrape endpoints or brute-force users will hammer Postgres with millions of transactions. Even with the Elysia rate limiting plugin, distributed spam makes it past the first network layer.

### The Fix
Rate limiting belongs entirely in Redis, which is purpose-built to absorb high-throughput memory-increment workloads. Use `redis.incr` combined with `redis.expire` inside a Redis tracking service, rather than burning DB pool connections to stop spammers.
