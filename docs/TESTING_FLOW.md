# SecureDApp CMS – Detailed Testing Flow

End-to-end testing flow for the entire application: auth, tenant, apps, purposes, policy, consent, public API, DSR, clients, webhooks, and audit. Use this for manual testing or as a reference for automated tests.

---

## Prerequisites

| Item | Action |
|------|--------|
| **Environment** | Copy `.env.example` to `.env`; set `GOOGLE_CLIENT_ID`, `JWT_SECRET`, MySQL `DB_*`, and optionally Redis. |
| **Database** | Run `npm run db:create` (if DB does not exist), then `npm run db:sync`. |
| **Server** | Run `npm start` or `npm run dev`. Base URL: `http://localhost:3000` (or your `PORT`). |
| **Google token** | For auth tests, obtain a Google ID token (e.g. from a small test frontend or Google OAuth Playground). |
| **Tools** | Swagger UI at `http://localhost:3000/api-docs`, or Postman/Insomnia/cURL. |

**Optional:** Use `CLEAR_DB_CONFIRM=yes npm run db:clear` then `npm run db:sync` for a clean state before a full run.

---

## Phase 1: Authentication

### 1.1 Google login (new user – onboarding)

**Request**

```http
POST /auth/google-login
Content-Type: application/json

{ "googleToken": "<valid_google_id_token>" }
```

**Expected**

- **200** – Body includes `token` (JWT), `onboarding: true`, `email`, `name`; `tenant_id` and `client_id` may be null.
- **400** – Missing or invalid body (e.g. no `googleToken`).
- **401** – Invalid or expired Google token.
- **403** – Account disabled (suspended/inactive).
- **429** – Too many login attempts (auth rate limit).

**Check:** Decode the JWT; payload should have `onboarding: true` and no `tenant_id` (or null).

---

### 1.2 Onboarding (create tenant + owner client)

Use the token from step 1.1.

**Request**

```http
POST /tenant/onboard
Authorization: Bearer <onboarding_jwt>
Content-Type: application/json

{
  "organization_name": "Test Org Pvt Ltd",
  "country": "India",
  "industry": "Fintech"
}
```

**Expected**

- **201** – Body: `tenant` (id, name, country, etc.), `client` (id, role: owner, status: active), `token` (new full JWT).
- **400** – User already onboarded or validation error.
- **401** – Missing or invalid token.
- **409** – Organization name (or domain) already exists.

**Check:** Save the new **token** and **tenant.id** and **appId** (you will create an app next). This token is the “full JWT” for all subsequent protected calls.

---

### 1.3 Google login (existing user – full JWT)

If the same Google user already has a client (e.g. after onboarding), call login again with the same `googleToken`.

**Expected**

- **200** – Body: `token`, `tenant_id`, `client_id`, `email`, `name`; **no** `onboarding: true`.

---

### 1.4 Get current user (full JWT)

**Request**

```http
GET /auth/me
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – Body: `client` (id, email, name, role, status, created_at), `tenant` (id, name, domain, country, etc.), `permissions` (e.g. consent:write, dsr:submit, audit:read).
- **401** – Missing or invalid token.
- **403** – Tenant onboarding required (onboarding token used).

---

### 1.5 Get current tenant

**Request**

```http
GET /tenant/me
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – Single tenant object (id, name, domain, industry, country, dpdp_applicable, created_at, etc.).
- **401** / **403** – As above. **404** – Tenant not found (edge case).

---

## Phase 2: Apps (under tenant)

### 2.1 List apps (initially empty)

**Request**

```http
GET /tenant/apps
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – Body: `apps: []` (or list of existing apps).

---

### 2.2 Create first app

**Request**

```http
POST /tenant/apps
Authorization: Bearer <full_jwt>
Content-Type: application/json

