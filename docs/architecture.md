# Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Framework | Elysia |
| Database | PostgreSQL 16 + PostGIS |
| Cache / Rate limit | Redis 7 |
| ORM | Drizzle |
| Validation | TypeBox (via Elysia) |
| Auth | JWT (jose) + DB session check |
| Logging | Pino + pino-pretty |
| Email | Resend / SendGrid |
| SMS | MSG91 / Fast2SMS / Twilio |
# Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Framework | Elysia |
| Database | PostgreSQL 16 + PostGIS |
| Cache / Rate limit | Redis 7 |
| ORM | Drizzle |
| Validation | TypeBox (via Elysia) |
| Auth | JWT (jose) + DB session check |
| Logging | Pino + pino-pretty |
| Email | Resend / SendGrid |
| SMS | MSG91 / Fast2SMS / Twilio |

---

## Project Structure

```
src/
├── server.ts                  # Entry point — starts Bun server
├── app.ts                     # Elysia app wiring — plugins + routes
│
├── config/
│   ├── env.ts                 # Zod-validated environment variables
│   ├── database.ts            # Drizzle DB instance
│   └── redis.ts               # ioredis client
│
├── core/
│   └── logger.ts              # Pino logger instance
│
├── middleware/
│   ├── requestId.middleware.ts  # Attaches UUID requestId to every request
│   ├── logger.middleware.ts     # Logs req/res + extracts ip/userAgent
│   ├── auth.middleware.ts       # JWT verification → ctx.user
│   ├── rateLimit.middleware.ts  # Redis sliding-window rate limiter
│   └── error.middleware.ts      # Global error handler → consistent shape
│
├── plugins/
│   ├── db.plugin.ts           # Exposes db on ctx
│   └── redis.plugin.ts        # Exposes redis on ctx
│
└── modules/
    └── auth/
        ├── auth.routes.ts     # All route definitions + public/protected split
        ├── auth.service.ts    # Business logic
        ├── auth.repository.ts # DB queries (Drizzle)
        ├── auth.schema.ts     # Drizzle table schemas
        └── notification.service.ts  # SMS + email OTP delivery
```

---

## Request Lifecycle

Every request flows through middleware in mount order:

```
Request
  │
  ├── requestIdPlugin       attach UUID requestId to store
  ├── loggerPlugin          log incoming request, extract ip/userAgent/deviceInfo
  ├── errorPlugin           wrap everything below in try/catch → format errors
  ├── dbPlugin              expose db on ctx
  ├── redisPlugin           expose redis on ctx
  │
  ├── [public routes]       no JWT check
  │     publicAuthRoutes    /auth/otp/send, /otp/verify, /register, /login/*, /token/refresh
  │     publicPinRoutes     /pin/reset/request, /pin/reset/confirm
  │
  └── [protected routes]    jwtAuthPlugin → authenticate derive → actor in ctx
        protectedAuthRoutes /auth/logout, /auth/logout/all
        protectedPinRoutes  /pin/set
        otpRoutes           /otp/request, /otp/verify
        userRoutes          /users/*
        twoFactorRoutes     /2fa/*
        sessionRoutes       /sessions/*
        deviceRoutes        /devices/*
        referralRoutes      /referrals/*
        roleRoutes          /roles/*
        auditRoutes         /audit/*
```

---

## Auth Flow

### Registration

```
POST /auth/otp/send       → generates OTP, stores hash in Redis, sends SMS
POST /auth/otp/verify     → validates OTP hash → returns otpToken (short-lived JWT)
POST /auth/register       → validates otpToken → creates user + session → returns accessToken + refreshToken
```

### Login

```
# PIN login
POST /auth/login/pin      → validates PIN → creates session → returns tokens

# OTP login (passwordless)
POST /auth/otp/send       → send OTP
POST /auth/otp/verify     → returns otpToken
POST /auth/login/otp      → validates otpToken → creates session → returns tokens
```

### Token Lifecycle

```
accessToken   short-lived JWT (default 15 min) — sent as Bearer header
refreshToken  long-lived opaque token (default 30 days) — sent as x-refresh-token header

POST /auth/token/refresh  → SHA-256 hashes refreshToken → DB lookup → rotates both tokens
POST /auth/logout         → marks session as revoked in DB
POST /auth/logout/all     → revokes all sessions for the user
```

### JWT Verification (every protected request)

```
1. Extract Bearer token from Authorization header
2. Verify JWT signature + expiry (jose)
3. Validate claims: sub, jti, roles
4. DB session lookup by jti → checks status = active, not expired, userId matches
5. Merge { user } into ctx — accessible as actor after .derive(authenticate)
```

---

## Middleware Architecture

### Why `{ as: "scoped" }` not `{ as: "global" }`

Elysia derives and hooks have three scopes:

