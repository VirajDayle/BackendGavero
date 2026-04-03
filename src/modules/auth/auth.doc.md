# Auth Module — API Routes Documentation

> **Base URL:** `/`
> **Content-Type:** `application/json`
> **Total routes:** 40 (10 public · 30 protected)

### Authentication

The module uses a multi-layered security approach to protect user sessions and prevent abuse.

#### Security & Hardening

1.  **IP Spoofing Protection**: Real client IPs are extracted securely via `X-Forwarded-For` (when `TRUST_PROXY` is on).
2.  **Refresh Token Rotation**: Every `/auth/token/refresh` call rotates both the storage hash and the client-side token.
3.  **Reuse Detection**: Attempting to use an old refresh token triggers an immediate revocation of the entire session.
4.  **JTI Blacklisting**: Access tokens are invalidated globally upon logout or rotation via a Redis-backed JTI blacklist.
5.  **Fail-Closed Policy**: Security-critical paths (like session validation) fail-closed if dependencies like Redis are unreachable.
6.  **Brute-Force Protection**: Multi-layered rate limits (IP-based, account-based, and cooldown periods) are enforced on all public endpoints.

#### Headers

Protected routes require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Token refresh uses a custom header instead:

```
x-refresh-token: <refreshToken>
```

---

## Table of Contents