{
  "name": "Main Web App",
  "slug": "main-web-app"
}
```

**Expected**

- **201** – Body: `app` with `id`, `tenant_id`, `name`, `slug`, `status: "active"`, `created_at`, `updated_at`.
- **400** – Validation (e.g. missing name/slug, invalid slug format).
- **403** – Not owner/admin.
- **409** – Slug already exists for this tenant.

**Check:** Save **app.id** (`appId`) for policy, consent, DSR, and public API tests.

---

### 2.3 Create second app (optional)

Create another app with a different slug (e.g. `"mobile-app"`) to verify isolation later.

---

### 2.4 Get app by ID

**Request**

```http
GET /tenant/apps/:appId
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – App object.
- **404** – App not found or belongs to another tenant.

---

### 2.5 Update app

**Request**

```http
PUT /tenant/apps/:appId
Authorization: Bearer <full_jwt>
Content-Type: application/json

{ "name": "Main Web App (Updated)", "status": "active" }
```

**Expected**

- **200** – Body: `app` with updated fields.
- **400** – Invalid slug/status. **404** – App not found.

---

### 2.6 List apps again

**Request**

```http
GET /tenant/apps
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – `apps` array includes all apps for the tenant (e.g. 2 apps).

---

## Phase 3: Purposes (tenant-level, shared by apps)

### 3.1 Create purpose

**Request**

```http
POST /purposes
Authorization: Bearer <full_jwt>
Content-Type: application/json

{
  "name": "Analytics",
  "description": "Usage analytics and product improvement",
  "required": false
}
```

**Expected**

- **201** – Body: `purpose` (id, tenant_id, name, description, required, active, created_at, etc.).
- **400** – Validation. **403** – Not owner/admin. **409** – Purpose name already exists.

**Check:** Save **purpose.id** (`purposeId`) for consent and public API.

---

### 3.2 Create another purpose

e.g. `"Marketing"`, `"Strictly Necessary"`. Save IDs.

---

### 3.3 List purposes

**Request**

```http
GET /purposes
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – `purposes` array (active only).

---

### 3.4 Update purpose

**Request**

```http
PUT /purposes/:id
Authorization: Bearer <full_jwt>
Content-Type: application/json

{ "description": "Updated description", "active": true }
```

**Expected**

- **200** – `purpose` with updated fields. **404** – Purpose not found.

---

### 3.5 Delete purpose (soft)

**Request**

```http
DELETE /purposes/:id
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – Message like "Purpose deactivated (soft delete)". **404** – Purpose not found.

**Check:** List purposes again; deactivated purpose should not appear (list returns only active).

---

## Phase 4: Policy versions (per app)

Use the **appId** from Phase 2.

### 4.1 Create policy version

**Request**

```http
POST /tenant/apps/:appId/policy-versions
Authorization: Bearer <full_jwt>
Content-Type: application/json

{
  "version": "v1.0",
  "policy_text": "This is our privacy policy. We collect data for stated purposes only.",
  "effective_from": "2025-01-01T00:00:00.000Z"
}
```

**Expected**

- **201** – Body: `policyVersion` (id, tenant_id, app_id, version_label, policy_text, document_hash, effective_from, is_active: true, created_at).
- **400** – Validation. **403** – Not owner/admin. **409** – Version label already exists for this app.

**Check:** Save **policyVersion.id** (`policyVersionId`) for consent.

---

### 4.2 Get active policy version

**Request**

```http
GET /tenant/apps/:appId/policy-versions/active
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – `policyVersion` object (same as created) or `null` if none active.

---

### 4.3 List policy versions

**Request**

```http
GET /tenant/apps/:appId/policy-versions
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – `policyVersions` array, ordered by created_at desc.

---

### 4.4 Create second policy version (same app)

Create another version (e.g. `"v1.1"`). **Expected:** **201**. Then get active again; active should now be v1.1 (previous is deactivated).

---

## Phase 5: Consent (JWT, per app)

Use **appId**, **purposeId**, **policyVersionId** from previous phases. Use a pseudonymous **userId** (e.g. `"user-abc-123"`).

### 5.1 Grant consent

**Request**

```http
POST /apps/:appId/consent
Authorization: Bearer <full_jwt>
Content-Type: application/json

