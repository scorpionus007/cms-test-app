# SecureDApp CMS – API & Architecture Documentation

Complete reference for the DPDP-oriented multi-tenant consent and audit backend: stack, database entities, APIs, auth, and flows.

---

## 1. Project Overview


| Item          | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| **Stack**     | Node.js, Express, MySQL, Sequelize                                  |
| **Purpose**   | Multi-tenant consent management and audit backend (DPDP compliance) |
| **Auth**      | Google OAuth (ID token) → JWT (onboarding or full tenant JWT)       |
| **Isolation** | Tenant-scoped; `tenant_id` from JWT used for all data access        |


### 1.1 Entry Points


| URL                                     | Description                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/api-docs`                             | Swagger UI                                                                                       |
| `/api-docs.json`                        | OpenAPI spec (JSON)                                                                              |
| `/auth/`*                               | Authentication                                                                                   |
| `/tenant/*`                             | Tenant onboarding, tenant info, **apps** (CRUD), API keys                                        |
| `/tenant/apps/:appId/policy-versions`   | Policy versions **per app**                                                                      |
| `/tenant/apps/:appId/dsr`               | DSR list, update, export **per app**                                                             |
| `/apps/:appId/consent`                  | Consent (grant, get state, withdraw) **per app**                                                 |
| `/clients`                              | Client (user) management (tenant-level, shared across apps)                                      |
| `/audit-logs`                           | Audit log listing                                                                                |
| `/purposes`                             | Purposes (tenant-level, shared across apps; supports purpose_code, version_label, required_data) |
| `/data-catalog`                         | Platform-wide data catalog (read-only; data_id list for purposes)                                |
| `/apps/:appId/consent/:userId/artifact` | Consent artifact (purpose id, data_ids, audit, signature, status)                                |
| `/apps/:appId/consent/:userId/export`   | Legacy consent export                                                                            |
| `/dsr/request`                          | Public DSR submit (body must include `app_id`)                                                   |
| `/public/purposes`                      | Public: list purposes (tenant)                                                                   |
| `/public/apps/:appId/policy`            | Public: active policy for app                                                                    |
| `/public/apps/:appId/consent`           | Public: grant/withdraw consent for app                                                           |


### 1.2 Security Middleware (Global)

- **Helmet**: Security headers (CSP in production, HSTS, etc.)
- **CORS**: Configurable via `CORS_ORIGIN` (comma-separated); credentials allowed
- **JSON body limit**: 100 KB
- **Rate limiting**: General API 200 req / 15 min; auth routes 10 req / 15 min

---

## 2. Authentication & Authorization

### 2.1 JWT Types


| Type               | When                                                       | Payload                                                     |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------- |
| **Onboarding JWT** | After Google login when no client exists                   | `email`, `name`, `onboarding: true`                         |
| **Full JWT**       | After Google login when client exists, or after onboarding | `tenant_id`, `client_id`, `email`, `name`, `role`, `scopes` |


- **Header**: `Authorization: Bearer <token>`
- **Algorithm**: HS256
- **Expiry**: `JWT_EXPIRES_IN` (default `7d`)

### 2.2 Middleware


| Middleware                      | Use                  | Effect                                                     |
| ------------------------------- | -------------------- | ---------------------------------------------------------- |
| `authenticate`                  | All protected routes | Verifies JWT; sets `req.user` (or 401)                     |
| `requireTenant`                 | After `authenticate` | Rejects onboarding JWTs (403 "Tenant onboarding required") |
| `requireRole('owner', 'admin')` | Role-based           | Rejects if `req.user.role` not in list (403)               |
| `authorize('consent:write')`    | Scope-based          | Rejects if no required scope in `req.user.scopes` (403)    |


### 2.3 Default Scopes (Full JWT)

- `consent:write`
- `dsr:submit`
- `audit:read`

### 2.4 Client Roles

- `owner`, `admin`, `compliance_manager`, `auditor`, `viewer`

---

## 3. Database Entities (Tables)

All IDs are UUIDs unless noted. Tables are listed in dependency order.

### 3.1 `tenants`


| Column            | Type                                  | Nullable | Default  | Description                          |
| ----------------- | ------------------------------------- | -------- | -------- | ------------------------------------ |
| `id`              | UUID                                  | NO       | UUIDV4   | Primary key                          |
| `name`            | VARCHAR(255)                          | NO       | -        | Organization name                    |
| `domain`          | VARCHAR(255)                          | YES      | -        | Domain                               |
| `industry`        | VARCHAR(100)                          | YES      | -        | Industry                             |
| `country`         | VARCHAR(100)                          | NO       | -        | Country                              |
| `dpdp_applicable` | BOOLEAN                               | NO       | true     | DPDP applicability                   |
| `status`          | ENUM('active','suspended','inactive') | YES      | 'active' | Tenant status                        |
| `trust_level`     | INT                                   | YES      | 1        | Trust level                          |
| `created_by`      | UUID                                  | YES      | -        | Client (owner) ID who created tenant |
| `created_at`      | DATE                                  | NO       | NOW      | Created at                           |


**Indexes:** `domain`.

---

### 3.2 `apps`

Each tenant can have multiple apps. **Clients** are shared across apps; **purposes** are tenant-level (shared); **policy**, **consent**, and **DSR** are per app.


| Column       | Type                      | Nullable | Default  | Description                        |
| ------------ | ------------------------- | -------- | -------- | ---------------------------------- |
| `id`         | UUID                      | NO       | UUIDV4   | Primary key                        |
| `tenant_id`  | UUID                      | NO       | -        | FK → tenants.id                    |
| `name`       | VARCHAR(255)              | NO       | -        | Display name                       |
| `slug`       | VARCHAR(100)              | NO       | -        | URL-friendly id, unique per tenant |
| `status`     | ENUM('active','inactive') | YES      | 'active' | Status                             |
| `created_at` | DATE                      | NO       | NOW      | Created at                         |
| `updated_at` | DATE                      | NO       | NOW      | Updated at                         |


**Indexes:** `tenant_id`; unique `(tenant_id, slug)`.

---

### 3.3 `clients`


| Column          | Type                                                          | Nullable | Default  | Description               |
| --------------- | ------------------------------------------------------------- | -------- | -------- | ------------------------- |
| `id`            | UUID                                                          | NO       | UUIDV4   | Primary key               |
| `tenant_id`     | UUID                                                          | NO       | -        | FK → tenants.id           |
| `name`          | VARCHAR(150)                                                  | YES      | -        | Display name              |
| `email`         | VARCHAR(255)                                                  | NO       | -        | Email (unique per tenant) |
| `provider`      | ENUM('google','email')consen                                  | NO       | 'google' | Auth provider             |
| `role`          | ENUM('owner','admin','compliance_manager','auditor','viewer') | NO       | 'admin'  | Role                      |
| `status`        | ENUM('active','inactive','suspended')                         | NO       | 'active' | Status                    |
| `last_login_at` | DATE                                                          | YES      | -        | Last login time           |
| `created_at`    | DATE                                                          | NO       | NOW      | Created at                |
| `deleted_at`    | DATE                                                          | YES      | -        | Soft delete               |


**Indexes:** Unique `(tenant_id, email)`; `tenant_id`; `role`.

**Rules:** Same email can exist in different tenants.

---

### 3.4 `data_catalog`

Platform-wide catalog of data identifiers (no tenant_id). Referenced by purposes via `required_data` (array of `data_id`).


| Column              | Type                        | Nullable | Default  | Description                                                                                                   |
| ------------------- | --------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `id`                | UUID                        | NO       | UUIDV4   | Primary key                                                                                                   |
| `data_id`           | VARCHAR(100)                | NO       | -        | Stable ID (e.g. AADHAAR_NUMBER); unique                                                                       |
| `category`          | VARCHAR(100)                | YES      | -        | e.g. identity, address                                                                                        |
| `description`       | TEXT                        | YES      | -        | Description                                                                                                   |
| `sensitivity`       | ENUM('LOW','MEDIUM','HIGH') | YES      | -        | Sensitivity                                                                                                   |
| `max_validity_days` | INT                         | YES      | -        | Max consent validity days for this data type (DPDP); purpose.validity_days cannot exceed min of required_data |
| `status`            | ENUM('active','inactive')   | NO       | 'active' | Status                                                                                                        |
| `created_at`        | DATE                        | NO       | NOW      | Created at                                                                                                    |
| `updated_at`        | DATE                        | NO       | NOW      | Updated at                                                                                                    |


**Indexes:** Unique `data_id`; `status`. **Seed:** Run `npm run db:seed-catalog` after sync.

---

### 3.5 `purposes`


| Column           | Type         | Nullable | Default | Description                                                                               |
| ---------------- | ------------ | -------- | ------- | ----------------------------------------------------------------------------------------- |
| `id`             | UUID         | NO       | UUIDV4  | Primary key                                                                               |
| `tenant_id`      | UUID         | NO       | -       | FK → tenants.id                                                                           |
| `name`           | VARCHAR(255) | NO       | -       | Purpose name                                                                              |
| `description`    | TEXT         | YES      | -       | Description                                                                               |
| `required`       | BOOLEAN      | NO       | false   | Required for consent banner                                                               |
| `required_data`  | JSON         | YES      | -       | Array of data_id from data_catalog                                                        |
| `permissions`    | JSON         | YES      | -       | e.g. allowed_access, allowed_frequency                                                    |
| `validity_days`  | INT          | YES      | -       | Consent validity days; must be <= min of data_catalog.max_validity_days for required_data |
| `retention_days` | INT          | YES      | -       | Retention in days                                                                         |
| `active`         | BOOLEAN      | NO       | true    | Active flag                                                                               |
| `created_at`     | DATE         | NO       | NOW     | Created at                                                                                |
| `updated_at`     | DATE         | NO       | NOW     | Updated at                                                                                |


**Indexes:** `tenant_id`; unique `(tenant_id, name)`.

---

### 3.6 `policy_versions`


| Column           | Type         | Nullable | Default | Description                     |
| ---------------- | ------------ | -------- | ------- | ------------------------------- |
| `id`             | UUID         | NO       | UUIDV4  | Primary key                     |
| `tenant_id`      | UUID         | NO       | -       | FK → tenants.id                 |
| `version_label`  | VARCHAR(100) | NO       | -       | Version label                   |
| `document_hash`  | VARCHAR(64)  | NO       | -       | SHA-256 hash of policy document |
| `effective_from` | DATE         | NO       | -       | Effective from                  |
| `created_at`     | DATE         | NO       | NOW     | Created at                      |


**Indexes:** `tenant_id`; Unique `(tenant_id, version_label)`.

---

### 3.7 `consents`


| Column              | Type                                 | Nullable | Default | Description                               |
| ------------------- | ------------------------------------ | -------- | ------- | ----------------------------------------- |
| `id`                | UUID                                 | NO       | UUIDV4  | Primary key                               |
| `tenant_id`         | UUID                                 | NO       | -       | FK → tenants.id                           |
| `app_id`            | UUID                                 | YES      | -       | FK → apps.id (per-app consent)            |
| `user_id`           | VARCHAR(255)                         | NO       | -       | Pseudonymous user identifier              |
| `purpose_id`        | UUID                                 | NO       | -       | FK → purposes.id                          |
| `policy_version_id` | UUID                                 | YES      | -       | Policy version at grant                   |
| `granted_at`        | DATE                                 | YES      | -       | When granted                              |
| `expires_at`        | DATE                                 | YES      | -       | When expires (from purpose.validity_days) |
| `status`            | ENUM('ACTIVE','WITHDRAWN','EXPIRED') | YES      | ACTIVE  | Current status                            |
| `created_at`        | DATE                                 | NO       | NOW     | Created at                                |


**Indexes:** `tenant_id`; `app_id`; unique `(tenant_id, app_id, user_id, purpose_id)`; `idx_consent_lookup (tenant_id, app_id, user_id)`.

**Rules:** No status column; consent rows are never deleted. Source of truth for “identity” only; state comes from events.

---

### 3.8 `consent_events`


| Column              | Type                        | Nullable | Default           | Description                                  |
| ------------------- | --------------------------- | -------- | ----------------- | -------------------------------------------- |
| `id`                | UUID                        | NO       | UUIDV4            | Primary key                                  |
| `consent_id`        | UUID                        | NO       | -                 | FK → consents.id                             |
| `event_type`        | ENUM('GRANTED','WITHDRAWN') | NO       | -                 | Event type                                   |
| `policy_version_id` | UUID                        | YES      | -                 | FK → policy_versions.id (null for WITHDRAWN) |
| `actor_type`        | VARCHAR(50)                 | YES      | -                 | e.g. 'client'                                |
| `previous_hash`     | VARCHAR(64)                 | YES      | -                 | Hash of previous event (null for first)      |
| `event_hash`        | VARCHAR(64)                 | YES      | -                 | SHA256 chain hash                            |
| `created_at`        | DATE                        | NO       | CURRENT_TIMESTAMP | DB-generated for chronological order         |


**Indexes:** `consent_id`; `idx_event_lookup (consent_id, created_at)`; `idx_event_type (event_type)`.

**Rules:** Append-only; no updates or deletes. `created_at` is DB-generated (CURRENT_TIMESTAMP) for guaranteed chronological order. Hash chain: `event_hash = SHA256(consent_id + event_type + policy_version_id + previous_hash + timestamp)`.

---

### 3.9 `consent_state_cache`


| Column              | Type                        | Nullable | Default | Description              |
| ------------------- | --------------------------- | -------- | ------- | ------------------------ |
| `tenant_id`         | UUID                        | NO       | -       | PK, FK → tenants.id      |
| `user_id`           | VARCHAR(255)                | NO       | -       | PK, pseudonymous user id |
| `purpose_id`        | UUID                        | NO       | -       | PK, FK → purposes.id     |
| `current_status`    | ENUM('granted','withdrawn') | NO       | -       | Derived status           |
| `policy_version_id` | UUID                        | YES      | -       | FK → policy_versions.id  |
| `updated_at`        | DATE                        | NO       | NOW     | Last update              |


**Indexes:** `(tenant_id, user_id)`.

**Rules:** Read-optimized cache only; source of truth is `consent_events`. Updated on every GRANTED/WITHDRAWN event.

---

### 3.10 `audit_logs`


| Column            | Type         | Nullable | Default | Description                  |
| ----------------- | ------------ | -------- | ------- | ---------------------------- |
| `id`              | UUID         | NO       | UUIDV4  | Primary key                  |
| `tenant_id`       | UUID         | NO       | -       | FK → tenants.id              |
| `actor_client_id` | UUID         | YES      | -       | Client who performed action  |
| `action`          | VARCHAR(100) | NO       | -       | Action name                  |
| `resource_type`   | VARCHAR(100) | YES      | -       | e.g. tenant, client, consent |
| `resource_id`     | UUID         | YES      | -       | Affected resource id         |
| `metadata`        | JSON         | YES      | -       | Extra context                |
| `ip_address`      | VARCHAR(45)  | YES      | -       | Client IP                    |
| `created_at`      | DATE         | NO       | NOW     | Created at                   |


**Indexes:** `tenant_id`; `action`; `created_at`.

**Audit actions used:** `TENANT_CREATED`, `CLIENT_LOGIN`, `CLIENT_INVITED`, `CONSENT_GRANTED`, `CONSENT_WITHDRAWN`, `CONSENT_READ`.

---

### 3.11 `webhooks`


| Column       | Type          | Nullable | Default | Description                                   |
| ------------ | ------------- | -------- | ------- | --------------------------------------------- |
| `id`         | UUID          | NO       | UUIDV4  | Primary key                                   |
| `tenant_id`  | UUID          | NO       | -       | FK → tenants.id                               |
| `url`        | VARCHAR(2048) | NO       | -       | Webhook URL                                   |
| `secret`     | VARCHAR(255)  | YES      | -       | HMAC secret (for signing)                     |
| `events`     | JSON          | YES      | -       | Array of event names (e.g. consent.withdrawn) |
| `active`     | BOOLEAN       | NO       | true    | Active flag                                   |
| `created_at` | DATE          | NO       | NOW     | Created at                                    |


**Indexes:** `tenant_id`.

---

### 3.12 `dsr_requests`


| Column         | Type                                                                                          | Nullable | Default   | Description          |
| -------------- | --------------------------------------------------------------------------------------------- | -------- | --------- | -------------------- |
| `id`           | UUID                                                                                          | NO       | UUIDV4    | Primary key          |
| `tenant_id`    | UUID                                                                                          | NO       | -         | FK → tenants.id      |
| `user_id`      | VARCHAR(255)                                                                                  | NO       | -         | Pseudonymous user id |
| `request_type` | ENUM('access','erasure','correction','portability')                                           | NO       | -         | DSR type             |
| `status`       | ENUM('created','identity_verified','approved','executing','completed','rejected','escalated') | NO       | 'created' | Status               |
| `created_at`   | DATE                                                                                          | NO       | NOW       | Created at           |


**Indexes:** `tenant_id`; `(tenant_id, status)`.

---

### 3.13 `dsr_events`


| Column       | Type                       | Nullable | Default | Description          |
| ------------ | -------------------------- | -------- | ------- | -------------------- |
| `id`         | UUID                       | NO       | UUIDV4  | Primary key          |
| `dsr_id`     | UUID                       | NO       | -       | FK → dsr_requests.id |
| `status`     | ENUM(same as dsr_requests) | NO       | -       | Status at event time |
| `metadata`   | JSON                       | YES      | -       | Extra context        |
| `created_at` | DATE                       | NO       | NOW     | Created at           |


**Indexes:** `dsr_id`.

---

### 3.14 `breach_reports`


| Column        | Type | Nullable | Default | Description          |
| ------------- | ---- | -------- | ------- | -------------------- |
| `id`          | UUID | NO       | UUIDV4  | Primary key          |
| `tenant_id`   | UUID | NO       | -       | FK → tenants.id      |
| `summary`     | TEXT | NO       | -       | Summary              |
| `occurred_at` | DATE | NO       | -       | When breach occurred |
| `reported_at` | DATE | NO       | NOW     | When reported        |
| `created_at`  | DATE | NO       | NOW     | Created at           |


**Indexes:** `tenant_id`.

---

### 3.15 Entity Relationship Summary

- **Tenant** → has many: Client, Purpose, PolicyVersion, Consent, ConsentStateCache, Webhook, AuditLog, DsrRequest, BreachReport.
- **Client** → belongs to Tenant.
- **Purpose** → belongs to Tenant; has many Consent, ConsentStateCache.
- **PolicyVersion** → belongs to Tenant; has many ConsentEvent, ConsentStateCache.
- **Consent** → belongs to Tenant, Purpose; has many ConsentEvent.
- **ConsentEvent** → belongs to Consent, PolicyVersion (optional).
- **ConsentStateCache** → composite PK (tenant_id, user_id, purpose_id); belongs to Tenant, Purpose, PolicyVersion (optional).
- **DsrRequest** → belongs to Tenant; has many DsrEvent.
- **DsrEvent** → belongs to DsrRequest.

---

## 4. APIs – Full Specification

Base path for all below: mounted at `/auth`, `/tenant`, `/clients`, `/audit-logs`, `/consent` (see app.js). All JSON request/response use `Content-Type: application/json`.

### 4.1 Auth

#### POST `/auth/google-login`

**Description:** Verify Google ID token; return onboarding JWT (no tenant) or full JWT (with tenant_id, client_id). On full login, updates `last_login_at` and writes audit `CLIENT_LOGIN`. Blocked if client status is suspended/inactive.

**Auth:** None (rate-limited only).

**Request body:**


| Field         | Type   | Required | Description                      |
| ------------- | ------ | -------- | -------------------------------- |
| `googleToken` | string | Yes      | Google ID token (length 50–8000) |


**Response 200 – Existing client (full JWT):**

```json
{
  "token": "eyJ...",
  "tenant_id": "uuid",
  "client_id": "uuid",
  "email": "user@example.com",
  "name": "User Name"
}
```

**Response 200 – New user (onboarding JWT):**

```json
{
  "token": "eyJ...",
  "onboarding": true,
  "email": "user@example.com",
  "name": "User Name"
}
```

**Error responses:**  
400 – Missing/invalid body.  
401 – Invalid or expired Google token; email not provided.  
403 – Account disabled (suspended/inactive).  
429 – Too many login attempts.

---

#### GET `/auth/me`

**Description:** Returns current user’s client, tenant, and permissions. Requires full JWT (onboarding not allowed on this route in practice; use after requireTenant if mounted elsewhere).

**Auth:** Bearer JWT (full JWT; `requireTenant` in practice).

**Request:** No body. No query params.

**Response 200:**

```json
{
  "client": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "role": "owner",
    "status": "active",
    "created_at": "ISO8601"
  },
  "tenant": {
    "id": "uuid",
    "name": "string",
    "domain": "string",
    "industry": "string",
    "country": "string",
    "dpdp_applicable": true,
    "created_at": "ISO8601"
  },
  "permissions": ["consent:write", "dsr:submit", "audit:read"]
}
```

**Error responses:** 401 Unauthorized; 403 Tenant onboarding required; 404 User or tenant not found.

---

### 4.2 Tenant

#### POST `/tenant/onboard`

**Description:** First-time onboarding: create tenant and owner client, set `tenant.created_by`, return full JWT. Audit: `TENANT_CREATED`. Caller must have onboarding JWT (no tenant_id yet).

**Auth:** Bearer JWT (onboarding JWT accepted).

**Request body:**


| Field               | Type   | Required | Description       |
| ------------------- | ------ | -------- | ----------------- |
| `organization_name` | string | Yes      | Organization name |
| `country`           | string | Yes      | Country           |
| `industry`          | string | No       | Industry          |


**Response 201:**

```json
{
  "tenant": {
    "id": "uuid",
    "name": "string",
    "domain": "null",
    "industry": "string",
    "country": "string",
    "dpdp_applicable": true,
    "created_by": "uuid",
    "created_at": "ISO8601"
  },
  "client": {
    "id": "uuid",
    "tenant_id": "uuid",
    "email": "string",
    "name": "string",
    "role": "owner",
    "status": "active",
    "provider": "google",
    "created_at": "ISO8601"
  },
  "token": "eyJ..."
}
```

**Error responses:** 400 User already onboarded or validation error; 401 Unauthorized; 409 Organization name or domain already exists.

---

#### GET `/tenant/me`

**Description:** Get current tenant by JWT `tenant_id`.

**Auth:** Bearer JWT + requireTenant.

**Request:** No body. No query params.

**Response 200:** Tenant object (id, name, domain, industry, country, dpdp_applicable, created_by, created_at).

**Error responses:** 401; 403; 404 Tenant not found.

---

### 4.3 Clients

#### POST `/clients/invite`

**Description:** Invite a new client to the tenant (same email not allowed within tenant). New client created with status `inactive`. Audit: `CLIENT_INVITED`.

**Auth:** Bearer JWT + requireTenant + requireRole('owner', 'admin').

**Request body:**


| Field   | Type   | Required | Description                                                                |
| ------- | ------ | -------- | -------------------------------------------------------------------------- |
| `email` | string | Yes      | Valid email                                                                |
| `role`  | string | No       | One of: owner, admin, compliance_manager, auditor, viewer (default viewer) |


**Response 201:** Client object (id, tenant_id, email, name, role, status, provider, created_at, etc.).

**Error responses:** 400 Validation; 401; 403; 409 Client with this email already exists in the organization.

---

#### GET `/clients`

**Description:** List all clients for the current tenant.

**Auth:** Bearer JWT + requireTenant.

**Request:** No body. No query params.

**Response 200:**

```json
{
  "clients": [
    {
      "id": "uuid",
      "email": "string",
      "name": "string",
      "role": "string",
      "status": "string",
      "provider": "string",
      "created_at": "ISO8601"
    }
  ]
}
```

**Error responses:** 401; 403.

---

### 4.4 Audit logs

#### GET `/audit-logs`

**Description:** List audit logs for the current tenant with optional filters and pagination.

**Auth:** Bearer JWT + requireTenant + requireRole('owner', 'admin').

**Query parameters:**


| Param       | Type   | Required | Description                             |
| ----------- | ------ | -------- | --------------------------------------- |
| `action`    | string | No       | Filter by action (e.g. CONSENT_GRANTED) |
| `from_date` | string | No       | ISO date (inclusive)                    |
| `to_date`   | string | No       | ISO date (inclusive)                    |
| `page`      | number | No       | Default 1                               |
| `limit`     | number | No       | Default 20, max 100                     |


**Response 200:**

```json
{
  "logs": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "actor_client_id": "uuid",
      "action": "string",
      "resource_type": "string",
      "resource_id": "uuid",
      "metadata": {},
      "ip_address": "string",
      "created_at": "ISO8601"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

**Error responses:** 401; 403.

---

### 4.5 Consent

All consent routes: Bearer JWT + requireTenant + authorize('consent:write'). Tenant is always taken from JWT.

#### GET `/consent/:userId`

**Description:** Consent Read / Derivation Layer. Derives current consent state from `consent_events` (latest event per consent for tenant+user). No status stored in `consents` table. All queries scoped by `tenant_id`. Audits `CONSENT_READ`.

**Request:** Path param `userId` (required, non-empty string).

**Response 200:**

```json
{
  "consents": [
    {
      "purposeId": "uuid",
      "status": "granted",
      "policyVersionId": "uuid",
      "timestamp": "ISO-8601"
    },
    {
      "purposeId": "uuid",
      "status": "withdrawn",
      "policyVersionId": null,
      "timestamp": "ISO-8601"
    }
  ]
}
```

**Error responses:** 400 Validation (e.g. userId missing); 401; 403.

---

#### POST `/consent`

**Description:** Grant consent: find or create consent identity (tenant_id, user_id, purpose_id), append GRANTED event with hash chain, update consent_state_cache, write audit log. Does not trigger webhook.

**Request body:**


| Field             | Type   | Required | Description                                    |
| ----------------- | ------ | -------- | ---------------------------------------------- |
| `userId`          | string | Yes      | Pseudonymous user identifier                   |
| `purposeId`       | string | Yes      | UUID of purpose (must belong to tenant)        |
| `policyVersionId` | string | Yes      | UUID of policy version (must belong to tenant) |


**Response 200:**

```json
{
  "message": "Consent recorded",
  "consentId": "uuid"
}
```

**Error responses:** 400 Validation (missing/invalid fields or invalid UUIDs); 401; 403; 404 Purpose or policy version not found.

---

#### DELETE `/consent/:userId/:purposeId`

**Description:** Withdraw consent for a single (user, purpose). Consent = identity (immutable); state = derived from events. Backend: find consent by (tenant_id, user_id, purpose_id); if latest event is already WITHDRAWN, return 200 without inserting duplicate (idempotent); else append WITHDRAWN event (hash chain), update consent_state_cache, trigger webhook, audit log. No DELETE or UPDATE on consents table.

**Request:** Path params `userId` (required, non-empty string), `purposeId` (required, UUID).

**Response 200:**

```json
{
  "message": "Consent withdrawn",
  "consentId": "uuid"
}
```

If already withdrawn: `message` may be `"Consent already withdrawn"`; `consentId` still returned.

**Error responses:** 400 Validation; 401; 403; 404 Consent not found for this user and purpose.

---

## 5. Consent Flows (Detail)

### 5.1 Event hash chain

- Each new event stores `previous_hash` = `event_hash` of the latest event for that `consent_id` (null for first event).
- `event_hash = SHA256(consent_id + event_type + policy_version_id + previous_hash + timestamp)` (empty string for null previous_hash or null policy_version_id).
- Tampering with any past event breaks the chain.

### 5.2 Grant flow (POST /consent)

1. Validate tenant (from JWT), body (userId, purposeId, policyVersionId).
2. Validate purpose and policy version exist and belong to tenant.
3. Find or create consent (tenant_id, user_id, purpose_id).
4. Get latest consent_event for this consent → previous_hash.
5. Insert new consent_event: GRANTED, policy_version_id, previous_hash, event_hash.
6. Upsert consent_state_cache: current_status = granted, policy_version_id, updated_at.
7. Audit log: CONSENT_GRANTED (resource_type consent, resource_id consent.id, metadata with user_id, purpose_id, policy_version_id).

### 5.3 Withdraw flow (DELETE /consent/:userId/:purposeId)

1. Find consent identity: `WHERE tenant_id = ? AND user_id = ? AND purpose_id = ?`. If not found → 404.
2. Get latest event for that consent: `ORDER BY created_at DESC LIMIT 1`. If `event_type === 'WITHDRAWN'` → return 200 (already withdrawn; no duplicate event).
3. Append WITHDRAWN event (previous_hash, event_hash chain), upsert consent_state_cache (current_status = withdrawn).
4. Fire-and-forget POST to webhooks subscribing to `consent.withdrawn` (payload: user_id, consent_ids: [consentId], timestamp).
5. Audit log: CONSENT_WITHDRAWN (resource_id = consent.id, metadata: user_id, purpose_id).

### 5.4 Get state (GET /consent/:userId) — Consent Read / Derivation Layer

- **Derives** current state from `consent_events`: one efficient query (latest event per consent for tenant+user). No status in `consents` table.
- Response: `{ consents: [ { purposeId, status: 'granted'|'withdrawn', policyVersionId, timestamp (ISO-8601) } ] }`.
- Audit: `CONSENT_READ` (metadata: user_id).

---

## 6. Audit Actions Reference


| Action            | When                                     | resource_type | resource_id | Typical metadata                       |
| ----------------- | ---------------------------------------- | ------------- | ----------- | -------------------------------------- |
| TENANT_CREATED    | After onboarding                         | tenant        | tenant.id   | organization_name, created_by_email    |
| CLIENT_LOGIN      | After Google login (existing client)     | client        | client.id   | email                                  |
| CLIENT_INVITED    | After invite                             | client        | client.id   | invited_email, role                    |
| CONSENT_GRANTED   | After POST /consent                      | consent       | consent.id  | user_id, purpose_id, policy_version_id |
| CONSENT_WITHDRAWN | After DELETE /consent/:userId/:purposeId | consent       | consent.id  | user_id, purpose_id                    |
| CONSENT_READ      | GET /consent/:userId (derivation)        | consent       | null        | user_id                                |


IP for audit is taken from `req.ip` or `x-forwarded-for` when available and passed to `logAction`.

---

## 7. Validation Rules (Summary)

- **Auth:** `googleToken` required, string, length 50–8000.
- **Tenant onboard:** `organization_name`, `country` required; `industry` optional string.
- **Client invite:** `email` required, valid email; `role` optional, one of allowed roles.
- **Consent grant:** `userId` non-empty string; `purposeId`, `policyVersionId` required UUIDs.
- **Consent withdraw:** path `userId` (non-empty), `purposeId` (required UUID).
- **Consent get state:** path `userId` required, non-empty.

Validation errors return 400 with message (and optionally validation details). Express-validator used for body/param validation; consent validator uses shared `handleValidationErrors`.

---

## 8. Error Response Format

All API errors return JSON:

```json
{
  "error": "Human-readable message"
}
```

Optional in non-production: `stack`. Status code in HTTP status (400, 401, 403, 404, 409, 429, 500).

---

## 9. Environment & Configuration

### 9.1 Database (config/database.js)

- **Development:** DB_USER, DB_PASSWORD, DB_NAME (default `securedapp_cms`), DB_HOST (default localhost), DB_PORT (default 3306), DB_LOGGING (true to log SQL).
- **Production:** Same vars; no default for user/password/name/host.

### 9.2 Application

- **NODE_ENV:** development | production.
- **JWT_SECRET:** Required for JWT sign/verify.
- **JWT_EXPIRES_IN:** Optional (default `7d`).
- **GOOGLE_CLIENT_ID:** Required for Google token verification.
- **CORS_ORIGIN:** Optional; comma-separated origins (production).
- **CLEAR_DB_CONFIRM:** Set to `yes` to run db:clear without prompt.

---

## 10. Scripts (package.json)


| Command             | Description                                       |
| ------------------- | ------------------------------------------------- |
| `npm start`         | Run server (node src/index.js)                    |
| `npm run dev`       | Run with --watch                                  |
| `npm run db:create` | Create database (from .env)                       |
| `npm run db:sync`   | Sequelize sync (create/alter tables)              |
| `npm run db:clear`  | Truncate all data (requires CLEAR_DB_CONFIRM=yes) |


Truncation order (clearDb): consent_events, consent_state_cache, consents, dsr_events, dsr_requests, purposes, policy_versions, clients, webhooks, audit_logs, breach_reports, tenants.

---

## 11. File Structure (Relevant)

```
src/
  app.js                    # Express app, routes mount, error handler
  index.js                  # Server entry
  config/
    database.js             # Sequelize config (env)
    security.js             # Rate limiters
    swagger.js              # OpenAPI spec
  middleware/
    auth.middleware.js      # authenticate, requireTenant, requireRole, authorize
    security.js             # Helmet, CORS, JSON limit
  models/
    index.js                # Sequelize init + associations
    tenant.js, client.js, purpose.js, policyVersion.js
    consent.js, consentEvent.js, consentStateCache.js
    auditLog.js, webhook.js, dsrRequest.js, dsrEvent.js, breachReport.js
  routes/
    auth.routes.js, tenant.routes.js, client.routes.js, audit.routes.js, consent.routes.js
  controllers/
    auth.controller.js, tenant.controller.js, client.controller.js, audit.controller.js, consent.controller.js
  services/
    auth.service.js, tenant.service.js, client.service.js, audit.service.js, consent.service.js
  validators/
    consent.validator.js    # grant, withdraw, getState param/body validation
  scripts/
    createDatabase.js, syncDb.js, clearDb.js
  utils/
    logger.js
docs/
  API_AND_ARCHITECTURE.md   # This document
```

---

This document describes the system as implemented: all APIs, request/response shapes, database entities, consent event-sourcing and hash chain, consent state cache, audit actions, auth, and configuration in one place. Please clear db and sync db. All of the above APIs are implemented.