| Scope | Behaviour |
|-------|-----------|
| `"local"` | Only applies to the current plugin instance |
| `"scoped"` | Applies to the plugin and any child that explicitly `.use()`s it |
| `"global"` | Applies to every route in the entire app tree |

`jwtAuthPlugin` uses `"scoped"` — it only runs on route groups that explicitly call `.use(jwtAuthPlugin)`. Using `"global"` caused it to run on `/docs` and `/health`, returning 401 on public endpoints.

### IP Resolution

Elysia does not expose `ip` directly on context. IP is resolved via:

```typescript
server?.requestIP(request)?.address ?? "unknown"
```

This uses Bun's `Server.requestIP()` which returns a `SocketAddress`. It is extracted in `resolveRequestContext()` and stored in `ctx.ip`.

---

## Rate Limiting

Redis sliding-window implementation using atomic `INCR` + `EXPIRE`:

```
1. INCR rl:{action}:{ip}          atomic increment
2. if count === 1: EXPIRE key windowSec   set TTL only on first hit
3. if count > max: TTL → retryAfter → throw 429
```

This ensures:
- The window resets naturally after `windowSec` without a separate cleanup job
- Concurrent requests are safe — `INCR` is atomic
- Each action namespace is isolated (`otp:send`, `login:pin`, etc.)

---

## Environment Configuration

All environment variables are validated at startup via Zod in `config/env.ts`. The process exits immediately if any required variable is missing.

Provider-specific variables (SMS keys, email keys) are optional in the schema but validated conditionally — if `SMS_PROVIDER=twilio` then `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are all required.

See `.env.example` for all available variables.

---

## Database

PostgreSQL 16 with PostGIS extension, managed via Drizzle ORM.

Key tables:

| Table | Purpose |
|-------|---------|
| `users` | Core user record |
| `sessions` | Active login sessions — each has a `jti` matching the JWT |
| `devices` | Known devices per user |
| `otp_codes` | Hashed OTP storage with TTL |
| `roles` | RBAC role definitions |
| `user_roles` | Many-to-many user ↔ role |
| `referrals` | Referral code tracking |
| `audit_logs` | Immutable audit trail |

Refresh tokens are stored as SHA-256 hashes — the raw token is only ever held by the client.

---

## Notification Service

OTP delivery is handled by `NotificationService` in `modules/auth/notification.service.ts`. It never generates OTPs — it only delivers an already-generated string.

Provider selection via env:

```
SMS_PROVIDER=dev|msg91|fast2sms|twilio
EMAIL_PROVIDER=dev|resend|sendgrid
```

In `dev` mode all OTPs are logged to the terminal via Pino — no external provider needed.

---

## Docker

Local development infrastructure is defined in `docker-compose.yml`:

```
postgres  postgis/postgis:16-3.4  → port 5433
redis     redis:7-alpine          → port 6379
```

Start with:
```bash
docker compose up -d
```
---

## Project Structure

```
src/
├── server.ts                  # Entry point — starts Bun server
├── app.ts                     # Elysia app wiring — plugins + routes
│
├── config/
│   ├── env.ts                 # Zod-validated environment variables
│   ├── database.ts            # Drizzle DB instance
│   └── redis.ts               # ioredis client
│
├── core/
│   └── logger.ts              # Pino logger instance
│
├── middleware/
│   ├── requestId.middleware.ts  # Attaches UUID requestId to every request
│   ├── logger.middleware.ts     # Logs req/res + extracts ip/userAgent
│   ├── auth.middleware.ts       # JWT verification → ctx.user
│   ├── rateLimit.middleware.ts  # Redis sliding-window rate limiter
│   └── error.middleware.ts      # Global error handler → consistent shape
│
├── plugins/
│   ├── db.plugin.ts           # Exposes db on ctx
│   └── redis.plugin.ts        # Exposes redis on ctx
│
└── modules/
    └── auth/
        ├── auth.routes.ts     # All route definitions + public/protected split
        ├── auth.service.ts    # Business logic
        ├── auth.repository.ts # DB queries (Drizzle)
        ├── auth.schema.ts     # Drizzle table schemas
        └── notification.service.ts  # SMS + email OTP delivery