{
  "userId": "user-abc-123",
  "purposeId": "<purpose_id_uuid>",
  "policyVersionId": "<policy_version_id_uuid>"
}
```

**Expected**

- **200** – Body: `message: "Consent recorded"`, `consentId` (UUID).
- **400** – Validation. **403** – No consent:write or tenant required. **404** – Purpose or policy version not found.

---

### 5.2 Get consent state (derived)

**Request**

```http
GET /apps/:appId/consent/:userId
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – Body: `consents` array. Each item: `purposeId`, `status` ("granted" | "withdrawn"), `policyVersionId`, `timestamp`. Should include the purpose you granted.

---

### 5.3 Withdraw consent

**Request**

```http
DELETE /apps/:appId/consent/:userId/:purposeId
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – Body: `message: "Consent withdrawn"`, `consentId`. **404** – No consent for this user and purpose.

---

### 5.4 Get consent state again

**Request**

```http
GET /apps/:appId/consent/:userId
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – For that purpose, `status` should be `"withdrawn"`.

---

### 5.5 Idempotent withdraw

Call the same DELETE again. **Expected:** **200** (e.g. "Consent already withdrawn").

---

### 5.6 Grant again (for later public/DSR tests)

Grant consent again for the same user and purpose so the user has at least one granted consent for export/DSR tests.

---

## Phase 6: API keys and public API

### 6.1 Create API key

**Request**

```http
POST /tenant/api-keys
Authorization: Bearer <full_jwt>
Content-Type: application/json

{ "name": "Public CMS Key" }
```

**Expected**

- **201** – Body: `id`, `name`, **`key`** (plain secret – shown only once), `active`, `created_at`.
- **403** – Not owner/admin.

**Check:** Save the **key** value; you will use it as `x-api-key` for public and DSR submit.

---

### 6.2 List API keys

**Request**

```http
GET /tenant/api-keys
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – `api_keys` array; each has `key_masked` (e.g. `"...1a2b"`), not the full key.

---

### 6.3 Public: list purposes

**Request**

```http
GET /public/purposes
x-api-key: <api_key_value>
```

**Expected**

- **200** – `purposes` array (id, name, description, required). Same tenant-level purposes as Phase 3.
- **401** – Invalid or missing API key.

---

### 6.4 Public: get active policy (per app)

**Request**

```http
GET /public/apps/:appId/policy
x-api-key: <api_key_value>
```

**Expected**

- **200** – `policyVersion`: `id`, `version`, `policy_text`, `effective_from` (date string). Or `null` if no active policy.
- **401** – Invalid API key. **404** – App not found or not in this tenant.

---

### 6.5 Public: grant consent

**Request**

```http
POST /public/apps/:appId/consent
x-api-key: <api_key_value>
Content-Type: application/json

{
  "user_id": "public-user-456",
  "purpose_id": "<purpose_id_uuid>",
  "policy_version_id": "<policy_version_id_uuid>"
}
```

**Expected**

- **201** – Body: `success: true`. **404** – Purpose or policy version not found.

---

### 6.6 Public: withdraw consent

**Request**

```http
DELETE /public/apps/:appId/consent
x-api-key: <api_key_value>
Content-Type: application/json

{
  "user_id": "public-user-456",
  "purpose_id": "<purpose_id_uuid>"
}
```

**Expected**

- **200** – Body: `success: true`. **404** – Consent not found.

---

## Phase 7: DSR (Data Subject Requests)

### 7.1 Public: submit DSR request (access)

**Request**

```http
POST /dsr/request
x-api-key: <api_key_value>
Content-Type: application/json

