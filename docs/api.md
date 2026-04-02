# API Reference

Base URL: `http://localhost:3000`  
Interactive docs: `http://localhost:3000/docs`

---

## Authentication

Protected routes require a Bearer JWT in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Token refresh uses a custom header:

```
x-refresh-token: <refreshToken>
```

---

## Public Routes

No authentication required.

---

### Auth

#### `POST /auth/otp/send`

Send an OTP to a phone number. Works for both new and returning users.

**Body**
```json
{ "phone": "+911234567890" }
```

| Field | Type | Rules |
|-------|------|-------|
| phone | string | E.164 format — must start with `+` |

---

#### `POST /auth/otp/verify`

Verify the OTP. Returns an `otpToken` used in `/auth/register` or `/auth/login/otp`.

**Body**
```json
{ "phone": "+911234567890", "otp": "123456" }
```

**Response**
```json
{ "isRegistered": true, "otpToken": "..." }
```

---

#### `POST /auth/register`

Register a new user using the `otpToken` from `/auth/otp/verify`.

**Body**
```json
{
  "otpToken": "...",
  "name": "Viraj",
  "referralCode": "ABC123"
}
```

| Field | Rules |
|-------|-------|
| otpToken | min 32 chars |
| name | 1–255 chars |
| referralCode | optional, 3–20 chars, `A-Z0-9` only |

---

#### `POST /auth/login/pin`

Login with phone + PIN.

**Body**
```json
{ "phone": "+911234567890", "pin": "123456" }
```

---

#### `POST /auth/login/otp`

Login using an `otpToken` from `/auth/otp/verify` (passwordless flow).

**Body**
```json
{ "otpToken": "..." }
```

---

#### `POST /auth/token/refresh`

Rotate the access token using the refresh token. Send as a header, not in the body.

**Headers**
```
x-refresh-token: <refreshToken>
```

**Response**
```json
{ "accessToken": "..." }
```

---

### PIN Reset

#### `POST /pin/reset/request`

Request a PIN reset OTP. User is not logged in at this point.

**Body**
```json
{ "phone": "+911234567890" }
```

---

#### `POST /pin/reset/confirm`

Complete the PIN reset using the OTP token received after verification.

**Body**
```json
{
  "otpToken": "...",
  "newPin": "654321",
  "confirmPin": "654321"
}
```

---

## Protected Routes

All routes below require `Authorization: Bearer <accessToken>`.

---

### Auth

#### `POST /auth/logout`

Revoke a specific session.

**Body**
```json
{ "sessionId": "uuid" }
```

---

#### `POST /auth/logout/all`

Revoke all active sessions for the current user.

---

### OTP

#### `POST /otp/request`

Request an OTP for a specific purpose while logged in.

**Body**
```json
{
  "purpose": "phone_verification",
  "phone": "+911234567890",
  "email": "user@example.com"
}
```

| purpose | Use case |
|---------|----------|
| `phone_verification` | Verify a new phone number |
| `pin_reset` | Reset PIN while logged in |
| `two_factor_auth` | Enable / disable 2FA |
| `account_deletion` | Confirm account deletion |

---

#### `POST /otp/verify`

Verify an OTP sent via `/otp/request`.

**Body**
```json
{
  "purpose": "phone_verification",
  "otp": "123456"
}
```

---

### PIN

#### `POST /pin/set`

Set or change the current user's PIN.

**Body**
```json
{ "pin": "123456", "confirmPin": "123456" }
```

> `pin === confirmPin` is enforced in the service layer.

---

### Users

#### `GET /users/me`
Get the current user's profile.

#### `PATCH /users/me`
Update the current user's profile.

**Body**
```json
{ "name": "New Name", "email": "new@example.com" }
```

#### `DELETE /users/me`
Soft-delete the current user's account.

#### `GET /users` _(admin)_
List all users with pagination.

**Query** `?page=1&limit=20`

#### `GET /users/:id` _(admin)_
Get a user by UUID.

#### `PATCH /users/:id` _(admin)_
Update any user's profile.

#### `PATCH /users/:id/status` _(admin)_
Update a user's account status.

**Body**
```json
{ "status": "suspended" }
```

| status | Meaning |
|--------|---------|
| `active` | Normal access |
| `suspended` | Temporarily blocked |
| `deactivated` | Self-deactivated |
| `banned` | Permanently blocked |

#### `DELETE /users/:id` _(admin)_
Soft-delete a user account.

---

### 2FA

#### `POST /2fa/enable`
Initiate 2FA setup — sends a setup OTP.

#### `POST /2fa/verify`
Verify the 2FA TOTP code.

**Body**
```json
{ "totp": "123456" }
```

#### `DELETE /2fa/disable`
Disable 2FA on the current account.

---

### Sessions

#### `GET /sessions`
List all active sessions for the current user.

#### `DELETE /sessions/:id`
Revoke a specific session by UUID.

---

### Devices

#### `GET /devices`
List all known devices for the current user.

#### `PATCH /devices/:id`
Trust or untrust a device.

**Body**
```json
{ "trusted": true }
```

#### `DELETE /devices/:id/revoke`
Soft-revoke a device (keeps the record).

#### `DELETE /devices/:id`
Permanently remove a device record.

---

### Referrals

#### `GET /referrals/my-code`
Get the current user's referral code.

#### `POST /referrals/generate-code`
Generate a referral code (idempotent — safe to call multiple times).

#### `GET /referrals`
List all referrals made by the current user.

**Query** `?page=1&limit=20`

---

### Roles _(admin only)_

#### `GET /roles`
List all roles.

#### `POST /roles`
Create a new role.

**Body**
```json
{
  "name": "Moderator",
  "slug": "moderator",
  "description": "Can moderate content"
}
```

| Field | Rules |
|-------|-------|
| slug | lowercase, `a-z0-9-` only |

#### `DELETE /roles/:roleId`
Delete a non-system role.

#### `POST /roles/:roleId/users/:userId`
Assign a role to a user.

#### `DELETE /roles/:roleId/users/:userId`
Revoke a role from a user.

---

### Audit

#### `GET /audit/me`
List audit log entries for the current user.

**Query** `?page=1&limit=20`

#### `GET /audit/resource/:resource/:resourceId`
List audit entries for a specific resource. _(admin)_

**Example** `GET /audit/resource/users/uuid`

---

## Error Responses

All errors follow a consistent shape:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "requestId": "uuid"
}
```

| HTTP | code | Cause |
|------|------|-------|
| 400 | `BAD_REQUEST` | Invalid input |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Authenticated but not allowed |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate resource |
| 422 | `VALIDATION_ERROR` | TypeBox schema failure |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Rate Limits

Rate limits are per IP address per action window (configured via env).

| Route | Default limit | Window |
|-------|--------------|--------|
| `POST /auth/otp/send` | 5 | 1 min |
| `POST /auth/otp/verify` | 10 | 1 min |
| `POST /auth/login/pin` | 5 | 1 min |
| `POST /auth/login/otp` | 5 | 1 min |
| `POST /pin/reset/request` | 3 | 1 min |

When exceeded, the API returns `429` with a `Retry-After` seconds value in the error message.