```

---

## Request Lifecycle

Every request flows through middleware in mount order:

```
Request
  │
  ├── requestIdPlugin       attach UUID requestId to store
  ├── loggerPlugin          log incoming request, extract ip/userAgent/deviceInfo
  ├── errorPlugin           wrap everything below in try/catch → format errors
  ├── dbPlugin              expose db on ctx
  ├── redisPlugin           expose redis on ctx
  │
  ├── [public routes]       no JWT check
  │     publicAuthRoutes    /auth/otp/send, /otp/verify, /register, /login/*, /token/refresh
  │     publicPinRoutes     /pin/reset/request, /pin/reset/confirm
  │
  └── [protected routes]    jwtAuthPlugin → authenticate derive → actor in ctx
        protectedAuthRoutes /auth/logout, /auth/logout/all
        protectedPinRoutes  /pin/set
        otpRoutes           /otp/request, /otp/verify
        userRoutes          /users/*
        twoFactorRoutes     /2fa/*
        sessionRoutes       /sessions/*
        deviceRoutes        /devices/*
        referralRoutes      /referrals/*
        roleRoutes          /roles/*
        auditRoutes         /audit/*
```

---

## Auth Flow

### Registration

```
POST /auth/otp/send       → generates OTP, stores hash in Redis, sends SMS
POST /auth/otp/verify     → validates OTP hash → returns otpToken (short-lived JWT)
POST /auth/register       → validates otpToken → creates user + session → returns accessToken + refreshToken
```

### Login

```
# PIN login
POST /auth/login/pin      → validates PIN → creates session → returns tokens

# OTP login (passwordless)
POST /auth/otp/send       → send OTP
POST /auth/otp/verify     → returns otpToken
POST /auth/login/otp      → validates otpToken → creates session → returns tokens
```

### Token Lifecycle

```
accessToken   short-lived JWT (default 15 min) — sent as Bearer header
refreshToken  long-lived opaque token (default 30 days) — sent as x-refresh-token header

POST /auth/token/refresh  → SHA-256 hashes refreshToken → DB lookup → rotates both tokens
POST /auth/logout         → marks session as revoked in DB
POST /auth/logout/all     → revokes all sessions for the user
```

### JWT Verification (every protected request)

```
1. Extract Bearer token from Authorization header
2. Verify JWT signature + expiry (jose)
3. Validate claims: sub, jti, roles
4. DB session lookup by jti → checks status = active, not expired, userId matches
5. Merge { user } into ctx — accessible as actor after .derive(authenticate)
```

---

## Middleware Architecture

### Why `{ as: "scoped" }` not `{ as: "global" }`

Elysia derives and hooks have three scopes:

| Scope | Behaviour |
|-------|-----------|
| `"local"` | Only applies to the current plugin instance |
| `"scoped"` | Applies to the plugin and any child that explicitly `.use()`s it |
| `"global"` | Applies to every route in the entire app tree |

`jwtAuthPlugin` uses `"scoped"` — it only runs on route groups that explicitly call `.use(jwtAuthPlugin)`. Using `"global"` caused it to run on `/docs` and `/health`, returning 401 on public endpoints.

### IP Resolution

Elysia does not expose `ip` directly on context. IP is resolved via:

```typescript
server?.requestIP(request)?.address ?? "unknown"
```

This uses Bun's `Server.requestIP()` which returns a `SocketAddress`. It is extracted in `resolveRequestContext()` and stored in `ctx.ip`.

---

## Rate Limiting

Redis sliding-window implementation using atomic `INCR` + `EXPIRE`:

```
1. INCR rl:{action}:{ip}          atomic increment
2. if count === 1: EXPIRE key windowSec   set TTL only on first hit
3. if count > max: TTL → retryAfter → throw 429
```

This ensures:
- The window resets naturally after `windowSec` without a separate cleanup job
- Concurrent requests are safe — `INCR` is atomic
- Each action namespace is isolated (`otp:send`, `login:pin`, etc.)

---

## Environment Configuration

All environment variables are validated at startup via Zod in `config/env.ts`. The process exits immediately if any required variable is missing.

Provider-specific variables (SMS keys, email keys) are optional in the schema but validated conditionally — if `SMS_PROVIDER=twilio` then `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are all required.

See `.env.example` for all available variables.

---

## Database

PostgreSQL 16 with PostGIS extension, managed via Drizzle ORM.

Key tables:

| Table | Purpose |
|-------|---------|
| `users` | Core user record |
| `sessions` | Active login sessions — each has a `jti` matching the JWT |
| `devices` | Known devices per user |
| `otp_codes` | Hashed OTP storage with TTL |
| `roles` | RBAC role definitions |
| `user_roles` | Many-to-many user ↔ role |
| `referrals` | Referral code tracking |
| `audit_logs` | Immutable audit trail |

Refresh tokens are stored as SHA-256 hashes — the raw token is only ever held by the client.

---

## Notification Service

OTP delivery is handled by `NotificationService` in `modules/auth/notification.service.ts`. It never generates OTPs — it only delivers an already-generated string.

Provider selection via env:

```
SMS_PROVIDER=dev|msg91|fast2sms|twilio
EMAIL_PROVIDER=dev|resend|sendgrid
```

In `dev` mode all OTPs are logged to the terminal via Pino — no external provider needed.

---

## Docker

Local development infrastructure is defined in `docker-compose.yml`:

```
postgres  postgis/postgis:16-3.4  → port 5433
redis     redis:7-alpine          → port 6379
```

Start with:
```bash
docker compose up -d
```