{
  "app_id": "<app_id_uuid>",
  "user_id": "user-abc-123",
  "type": "access"
}
```

**Expected**

- **201** – Body: `id`, `user_id`, `request_type: "access"`, `status: "pending"`, `created_at`.
- **400** – Missing app_id, user_id, or type/request_type. **401** – Invalid API key.

**Check:** Save DSR **id** for admin steps.

---

### 7.2 Public: submit DSR (erasure)

Submit another with `"type": "erasure"` for the same or different user. **Expected:** **201**. Save this **id** for status update and (optional) erasure execution.

---

### 7.3 Admin: list DSR requests (per app)

**Request**

```http
GET /tenant/apps/:appId/dsr?page=1&limit=20
Authorization: Bearer <full_jwt>
```

**Optional query:** `status=pending`, `request_type=access`.

**Expected**

- **200** – Body: `requests` array, `pagination` (page, limit, total, total_pages). Should include the requests created above.
- **403** – No dsr:submit scope or tenant required. **404** – App not found.

---

### 7.4 Admin: update DSR status

**Request**

```http
PATCH /tenant/apps/:appId/dsr/:dsrId
Authorization: Bearer <full_jwt>
Content-Type: application/json

{
  "status": "processing",
  "metadata": { "notes": "Started export" }
}
```

**Expected**

- **200** – Body: DSR item with updated `status`. **400** – Invalid status. **404** – DSR or app not found.

---

### 7.5 Admin: export data (access request only)

**Request**

```http
GET /tenant/apps/:appId/dsr/:dsrId/export
Authorization: Bearer <full_jwt>
```

Use the **access** DSR id. **Expected**

- **200** – Body: `user_id`, `exported_at`, `consents`, `events`, `policy_versions`, `audit_logs` (or similar structure). **400** – Export only for access requests. **404** – DSR not found.

---

### 7.6 Admin: complete erasure DSR

**Request**

```http
PATCH /tenant/apps/:appId/dsr/:erasureDsrId
Authorization: Bearer <full_jwt>
Content-Type: application/json

{ "status": "completed" }
```

**Expected**

- **200** – Status updated. Backend should run erasure (delete consent/events/cache for that user in this app) and may trigger `dsr.completed` webhook.

---

## Phase 8: Clients (tenant-level)

### 8.1 Invite client

**Request**

```http
POST /clients/invite
Authorization: Bearer <full_jwt>
Content-Type: application/json

{
  "email": "colleague@example.com",
  "role": "viewer"
}
```

**Expected**

- **201** – Body: client object (id, tenant_id, email, role, status: "inactive", provider: "google", etc.).
- **400** – Validation. **403** – Not owner/admin. **409** – Email already exists in tenant.

---

### 8.2 List clients

**Request**

```http
GET /clients
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – `clients` array (all roles; includes invited and self).

---

## Phase 9: Webhooks

### 9.1 Create webhook

**Request**

```http
POST /webhooks
Authorization: Bearer <full_jwt>
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["consent.granted", "consent.withdrawn", "dsr.completed"]
}
```

**Expected**

- **201** – Body: `id`, `url`, `events`, `active`, `created_at`, **`secret`** (only on create). **400** – Validation. **403** – Not owner/admin.

---

### 9.2 List webhooks

**Request**

```http
GET /webhooks
Authorization: Bearer <full_jwt>
```

**Expected**

- **200** – `webhooks` array (no secret).

---

### 9.3 Delete webhook

**Request**

```http
DELETE /webhooks/:id
Authorization: Bearer <full_jwt>
```

**Expected**

- **204** – No content. **404** – Webhook not found.

---

## Phase 10: Audit logs

### 10.1 List audit logs

**Request**

```http
GET /audit-logs?page=1&limit=20
Authorization: Bearer <full_jwt>
```

**Optional:** `action=CONSENT_GRANTED`, `from_date=2025-01-01`, `to_date=2025-12-31`.

**Expected**

- **200** – Body: `logs` array (id, tenant_id, actor_client_id, action, resource_type, resource_id, metadata, ip_address, created_at), `pagination`.
- **403** – Not owner/admin.

**Check:** Actions should reflect onboarding, app create, purpose create, consent grant/withdraw, DSR, etc.

---

## Phase 11: Error and edge cases

