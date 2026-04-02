# Profile Module — API Routes Documentation

> **Base URL:** `/`
> **Content-Type:** `application/json`
> **Total routes:** 27 (Protected)

### Authentication

Protected routes require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

---

## Table of Contents

1. [Composite Profile](#1-composite-profile)
2. [Addresses](#2-addresses)
3. [Bank Accounts](#3-bank-accounts)
4. [KYC Documents](#4-kyc-documents)
5. [Shop Owner](#5-shop-owner)
6. [Delivery Partner](#6-delivery-partner)
7. [Customer](#7-customer)
8. [Admin](#8-admin)

---

## 1. Composite Profile

Prefix: `/profile`

---

### GET `/profile/me`

**Visibility:** Protected (JWT required)
**Summary:** Get full composite profile. Returns user info + all role profiles + addresses + bank accounts in a single payload.

**Example response** `200 OK`

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Rahul Sharma",
    "phone": "+919876543210",
    "status": "active"
  },
  "roles": ["customer", "delivery_driver"],
  "customerProfile": { ... },
  "deliveryPartnerProfile": { ... },
  "shopOwnerProfile": null,
  "addresses": [
    {
      "id": "...",
      "label": "home",
      "isDefault": true
    }
  ],
  "bankAccounts": [
    {
      "id": "...",
      "bankName": "HDFC Bank",
      "accountNumberLast4": "1234",
      "isPrimary": true
    }
  ]
}
```

---

## 2. Addresses

Prefix: `/addresses`

---

### GET `/addresses`

**Visibility:** Protected (JWT required)
**Summary:** List own addresses. Returns an array of addresses, ordered by default status first.

**Example response** `200 OK`

```json
[
  {
    "id": "add-uuid",
    "label": "home",
    "line1": "Flat 302, Green Valley Apts",
    "line2": "Hinjewadi Phase 1",
    "cityId": "city-uuid",
    "pincode": "411057",
    "state": "Maharashtra",
    "country": "India",
    "latitude": 18.5913,
    "longitude": 73.7389,
    "isDefault": true
  }
]
```

---

### POST `/addresses`

**Visibility:** Protected (JWT required)
**Summary:** Create a new address. Must include accurate GPS coordinates for precise routing. Coordinates are verified against serviceable boundaries.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `enum` | ❌ | `home`, `work`, `office`, `hotel`, `other` (default: `home`) |
| `customLabel` | `string` | ❌ | Required if `label` is `other` |
| `line1` | `string` | ✅ | Flat/House number |
| `line2` | `string` | ❌ | Street/Area |
| `landmark` | `string` | ❌ | Nearby landmark |
| `cityId` | `uuid` | ✅ | Active City UUID |
| `pincode` | `string` | ✅ | Exactly 6 digits |
| `state` | `string` | ✅ | State Name |
| `country` | `string` | ❌ | Default: "India" |
| `latitude` | `number` | ✅ | GPS Latitude |
| `longitude` | `number` | ✅ | GPS Longitude |

**Example request**

```json
{
  "line1": "Flat 302, Tower B",
  "cityId": "550e8400-e29b-41d4-a716-446655440000",
  "pincode": "411057",
  "state": "Maharashtra",
  "latitude": 18.5913,
  "longitude": 73.7389
}
```

---

### PATCH `/addresses/:id`

**Visibility:** Protected (JWT required)
**Summary:** Update an address. If `latitude`/`longitude` are updated, the backend re-verifies serviceability. 

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `uuid` | Address ID |

---

## 2.5 Discovery (Mapbox)

Prefix: `/platform/location`

These endpoints help the frontend discover address details before calling `POST /addresses`.

### GET `/platform/location/autocomplete`

**Summary:** Fetch address suggestions using Mapbox SearchBox API.

**Query parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | `string` | ✅ | Search text |
| `sessionToken` | `uuid` | ❌ | UUID to group suggestions and retrieve for billing. |

### GET `/platform/location/retrieve/:mapboxId`

**Summary:** Get full `(lat, lng)` and address components for a selection.

**Query parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionToken` | `uuid` | ❌ | Must match the one used in `autocomplete`. |

### GET `/platform/location/reverse-geocode`

**Summary:** Get address name from GPS coordinates. Returns `AddressDetails` compatible with the Address form.

---

### POST `/addresses/:id/default`

**Visibility:** Protected (JWT required)
**Summary:** Set an address as the default delivery location. Unsets default from all other addresses.

---

### DELETE `/addresses/:id`

**Visibility:** Protected (JWT required)
**Summary:** Soft-delete an address.

**Error responses**

| Status | Reason |
|--------|--------|
| `409` | Cannot delete the default address. Pick another default first. |

---

## 3. Bank Accounts

Prefix: `/bank-accounts`
*(Note: Edited accounts are not allowed. Add new and delete old.)*

---

### GET `/bank-accounts`

**Visibility:** Protected (JWT required)
**Summary:** List own bank accounts with sensitive numbers masked (only `accountNumberLast4` returned).

---

### POST `/bank-accounts`

**Visibility:** Protected (JWT required)
**Summary:** Add a new bank account. Uses Razorpay IFSC to automatically resolve Bank and Branch details if omitted.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountHolderName`| `string` | ✅ | Name exactly as on bank records |
| `accountNumber` | `string` | ✅ | Encrypted on server, stripped in response |
| `ifscCode` | `string` | ✅ | Exactly 11 chars (e.g. `HDFC0001234`) |
| `bankName` | `string` | ❌ | Backend auto-resolves via Razorpay. Can override. |
| `branchName` | `string` | ❌ | Backend auto-resolves via Razorpay. Can override. |
| `accountType` | `enum` | ❌ | `savings`, `current`, `salary` (default: `savings`) |
| `setAsPrimary` | `boolean`| ❌ | Sets this account as default on success |

**Example request**

```json
{
  "accountHolderName": "Rahul Sharma",
  "accountNumber": "0412345678901",
  "ifscCode": "HDFC0001234",
  "setAsPrimary": true
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | `INVALID_IFSC` if bankName is omitted and Razorpay API returns 404. |

---

### POST `/bank-accounts/:id/primary`

**Visibility:** Protected (JWT required)
**Summary:** Set a bank account as primary for payouts across all roles (Delivery Partner or Shop Owner).

---

### DELETE `/bank-accounts/:id`

**Visibility:** Protected (JWT required)
**Summary:** Soft delete a bank account.

**Error responses**

| Status | Reason |
|--------|--------|
| `409` | Cannot delete a primary bank account. Reassign primary status first. |

---

## 4. KYC Documents

Prefix: `/kyc`

---

### GET `/kyc`

**Visibility:** Protected (JWT required)
**Summary:** List all KYC document submissions by the user (pending, rejected, verified, expired).

---

### POST `/kyc/submit`

**Visibility:** Protected (JWT required)
**Summary:** Submit a KYC document for review (e.g., Aadhaar, PAN, Driving License).

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `documentType` | `enum` | ✅ | `aadhaar`, `pan`, `driving_license`, etc. |
| `documentNumberEncrypted`| `string`| ❌ | Opaque string containing encrypted document ID. |
| `documentNumberLast4`| `string` | ❌ | Last 4 chars. |
| `frontImageKey` | `string` | ❌ | Object store upload key. |
| `backImageKey` | `string` | ❌ | Object store upload key. |

**Error responses**

| Status | Reason |
|--------|--------|
| `409` | An active/pending submission for this document type already exists. |

---

## 5. Shop Owner

Prefix: `/shop-owner`

---

### POST `/shop-owner/onboard`

**Visibility:** Protected (JWT required)
**Summary:** Onboard the authenticated user into the Shop Owner role. Grants the `shopkeeper` role upon success. Returns idempotently if already registered.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `businessName` | `string` | ❌ | Name of the business entity |
| `businessType` | `string` | ❌ | Sole Proprietorship, LLP, Pvt Ltd, etc. |
| `tradeName` | `string` | ❌ | The public-facing name of the brand |

---

### GET `/shop-owner/me`

**Visibility:** Protected (JWT required · shopkeeper role only)
**Summary:** Fetch the shop owner profile info including terminal KYC status for business.

---

### PATCH `/shop-owner/me`

**Visibility:** Protected (JWT required · shopkeeper role only)
**Summary:** Update basic shop owner profile details. 

---

## 6. Delivery Partner

Prefix: `/delivery-partner`
*(Note: Real-time location & dispatch statuses are managed in the Logistic module via `delivery_partner_sessions`.)*

---

### POST `/delivery-partner/onboard`

**Visibility:** Protected (JWT required)
**Summary:** Onboard authenticated user as a delivery partner. Grants the `delivery_driver` role.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicleType` | `enum` | ✅ | `bicycle`, `motorcycle`, `van`, etc. |
| `vehicleNumber`| `string` | ❌ | Optional for bicycle |
| `licenseNumber`| `string` | ❌ | Required for motorized |

**Error responses**

| Status | Reason |
|--------|--------|
| `409` | A partner with this license number already exists. |

---

### GET `/delivery-partner/me`

**Visibility:** Protected (JWT required · delivery_driver role only)
**Summary:** Get core partner profile (KYC status, stats, vehicle info).

---

### PATCH `/delivery-partner/me`

**Visibility:** Protected (JWT required · delivery_driver role only)
**Summary:** Update partner profile. Attempting to change tracking data here will fail.

---

## 7. Customer

Prefix: `/customer`

---

### GET `/customer/me`

**Visibility:** Protected (JWT required · customer role only)
**Summary:** Get customer profile including denormalized `lifetimeSpend`, `loyaltyPoints`, and `preferences`.

---

### PATCH `/customer/me/preferences`

**Visibility:** Protected (JWT required · customer role only)
**Summary:** Update marketing/push notification preferences inside the `preferences` JSONB column.

---

## 8. Admin

Prefix: `/admin`
Required: `admin` role in Auth token.

---

### GET `/admin/kyc/pending`
Paginated queue of pending KYC submissions for manual approval.

### POST `/admin/kyc/:id/review`
Approve or Reject a KYC document.

**Request body**
- `status`: `verified` or `rejected`
- `rejectionReason`: Required if rejected.

### PATCH `/admin/shop-owners/:userId/suspend`
Suspend or unsuspend a shop owner. Revokes backend access for the user to manage shops.

### PATCH `/admin/delivery-partners/:userId/suspend`
Suspend or unsuspend a partner. Instantly cuts off their active Logistics session queue.

### POST `/admin/bank-accounts/:id/verify`
Manually mark a bank account as successfully Penny Drop verified in edge cases.