1. [Auth](#1-auth)
2. [PIN](#2-pin)
3. [OTP](#3-otp)
4. [Users](#4-users)
5. [2FA](#5-2fa)
6. [Sessions](#6-sessions)
7. [Devices](#7-devices)
8. [Referrals](#8-referrals)
9. [Roles](#9-roles)
10. [Audit](#10-audit)

---

## 1. Auth

Prefix: `/auth`

---

### POST `/auth/otp/send`

**Visibility:** Public
**Summary:** Send a one-time password to a phone number. Works for both new and returning users.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | `string` | ✅ | E.164 format, e.g. `+919876543210` |

**Example request**

```json
{
  "phone": "+919876543210"
}
```

**Example response** `200 OK`

```json
{
  "expiresAt": "2024-01-01T10:05:00.000Z"
}
```

---

### POST `/auth/otp/verify`

**Visibility:** Public
**Summary:** Verify the OTP sent to a phone number. Returns an `otpToken` used in `/auth/register` or `/auth/login/otp`.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | `string` | ✅ | E.164 format |
| `otp` | `string` | ✅ | Exactly 6 digits |

**Example request**

```json
{
  "phone": "+919876543210",
  "otp": "482910"
}
```

**Example response** `200 OK`

```json
{
  "isRegistered": true,
  "otpToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

| Field | Description |
|-------|-------------|
| `isRegistered` | `true` if phone is already registered — use `otpToken` in `/auth/login/otp`. `false` if new — use `otpToken` in `/auth/register`. |
| `otpToken` | Short-lived JWT valid for `OTP_TOKEN_TTL_MIN` minutes. Single-use. |

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | No active OTP found or invalid OTP |
| `429` | Maximum OTP attempts exceeded |

---

### POST `/auth/register`

**Visibility:** Public
**Summary:** Register a new user using a verified `otpToken`.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `otpToken` | `string` | ✅ | From `/auth/otp/verify` (min 32 chars) |
| `name` | `string` | ✅ | 1–255 characters |
| `referralCode` | `string` | ❌ | 3–20 chars, uppercase alphanumeric `[A-Z0-9]+` |

**Example request**

```json
{
  "otpToken": "eyJhbGciOiJIUzI1NiJ9...",
  "name": "Rahul Sharma",
  "referralCode": "REF3XK9A1B"
}
```

**Example response** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2024-02-01T10:00:00.000Z",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Rahul Sharma",
    "phone": "+919876543210",
    "status": "active"
  }
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `401` | OTP token invalid or expired |
| `409` | Phone number already registered |

---

### POST `/auth/login/pin`

**Visibility:** Public
**Summary:** Login using a phone number and 6-digit PIN. Locks the account for 15 minutes after 5 failed attempts.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | `string` | ✅ | E.164 format |
| `pin` | `string` | ✅ | Exactly 6 digits |

**Example request**

```json
{
  "phone": "+919876543210",
  "pin": "123456"
}
```

**Example response** `200 OK` — same shape as `/auth/register`.

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | No PIN set on account |
| `401` | Invalid credentials |
| `202` | 2FA required — verify TOTP before proceeding |
| `403` | Account suspended or banned |
| `429` | Account locked due to too many failed attempts |

---

### POST `/auth/login/otp`

**Visibility:** Public
**Summary:** Login using an `otpToken` obtained from `/auth/otp/verify`. No PIN required.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `otpToken` | `string` | ✅ | From `/auth/otp/verify` (min 32 chars) |

**Example request**

```json
{
  "otpToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Example response** `200 OK` — same shape as `/auth/register`.

**Error responses**

| Status | Reason |
|--------|--------|
| `401` | OTP token invalid or expired |
| `403` | Account suspended or banned |
| `404` | User not found — register first |

---

### POST `/auth/token/refresh`

**Visibility:** Public
**Summary:** Rotate the access token using a refresh token. The old access token is immediately invalidated (JTI rotation).

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `x-refresh-token` | ✅ | Raw refresh token received at login |

**Example response** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "accessTokenJti": "uuid-of-new-jti",
  "expiresAt": "2024-02-01T10:00:00.000Z"
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `401` | `x-refresh-token` header missing, session expired, or invalid |

---

### POST `/auth/logout`

**Visibility:** Protected (JWT required)
**Summary:** Logout from a specific session by session ID.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | `string (uuid)` | ✅ | Session to revoke |

**Example request**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `404` | Session not found or does not belong to actor |

---

### POST `/auth/logout/all`

**Visibility:** Protected (JWT required)
**Summary:** Revoke all active sessions for the authenticated user.

**Request body** — none.

**Example response** `200 OK` — empty body.

---

## 2. PIN

Prefix: `/pin`

---

### POST `/pin/reset/request`

**Visibility:** Public
**Summary:** Request a PIN reset OTP for the given phone number. Always returns `200` regardless of whether the phone exists — prevents phone enumeration.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | `string` | ✅ | E.164 format |

**Example response** `200 OK`

```json
{
  "expiresAt": "2024-01-01T10:05:00.000Z"
}
```

---

### POST `/pin/reset/confirm`

**Visibility:** Public
**Summary:** Confirm PIN reset using the `otpToken` from the phone verification step and the new PIN. Revokes all existing sessions.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `otpToken` | `string` | ✅ | From `/auth/otp/verify` with `pin_reset` purpose (min 32 chars) |
| `newPin` | `string` | ✅ | Exactly 6 digits |
| `confirmPin` | `string` | ✅ | Must match `newPin` (6 chars) |

**Example request**

```json
{
  "otpToken": "eyJhbGciOiJIUzI1NiJ9...",
  "newPin": "654321",
  "confirmPin": "654321"
}
```

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | PINs do not match or PIN is not exactly 6 digits |
| `401` | OTP token invalid or expired |
| `404` | User not found |

---

### POST `/pin/set`

**Visibility:** Protected (JWT required)
**Summary:** Set or change the PIN for the authenticated user. Revokes all existing sessions on success.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pin` | `string` | ✅ | Exactly 6 digits |
| `confirmPin` | `string` | ✅ | Must match `pin` (6 chars) |

**Example request**

```json
{
  "pin": "123456",
  "confirmPin": "123456"
}
```

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | PINs do not match or PIN is not 6 digits |
| `404` | User not found |

---

## 3. OTP

Prefix: `/otp`

These routes are for authenticated users who need OTPs for in-app flows (email verification, 2FA setup, account deletion). For phone verification and PIN reset, use the public `/auth/otp/*` and `/pin/reset/*` routes instead.

---

### POST `/otp/request`

**Visibility:** Protected (JWT required)
**Summary:** Request an OTP for a specific purpose. Invalidates any previously active OTP for the same purpose.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `purpose` | `enum` | ✅ | One of: `phone_verification`, `pin_reset`, `two_factor_auth`, `account_deletion` |
| `phone` | `string` | ❌ | E.164 — required for `phone_verification` and `pin_reset` |
| `email` | `string` | ❌ | Email address — required for email-based OTPs |

**Example request**

```json
{
  "purpose": "phone_verification",
  "phone": "+919876543210"
}
```

**Example response** `200 OK`

```json
{
  "expiresAt": "2024-01-01T10:05:00.000Z"
}
```

---

### POST `/otp/verify`

**Visibility:** Protected (JWT required)
**Summary:** Verify an OTP code for the given purpose.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `purpose` | `enum` | ✅ | One of: `phone_verification`, `pin_reset`, `two_factor_auth`, `account_deletion` |
| `otp` | `string` | ✅ | 4–8 digits |
| `phone` | `string` | ❌ | Required unless purpose is `two_factor_auth` or `account_deletion` |
| `email` | `string` | ❌ | Required for email-based OTPs |

**Example request**

```json
{
  "purpose": "phone_verification",
  "otp": "482910",
  "phone": "+919876543210"
}
```

**Example response** `200 OK`

```json
{
  "verified": true
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | No active OTP found, invalid OTP, or missing phone/email |
| `429` | Maximum OTP attempts exceeded |

---

## 4. Users

Prefix: `/users`

---

### GET `/users`

**Visibility:** Protected (JWT required · admin only)
**Summary:** Paginated list of all users.

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number (min: 1) |
| `limit` | `number` | `20` | Results per page (1–100) |

**Example response** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Rahul Sharma",
    "phone": "+919876543210",
    "status": "active"
  }
]
```

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Admin access required |

---

### GET `/users/me`

**Visibility:** Protected (JWT required)
**Summary:** Get the authenticated user's own profile.

**Example response** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Rahul Sharma",
  "phone": "+919876543210",
  "email": "rahul@example.com",
  "status": "active",
  "phoneVerifiedAt": "2024-01-01T09:00:00.000Z"
}
```

---

### GET `/users/:id`

**Visibility:** Protected (JWT required · own profile or admin)
**Summary:** Get a user by UUID. Non-admin users can only fetch their own profile.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | User ID |

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Insufficient permissions |
| `404` | User not found |

---

### PATCH `/users/me`

**Visibility:** Protected (JWT required)
**Summary:** Update the authenticated user's own profile. Changing email marks it as unverified.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ❌ | 1–255 characters |
| `email` | `string` | ❌ | Valid email address |

**Example request**

```json
{
  "name": "Rahul S.",
  "email": "rahul.new@example.com"
}
```

**Example response** `200 OK` — updated user profile object.

**Error responses**

| Status | Reason |
|--------|--------|
| `404` | User not found |
| `409` | Email already in use |

---

### PATCH `/users/:id`

**Visibility:** Protected (JWT required · admin only)
**Summary:** Update any user's profile. Same body and response shape as `PATCH /users/me`.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | User ID |

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Insufficient permissions |
| `404` | User not found |
| `409` | Email already in use |

---

### PATCH `/users/:id/status`

**Visibility:** Protected (JWT required · admin only)
**Summary:** Update a user's account status.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | User ID |

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `enum` | ✅ | One of: `active`, `suspended`, `deactivated`, `banned` |

**Example request**

```json
{
  "status": "suspended"
}
```

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Admin access required |
| `404` | User not found |

---

### DELETE `/users/me`

**Visibility:** Protected (JWT required)
**Summary:** Soft-delete the authenticated user's own account. Revokes all active sessions.

**Example response** `200 OK` — empty body.

---

### DELETE `/users/:id`

**Visibility:** Protected (JWT required · admin only)
**Summary:** Soft-delete any user's account. Revokes all active sessions for that user.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | User ID |

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Insufficient permissions |
| `404` | User not found |

---

## 5. 2FA

Prefix: `/2fa`

> **Note:** `DELETE /2fa/disable` currently triggers a verification OTP rather than immediately disabling 2FA. It behaves as a request initiator — not a destructive action.

---

### POST `/2fa/enable`

**Visibility:** Protected (JWT required)
**Summary:** Initiate 2FA setup. Sends a setup OTP to the authenticated user.

**Request body** — none.

**Example response** `200 OK`

```json
{
  "expiresAt": "2024-01-01T10:05:00.000Z"
}
```

---

### POST `/2fa/verify`

**Visibility:** Protected (JWT required)
**Summary:** Verify a TOTP code to complete 2FA setup or confirm a 2FA-gated login.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `totp` | `string` | ✅ | Exactly 6 digits |

**Example request**

```json
{
  "totp": "837291"
}
```

**Example response** `200 OK`

```json
{
  "verified": true
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | Invalid TOTP code |
| `429` | Maximum attempts exceeded |

---

### DELETE `/2fa/disable`

**Visibility:** Protected (JWT required)
**Summary:** Initiates 2FA disable flow by sending a verification OTP. Call `POST /otp/verify` with purpose `two_factor_auth` to complete the disable.

**Request body** — none.

**Example response** `200 OK`

```json
{
  "expiresAt": "2024-01-01T10:05:00.000Z"
}
```

---

## 6. Sessions

Prefix: `/sessions`

---

### GET `/sessions`

**Visibility:** Protected (JWT required)
**Summary:** List all active sessions for the authenticated user. Sensitive fields (`refreshTokenHash`, `accessTokenJti`) are stripped from the response.

**Example response** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "...",
    "ipAddress": "103.21.244.0",
    "userAgent": "Mozilla/5.0 ...",
    "createdAt": "2024-01-01T09:00:00.000Z",
    "expiresAt": "2024-02-01T09:00:00.000Z",
    "status": "active"
  }
]
```

---

### DELETE `/sessions/:id`

**Visibility:** Protected (JWT required · own session or admin)
**Summary:** Revoke a specific session. Non-admin users can only revoke their own sessions.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | Session ID |

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Cannot revoke another user's session |
| `404` | Session not found |

---

## 7. Devices

Prefix: `/devices`

---

### GET `/devices`

**Visibility:** Protected (JWT required)
**Summary:** List all known devices for the authenticated user.

**Example response** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deviceFingerprint": "abc123...",
    "trusted": false,
    "lastIp": "103.21.244.0",
    "lastActiveAt": "2024-01-01T09:00:00.000Z"
  }
]
```

---

### PATCH `/devices/:id`

**Visibility:** Protected (JWT required)
**Summary:** Mark a device as trusted or untrusted.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | Device ID |

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trusted` | `boolean` | ✅ | `true` to trust, `false` to untrust |

**Example request**

```json
{
  "trusted": true
}
```

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `404` | Device not found |

---

### DELETE `/devices/:id/revoke`

**Visibility:** Protected (JWT required)
**Summary:** Soft-revoke a device. The device record is retained but marked as revoked.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | Device ID |

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `404` | Device not found |

---

### DELETE `/devices/:id`

**Visibility:** Protected (JWT required)
**Summary:** Permanently remove a device record.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | Device ID |

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `404` | Device not found |

---

## 8. Referrals

Prefix: `/referrals`

---

### GET `/referrals/my-code`

**Visibility:** Protected (JWT required)
**Summary:** Get the authenticated user's referral code.

**Example response** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "...",
  "code": "REF3XK9A1B",
  "usageCount": 3
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `404` | No referral code found |

---

### POST `/referrals/generate-code`

**Visibility:** Protected (JWT required)
**Summary:** Generate a referral code for the authenticated user. Idempotent — returns the existing code if one already exists.

**Request body** — none.

**Example response** `200 OK` — referral code object (same shape as `/referrals/my-code`).

---

### GET `/referrals`

**Visibility:** Protected (JWT required)
**Summary:** Paginated list of referrals made by the authenticated user.

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number (min: 1) |
| `limit` | `number` | `20` | Results per page (1–100) |

**Example response** `200 OK`

```json
[
  {
    "id": "...",
    "referrerId": "...",
    "refereeId": "...",
    "referralCodeId": "...",
    "codeUsedAt": "2024-01-01T09:00:00.000Z"
  }
]
```

---

## 9. Roles

Prefix: `/roles`
**All role routes require admin privileges.**

---

### GET `/roles`

**Visibility:** Protected (JWT required · admin only)
**Summary:** List all roles in the system.

**Example response** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Administrator",
    "slug": "admin",
    "description": "Full system access",
    "isSystem": true
  }
]
```

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Admin access required |

---

### POST `/roles`

**Visibility:** Protected (JWT required · admin only)
**Summary:** Create a new custom role.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | 1–255 characters |
| `slug` | `string` | ✅ | 1–100 chars, lowercase alphanumeric + hyphens `[a-z0-9-]+` |
| `description` | `string` | ❌ | Up to 1000 characters |

**Example request**

```json
{
  "name": "Support Agent",
  "slug": "support-agent",
  "description": "Can view users and audit logs"
}
```

**Example response** `200 OK` — the created role object.

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Admin access required |
| `409` | Role with this slug already exists |

---

### DELETE `/roles/:roleId`

**Visibility:** Protected (JWT required · admin only)
**Summary:** Delete a custom role. System roles (`isSystem: true`) cannot be deleted.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `roleId` | `string (uuid)` | Role ID |

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Admin access required |
| `404` | Role not found or is a system role |

---

### POST `/roles/:roleId/users/:userId`

**Visibility:** Protected (JWT required · admin only)
**Summary:** Assign a role to a user.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `roleId` | `string (uuid)` | Role ID |
| `userId` | `string (uuid)` | User ID |

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Admin access required |
| `404` | Role or user not found |

---

### DELETE `/roles/:roleId/users/:userId`

**Visibility:** Protected (JWT required · admin only)
**Summary:** Revoke a role from a user.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `roleId` | `string (uuid)` | Role ID |
| `userId` | `string (uuid)` | User ID |

**Example response** `200 OK` — empty body.

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Admin access required |
| `404` | User-role mapping not found |

---

## 10. Audit

Prefix: `/audit`

---

### GET `/audit/me`

**Visibility:** Protected (JWT required)
**Summary:** Paginated list of audit log entries for the authenticated user.

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number (min: 1) |
| `limit` | `number` | `20` | Results per page (1–100) |

**Example response** `200 OK`

```json
[
  {
    "id": "...",
    "actorId": "...",
    "actorIp": "103.21.244.0",
    "action": "user.sign_in_pin",
    "resource": "session",
    "resourceId": "...",
    "before": null,
    "after": null,
    "createdAt": "2024-01-01T09:00:00.000Z"
  }
]
```

---

### GET `/audit/resource/:resource/:resourceId`

**Visibility:** Protected (JWT required · admin only)
**Summary:** Paginated audit log for any specific resource. Useful for tracing all changes made to a user, session, device, or role.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `resource` | `string` | Resource type, e.g. `user`, `session`, `device`, `role` |
| `resourceId` | `string (uuid)` | Resource ID |

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number (min: 1) |
| `limit` | `number` | `20` | Results per page (1–100) |

**Example response** `200 OK` — array of audit log entries (same shape as `/audit/me`).

**Error responses**

| Status | Reason |
|--------|--------|
| `403` | Admin access required |

---

## Route Summary

| # | Method | Path | Auth | Group |
|---|--------|------|------|-------|
| 1 | POST | `/auth/otp/send` | public | Auth |
| 2 | POST | `/auth/otp/verify` | public | Auth |
| 3 | POST | `/auth/register` | public | Auth |
| 4 | POST | `/auth/login/pin` | public | Auth |
| 5 | POST | `/auth/login/otp` | public | Auth |
| 6 | POST | `/auth/token/refresh` | public | Auth |
| 7 | POST | `/auth/logout` | JWT | Auth |
| 8 | POST | `/auth/logout/all` | JWT | Auth |
| 9 | POST | `/pin/reset/request` | public | PIN |
| 10 | POST | `/pin/reset/confirm` | public | PIN |
| 11 | POST | `/pin/set` | JWT | PIN |
| 12 | POST | `/otp/request` | JWT | OTP |
| 13 | POST | `/otp/verify` | JWT | OTP |
| 14 | GET | `/users` | JWT admin | Users |
| 15 | GET | `/users/me` | JWT | Users |
| 16 | GET | `/users/:id` | JWT | Users |
| 17 | PATCH | `/users/me` | JWT | Users |
| 18 | PATCH | `/users/:id` | JWT admin | Users |
| 19 | PATCH | `/users/:id/status` | JWT admin | Users |
| 20 | DELETE | `/users/me` | JWT | Users |
| 21 | DELETE | `/users/:id` | JWT admin | Users |
| 22 | POST | `/2fa/enable` | JWT | 2FA |
| 23 | POST | `/2fa/verify` | JWT | 2FA |
| 24 | DELETE | `/2fa/disable` | JWT | 2FA |
| 25 | GET | `/sessions` | JWT | Sessions |
| 26 | DELETE | `/sessions/:id` | JWT | Sessions |
| 27 | GET | `/devices` | JWT | Devices |
| 28 | PATCH | `/devices/:id` | JWT | Devices |
| 29 | DELETE | `/devices/:id/revoke` | JWT | Devices |
| 30 | DELETE | `/devices/:id` | JWT | Devices |
| 31 | GET | `/referrals/my-code` | JWT | Referrals |
| 32 | POST | `/referrals/generate-code` | JWT | Referrals |
| 33 | GET | `/referrals` | JWT | Referrals |
| 34 | GET | `/roles` | JWT admin | Roles |
| 35 | POST | `/roles` | JWT admin | Roles |
| 36 | DELETE | `/roles/:roleId` | JWT admin | Roles |
| 37 | POST | `/roles/:roleId/users/:userId` | JWT admin | Roles |
| 38 | DELETE | `/roles/:roleId/users/:userId` | JWT admin | Roles |
| 39 | GET | `/audit/me` | JWT | Audit |
| 40 | GET | `/audit/resource/:resource/:resourceId` | JWT admin | Audit |