### 11.1 Auth

- **POST /auth/google-login** without body or with empty `googleToken` → **400**.
- **GET /auth/me** without `Authorization` → **401**.
- **GET /auth/me** with expired or invalid JWT → **401**.
- **GET /tenant/me** with onboarding JWT → **403** (tenant onboarding required).

### 11.2 Apps

- **GET /tenant/apps/:appId** with another tenant’s appId (if you had a second tenant) → **404**.
- **POST /tenant/apps** with duplicate slug → **409**.
- **POST /tenant/apps** with invalid slug (e.g. spaces, uppercase) → **400**.

### 11.3 Consent

- **POST /apps/:appId/consent** with non-existent purposeId → **404**.
- **POST /apps/:appId/consent** with policyVersionId from another app → **404**.
- **DELETE /apps/:appId/consent/:userId/:purposeId** for user with no consent → **404**.

### 11.4 Public API

- **GET /public/purposes** without `x-api-key` → **401**.
- **GET /public/apps/:appId/policy** with wrong appId (or other tenant’s app) → **404**.

### 11.5 DSR

- **POST /dsr/request** without `app_id` → **400**.
- **GET /tenant/apps/:appId/dsr/:id/export** for an erasure (not access) request → **400**.
- **PATCH /tenant/apps/:appId/dsr/:id** with invalid status → **400**.

### 11.6 Rate limits

- Send many requests to **POST /auth/google-login** (e.g. >10 in 15 min) → **429**.
- Public endpoints have stricter limits; exceed → **429**.

---

## Phase 12: Isolation checks (multi-tenant / multi-app)

If you have two tenants (two Google users onboarded) or two apps:

1. **Apps** – List apps with tenant A’s JWT; only tenant A’s apps. Create app with tenant B; list with A → B’s app not visible.
2. **Purposes** – Tenant-level; same purposes for all apps of that tenant. Different tenants have different purposes.
3. **Consent** – Grant consent in app1 for user-X; get state in app2 for user-X → app2 state is independent (no consent in app2 unless granted there).
4. **DSR** – List DSR for app1; DSR for app2 should not appear. Submit DSR for app1 with app_id=app1; list under app1 only.
5. **Policy** – Active policy for app1 is independent of app2; creating a version in app1 does not change app2.

---

## Quick reference: main IDs to keep

| Symbol | From |
|--------|------|
| `full_jwt` | POST /auth/google-login (existing user) or POST /tenant/onboard response |
| `tenant_id` | GET /auth/me or GET /tenant/me |
| `appId` | POST /tenant/apps response |
| `purposeId` | POST /purposes response |
| `policyVersionId` | POST /tenant/apps/:appId/policy-versions response |
| `api_key` | POST /tenant/api-keys response (key field, only once) |
| `dsrId` | POST /dsr/request response (for list/patch/export) |

---

## Optional: automated test outline

For automated E2E tests (e.g. Jest + supertest):

1. **Setup:** Start server, ensure DB synced; optionally truncate and re-sync.
2. **Auth:** Mock or stub Google token; test login (onboarding + full), /auth/me, /tenant/me.
3. **Apps:** Create app, list, get, update; use appId in all app-scoped calls.
4. **Purposes:** Create 1–2 purposes; list, update, soft-delete.
5. **Policy:** Create policy version per app; get active, list.
6. **Consent:** Grant, get state, withdraw; verify idempotent withdraw and state derivation.
7. **API key:** Create key; call public purposes, public app policy, public consent grant/withdraw.
8. **DSR:** Submit access + erasure (public); list (admin), update status, export (access), complete (erasure).
9. **Clients:** Invite, list.
10. **Webhooks:** Create, list, delete.
11. **Audit:** List logs; assert expected actions present.
12. **Errors:** Assert 400/401/403/404/409/429 where applicable.

Use a fixed test tenant/app/purpose/policy (or create once in beforeAll) so tests are deterministic and can run in parallel if needed (with separate tenants/apps per worker).
