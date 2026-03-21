/**
 * OpenAPI 3.0 spec for SecureDApp CMS API.
 * Served at /api-docs
 */
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'SecureDApp CMS API',
    description: `Multi-tenant consent management system (DPDP compliance).

## Entire working flow

1. **Auth** – \`POST /auth/google-login\` with Google ID token → receive JWT (onboarding or full).
2. **Onboard** (if \`onboarding: true\`) – \`POST /tenant/onboard\` with organization_name, country → tenant + owner client + full JWT.
3. **Tenant** – \`GET /tenant/me\`, \`GET /auth/me\` for current tenant/user. Create API keys: \`POST /tenant/api-keys\`, \`GET /tenant/api-keys\`, \`DELETE /tenant/api-keys/:id\`.
4. **Apps** – \`GET /tenant/apps\`, \`POST /tenant/apps\` (name, slug), \`GET/PUT/DELETE /tenant/apps/:appId\`. Policy and DSR admin are per app.
5. **Purposes** – \`POST /purposes\`, \`GET /purposes\`, \`PUT /purposes/:id\`, \`DELETE /purposes/:id\` (tenant-level, shared by apps).
6. **Data catalog** – \`GET /data-catalog\`, \`GET /data-catalog/:dataId\` (platform-wide, read-only).
7. **Policy versions (per app)** – \`POST /tenant/apps/:appId/policy-versions\`, \`GET /tenant/apps/:appId/policy-versions/active\`, \`GET /tenant/apps/:appId/policy-versions\`.
8. **Consent (per app)** – Grant: \`POST /apps/:appId/consent\` (body: **email**, **phone_number** or **phoneNumber**, purposeId, policyVersionId — server derives \`user_id\`, \`email_hash\`, \`phone_hash\`; never send \`user_id\` from client). Withdraw: \`DELETE /apps/:appId/consent\` (same identity fields + purpose). Read: \`GET /apps/:appId/consent/:userId\` (path \`userId\` = derived principal hash), \`/artifact\`, \`/export\` (legacy).
9. **Public API** – \`GET /public/purposes\`; \`GET /public/apps/:appId/policy\`, \`POST /public/apps/:appId/consent\`, \`DELETE /public/apps/:appId/consent\` (same email+phone identity model; API key auth).
10. **DSR** – Public: \`POST /dsr/request\` (body: **app_id**, user_id, type/request_type). Admin: \`GET /tenant/apps/:appId/dsr\`, \`PATCH /tenant/apps/:appId/dsr/:id\`, \`GET /tenant/apps/:appId/dsr/:id/export\`.
11. **Clients** – \`POST /clients/invite\`, \`GET /clients\`. **Webhooks** – \`POST /webhooks\`, \`GET /webhooks\`, \`DELETE /webhooks/:id\` (consent events include derived \`user_id\` in payload \`data\`). **Audit** – \`GET /audit-logs\` (owner/admin); use \`?email=\` to filter consent grant/withdraw logs by plaintext email (matched via \`metadata.email_hash\`).`,
    version: '1.0.0',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and current user' },
    { name: 'Tenant', description: 'Organization / tenant and apps' },
    { name: 'Apps', description: 'Per-app operations (JWT): consent grant/withdraw/read under /apps/:appId/consent; policy and DSR admin under /tenant/apps/:appId' },
    { name: 'Clients', description: 'Tenant users (invite, list)' },
    { name: 'Audit', description: 'Audit logs (owner/admin). Consent-related actions store metadata.email_hash (no plaintext email). Filter those rows with query param email= (server hashes and matches).' },
    { name: 'Consent', description: 'JWT consent APIs under /apps/:appId. Write: POST/DELETE /consent with email + phone (server derives user_id, email_hash, phone_hash). Read: GET /consent/:userId where userId is the derived principal id (HMAC hex), same as consents.user_id and webhook payload data.user_id. State is event-sourced (GET state uses latest consent_events per purpose).' },
    { name: 'Purposes', description: 'Consent purposes (tenant-scoped)' },
    { name: 'Data Catalog', description: 'Platform-wide data catalog (data_id reference for purposes)' },
    { name: 'Policy Versions', description: 'Policy versions (tenant-scoped)' },
    { name: 'Webhooks', description: 'Webhook endpoints (notify external systems). consent.granted / consent.withdrawn bodies: { event, timestamp, data: { tenant_id, user_id (derived hash), purpose_id, policy_version_id } }. Signed with HMAC (see POST /webhooks).' },
    { name: 'DSR', description: 'Data Subject Requests (access, erasure, rectification)' },
    { name: 'Public API', description: 'External integration (x-api-key, no JWT). Consent: email+phone aliases; server derives user_id and stores email_hash/phone_hash only in DB; audit uses email_hash.' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from Google login or after onboarding',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key issued to tenant for public/CMS integration',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Error message' },
        },
      },
      GoogleLoginRequest: {
        type: 'object',
        required: ['googleToken'],
        properties: {
          googleToken: { type: 'string', description: 'Google ID token from client' },
        },
      },
      GoogleLoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT' },
          tenant_id: { type: 'string', format: 'uuid', nullable: true },
          client_id: { type: 'string', format: 'uuid', nullable: true },
          onboarding: { type: 'boolean', description: 'True if user must call POST /tenant/onboard' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', nullable: true },
        },
      },
      MeResponse: {
        type: 'object',
        properties: {
          client: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string' },
              name: { type: 'string', nullable: true },
              role: { type: 'string', enum: ['owner', 'admin', 'compliance_manager', 'auditor', 'viewer'] },
              status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          tenant: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              domain: { type: 'string', nullable: true },
              industry: { type: 'string', nullable: true },
              country: { type: 'string' },
              dpdp_applicable: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            example: ['consent:write', 'dsr:submit', 'audit:read'],
          },
        },
      },
      OnboardRequest: {
        type: 'object',
        required: ['organization_name', 'country'],
        properties: {
          organization_name: { type: 'string', example: 'Acme Pvt Ltd' },
          industry: { type: 'string', example: 'Fintech', nullable: true },
          country: { type: 'string', example: 'India' },
        },
      },
      OnboardResponse: {
        type: 'object',
        properties: {
          tenant: { $ref: '#/components/schemas/Tenant' },
          client: { $ref: '#/components/schemas/Client' },
          token: { type: 'string', description: 'Full JWT after onboarding' },
        },
      },
      App: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tenant_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      AppCreateRequest: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string', example: 'My Web App' },
          slug: { type: 'string', example: 'my-web-app', description: 'URL-friendly, unique per tenant' },
        },
      },
      AppListResponse: {
        type: 'object',
        properties: {
          apps: { type: 'array', items: { $ref: '#/components/schemas/App' } },
        },
      },
      Tenant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          domain: { type: 'string', nullable: true },
          industry: { type: 'string', nullable: true },
          country: { type: 'string' },
          dpdp_applicable: { type: 'boolean' },
          created_by: { type: 'string', format: 'uuid', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tenant_id: { type: 'string', format: 'uuid' },
          email: { type: 'string' },
          name: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['owner', 'admin', 'compliance_manager', 'auditor', 'viewer'] },
          status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
          provider: { type: 'string', enum: ['google', 'email'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      InviteRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@company.com' },
          role: {
            type: 'string',
            enum: ['owner', 'admin', 'compliance_manager', 'auditor', 'viewer'],
            default: 'viewer',
          },
        },
      },
      ClientsListResponse: {
        type: 'object',
        properties: {
          clients: {
            type: 'array',
            items: { $ref: '#/components/schemas/Client' },
          },
        },
      },
      ApiKeyCreateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 255, nullable: true, description: 'Optional label for the key' },
        },
      },
      ApiKeyCreateResponse: {
        type: 'object',
        description: 'Plain key is returned only once; store it securely.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', nullable: true },
          key: { type: 'string', description: 'Secret key (only in create response)' },
          active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ApiKeyListItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', nullable: true },
          key_masked: { type: 'string', example: '...1a2b', description: 'Last 4 chars only' },
          active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ApiKeysListResponse: {
        type: 'object',
        properties: {
          api_keys: {
            type: 'array',
            items: { $ref: '#/components/schemas/ApiKeyListItem' },
          },
        },
      },
      WebhookCreateRequest: {
        type: 'object',
        required: ['url', 'events'],
        properties: {
          url: { type: 'string', format: 'uri', example: 'https://client.com/webhook' },
          events: {
            type: 'array',
            description:
              'Subscribe to event names. For consent.granted / consent.withdrawn, delivered JSON is { event, timestamp, data } where data includes tenant_id, user_id (derived consent principal HMAC hex), purpose_id, policy_version_id (see ConsentWebhookConsentBody).',
            items: { type: 'string', enum: ['consent.granted', 'consent.withdrawn', 'policy.updated', 'purpose.created', 'dsr.completed'] },
            example: ['consent.granted', 'consent.withdrawn'],
          },
          secret: { type: 'string', nullable: true, description: 'Optional; generated if omitted' },
        },
      },
      ConsentWebhookConsentBody: {
        type: 'object',
        description: 'Nested under signed webhook JSON root as `data` for consent.granted and consent.withdrawn.',
        properties: {
          tenant_id: { type: 'string', format: 'uuid' },
          user_id: {
            type: 'string',
            description: 'Derived consent principal id (tenant-keyed HMAC hex); same as path /apps/:appId/consent/:userId and consents.user_id. Raw email/phone are never included.',
          },
          purpose_id: { type: 'string', format: 'uuid' },
          policy_version_id: { type: 'string', format: 'uuid', nullable: true, description: 'Present on grant; on withdraw, last granted policy version if any' },
          occurred_at: {
            type: 'string',
            format: 'date-time',
            description: 'ISO-8601 UTC (ms) — same instant as consent_events.created_at for this event',
          },
        },
      },
      ConsentWebhookEnvelope: {
        type: 'object',
        description:
          'Example signed webhook POST body (verify HMAC over `${x-webhook-timestamp}.${rawBody}`). For consent.* events, root `timestamp` equals consent_events.created_at (same as data.occurred_at).',
        properties: {
          event: { type: 'string', enum: ['consent.granted', 'consent.withdrawn'] },
          timestamp: { type: 'string', format: 'date-time' },
          data: { $ref: '#/components/schemas/ConsentWebhookConsentBody' },
        },
      },
      WebhookCreateResponse: {
        type: 'object',
        description: 'Secret returned only on create; use for HMAC verification.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          url: { type: 'string' },
          events: { type: 'array', items: { type: 'string' } },
          active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          secret: { type: 'string', description: 'Only in create response' },
        },
      },
      WebhookListItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          url: { type: 'string' },
          events: { type: 'array', items: { type: 'string' } },
          active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      WebhooksListResponse: {
        type: 'object',
        properties: {
          webhooks: {
            type: 'array',
            items: { $ref: '#/components/schemas/WebhookListItem' },
          },
        },
      },
      AuditLogEntry: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tenant_id: { type: 'string', format: 'uuid' },
          actor_client_id: { type: 'string', format: 'uuid', nullable: true },
          action: { type: 'string' },
          resource_type: { type: 'string', nullable: true },
          resource_id: { type: 'string', format: 'uuid', nullable: true },
          metadata: {
            type: 'object',
            nullable: true,
            description:
              'Every row includes **logged_at** (ISO, when the audit record was written). Consent grant/withdraw also include **event_recorded_at** and grant includes **consent_granted_at** (domain times). CONSENT_*: email_hash, purpose_id, etc. Plaintext email is never stored. CONSENT_READ: user_id (hash), export/artifact flags.',
          },
          ip_address: { type: 'string', nullable: true },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'ISO-8601 UTC with milliseconds — row insert time (audit trail clock)',
          },
        },
      },
      AuditLogsResponse: {
        type: 'object',
        properties: {
          logs: { type: 'array', items: { $ref: '#/components/schemas/AuditLogEntry' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              total_pages: { type: 'integer' },
            },
          },
        },
      },
      DsrSubmitRequest: {
        type: 'object',
        required: ['app_id', 'user_id'],
        properties: {
          app_id: { type: 'string', format: 'uuid', description: 'App UUID (DSR is per app)' },
          user_id: { type: 'string', description: 'Pseudonymous user identifier' },
          type: { type: 'string', enum: ['access', 'erasure', 'rectification'], description: 'Request type (use type or request_type)' },
          request_type: { type: 'string', enum: ['access', 'erasure', 'rectification'], description: 'Request type (use type or request_type)' },
        },
        description: 'app_id and user_id required; exactly one of type or request_type required.',
      },
      DsrRequestItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string' },
          request_type: { type: 'string', enum: ['access', 'erasure', 'rectification'] },
          status: { type: 'string', enum: ['pending', 'processing', 'completed', 'rejected'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      DsrListResponse: {
        type: 'object',
        properties: {
          requests: { type: 'array', items: { $ref: '#/components/schemas/DsrRequestItem' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              total_pages: { type: 'integer' },
            },
          },
        },
      },
      DsrUpdateRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['pending', 'processing', 'completed', 'rejected'] },
          metadata: { type: 'object', nullable: true, example: { processed_by: 'admin_id', notes: 'data exported' } },
        },
      },
      Purpose: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tenant_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          required: { type: 'boolean' },
          required_data: { type: 'array', items: { type: 'string' }, nullable: true, description: 'Data catalog data_id list' },
          permissions: { type: 'object', nullable: true },
          validity_days: { type: 'integer', nullable: true, description: 'Must be <= min of data_catalog.max_validity_days for required_data' },
          retention_days: { type: 'integer', nullable: true },
          active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      PurposeCreateRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Analytics' },
          description: { type: 'string', nullable: true },
          required: { type: 'boolean', default: false },
          required_data: { type: 'array', items: { type: 'string' }, nullable: true, example: ['AADHAAR_NUMBER', 'AADHAAR_ADDRESS'] },
          validity_days: { type: 'integer', nullable: true },
          permissions: { type: 'object', nullable: true },
        },
      },
      PurposeUpdateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          required: { type: 'boolean' },
          active: { type: 'boolean' },
          required_data: { type: 'array', items: { type: 'string' }, nullable: true },
          validity_days: { type: 'integer', nullable: true },
          permissions: { type: 'object', nullable: true },
        },
      },
      PurposeListResponse: {
        type: 'object',
        properties: {
          purposes: { type: 'array', items: { $ref: '#/components/schemas/Purpose' } },
        },
      },
      PurposeSingleResponse: {
        type: 'object',
        properties: {
          purpose: { $ref: '#/components/schemas/Purpose' },
        },
      },
      PolicyVersion: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tenant_id: { type: 'string', format: 'uuid' },
          version_label: { type: 'string' },
          policy_text: { type: 'string' },
          document_hash: { type: 'string' },
          effective_from: { type: 'string', format: 'date-time' },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      PolicyVersionCreateRequest: {
        type: 'object',
        required: ['version', 'policy_text'],
        properties: {
          version: { type: 'string', description: 'Version label (e.g. v1.0)' },
          policy_text: { type: 'string', description: 'Full policy document text' },
          effective_from: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      PolicyVersionListResponse: {
        type: 'object',
        properties: {
          policyVersions: { type: 'array', items: { $ref: '#/components/schemas/PolicyVersion' } },
        },
      },
      PolicyVersionActiveResponse: {
        type: 'object',
        properties: {
          policyVersion: { $ref: '#/components/schemas/PolicyVersion', nullable: true },
        },
      },
      ConsentGrantRequest: {
        type: 'object',
        description:
          'Server derives consent principal: stores email_hash, phone_hash, and user_id (combined HMAC). Never send user_id from the client. Phone: send **phone_number** and/or **phoneNumber**; at least one must be non-empty.',
        required: ['email', 'purposeId', 'policyVersionId'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Raw user email' },
          phone_number: { type: 'string', description: 'Raw phone (snake_case); required unless phoneNumber is sent' },
          phoneNumber: { type: 'string', description: 'Raw phone (camelCase); required unless phone_number is sent' },
          purposeId: { type: 'string', format: 'uuid', description: 'Purpose UUID' },
          policyVersionId: { type: 'string', format: 'uuid', description: 'Active policy version UUID for this app' },
        },
      },
      ConsentWithdrawRequest: {
        type: 'object',
        description:
          'Withdraw for (derived identity, purpose). Same email+phone rules as grant. Send **purposeId** and/or **purpose_id** (at least one valid UUID). Never send path userId — identity is always from body.',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Raw user email' },
          phone_number: { type: 'string', description: 'Raw phone (snake_case); required unless phoneNumber is sent' },
          phoneNumber: { type: 'string', description: 'Raw phone (camelCase); required unless phone_number is sent' },
          purposeId: { type: 'string', format: 'uuid', description: 'Purpose UUID (camelCase)' },
          purpose_id: { type: 'string', format: 'uuid', description: 'Purpose UUID (snake_case)' },
        },
      },
      ConsentGrantResponse: {
        type: 'object',
        description: 'Timestamps are ISO-8601 UTC with millisecond precision.',
        properties: {
          message: { type: 'string', example: 'Consent recorded' },
          consentId: { type: 'string', format: 'uuid' },
          consentEventId: { type: 'string', format: 'uuid', description: 'consent_events.id for the GRANTED row' },
          recordedAt: { type: 'string', format: 'date-time', description: 'Exact time of the GRANTED consent_events row (DB)' },
          grantedAt: { type: 'string', format: 'date-time', description: 'consents.granted_at after this operation' },
        },
      },
      ConsentWithdrawResponse: {
        type: 'object',
        description: 'recordedAt is the relevant WITHDRAWN consent_events.created_at (existing row if alreadyWithdrawn).',
        properties: {
          message: { type: 'string', example: 'Consent withdrawn' },
          consentId: { type: 'string', format: 'uuid' },
          consentEventId: { type: 'string', format: 'uuid' },
          recordedAt: { type: 'string', format: 'date-time' },
          alreadyWithdrawn: { type: 'boolean', description: 'True if latest event was already WITHDRAWN' },
          withdrawn: { type: 'integer', enum: [0, 1], description: '1 if a new WITHDRAWN event was appended' },
        },
      },
      ConsentStateItem: {
        type: 'object',
        description: 'Latest consent_events row per (user, purpose), mapped to API shape.',
        properties: {
          purposeId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['granted', 'withdrawn'], description: 'Derived from latest event_type GRANTED vs WITHDRAWN' },
          policyVersionId: { type: 'string', format: 'uuid', nullable: true },
          timestamp: { type: 'string', format: 'date-time', description: 'ISO-8601 of latest event' },
        },
      },
      ConsentStateResponse: {
        type: 'object',
        description: 'Current state per purpose for the path userId (derived principal). Audits CONSENT_READ with metadata.user_id.',
        properties: {
          consents: { type: 'array', items: { $ref: '#/components/schemas/ConsentStateItem' } },
        },
      },
      ConsentExportResponse: {
        type: 'object',
        description: 'Legacy export shape. dataPrincipal.id is the derived consent user_id (HMAC hex), not plaintext PII.',
        properties: {
          dataPrincipal: { type: 'object', properties: { id: { type: 'string', description: 'Derived principal id' } } },
          dataFiduciary: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
          consents: { type: 'array', items: { type: 'object' } },
        },
      },
      ConsentArtifactResponse: {
        type: 'object',
        description:
          'Consent artifact per latest event: consentId, dataPrincipal (id = derived user_id), dataFiduciary (tenantId), purpose, data_ids, audit, signature, status. No plaintext email/phone in response.',
        properties: {
          consentArtifacts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                consentArtifact: {
                  type: 'object',
                  properties: {
                    consentId: { type: 'string', format: 'uuid' },
                    timestamp: { type: 'string', format: 'date-time' },
                    dataPrincipal: { type: 'object', properties: { id: { type: 'string', description: 'Derived consent principal (HMAC hex)' } } },
                    dataFiduciary: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
                    purpose: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, text: { type: 'string', nullable: true } } },
                    policy_version_id: { type: 'string', format: 'uuid', nullable: true },
                    data: { type: 'object', properties: { data_ids: { type: 'array', items: { type: 'string' } } } },
                    audit: { type: 'object', properties: { consentMethod: { type: 'string' }, timestamp: { type: 'string' }, createdBy: { type: 'string' }, ipAddress: { type: 'string', nullable: true } } },
                    signature: { type: 'object', properties: { type: { type: 'string' }, algorithm: { type: 'string' }, value: { type: 'string', nullable: true } } },
                    status: { type: 'string', enum: ['ACTIVE', 'WITHDRAWN'] },
                  },
                },
              },
            },
          },
        },
      },
      PublicPurposeItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          required: { type: 'boolean' },
          required_data: { type: 'array', items: { type: 'string' }, nullable: true },
          validity_days: { type: 'integer', nullable: true },
          permissions: { type: 'object', nullable: true },
        },
      },
      PublicPurposesResponse: {
        type: 'object',
        properties: {
          purposes: { type: 'array', items: { $ref: '#/components/schemas/PublicPurposeItem' } },
        },
      },
      PublicPolicyVersion: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string', format: 'uuid' },
          version: { type: 'string', description: 'From version_label' },
          policy_text: { type: 'string' },
          effective_from: { type: 'string', format: 'date', description: 'YYYY-MM-DD' },
        },
      },
      PublicPolicyResponse: {
        type: 'object',
        properties: {
          policyVersion: { $ref: '#/components/schemas/PublicPolicyVersion' },
        },
      },
      PublicConsentGrantRequest: {
        type: 'object',
        description:
          'Public consent: server stores email_hash, phone_hash, and derived user_id (never returns raw PII). ' +
          'Email: **email**, **userEmail**, or **user_email** (one required). Phone: **phone_number**, **phoneNumber**, or **phone** (one required). ' +
          'Purpose: **purposeId** or **purpose_id**. Policy: **policyVersionId** or **policy_version_id**.',
        required: ['email', 'phone_number', 'purposeId', 'policyVersionId'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Raw user email (or use userEmail / user_email)' },
          userEmail: { type: 'string', format: 'email', description: 'Alias for email' },
          user_email: { type: 'string', format: 'email', description: 'Alias for email' },
          phone_number: { type: 'string', description: 'Raw phone (snake_case)' },
          phoneNumber: { type: 'string', description: 'Raw phone (camelCase)' },
          phone: { type: 'string', description: 'Raw phone (short alias)' },
          purposeId: { type: 'string', format: 'uuid', description: 'Purpose UUID (camelCase)' },
          purpose_id: { type: 'string', format: 'uuid', description: 'Purpose UUID (snake_case)' },
          policyVersionId: { type: 'string', format: 'uuid', description: 'Policy version UUID (camelCase)' },
          policy_version_id: { type: 'string', format: 'uuid', description: 'Policy version UUID (snake_case)' },
        },
      },
      PublicConsentWithdrawRequest: {
        type: 'object',
        description:
          'Withdraw: same identity rules as public grant (email aliases + phone aliases). Purpose: **purposeId** or **purpose_id**.',
        required: ['email', 'phone_number', 'purposeId'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Raw user email (or userEmail / user_email)' },
          userEmail: { type: 'string', format: 'email', description: 'Alias for email' },
          user_email: { type: 'string', format: 'email', description: 'Alias for email' },
          phone_number: { type: 'string', description: 'Raw phone (snake_case)' },
          phoneNumber: { type: 'string', description: 'Raw phone (camelCase)' },
          phone: { type: 'string', description: 'Raw phone (short alias)' },
          purposeId: { type: 'string', format: 'uuid', description: 'Purpose UUID (camelCase)' },
          purpose_id: { type: 'string', format: 'uuid', description: 'Purpose UUID (snake_case)' },
        },
      },
      PublicConsentSuccessResponse: {
        type: 'object',
        description:
          'Public consent grant/withdraw. Same timestamp fields as JWT consent APIs; no plaintext PII or derived user_id in body.',
        properties: {
          success: { type: 'boolean', example: true },
          consentId: { type: 'string', format: 'uuid' },
          consentEventId: { type: 'string', format: 'uuid' },
          recordedAt: { type: 'string', format: 'date-time', description: 'consent_events.created_at for this grant/withdraw' },
          grantedAt: { type: 'string', format: 'date-time', description: 'Grant only: consents.granted_at' },
          alreadyWithdrawn: { type: 'boolean', description: 'Withdraw only' },
          withdrawn: { type: 'integer', enum: [0, 1], description: 'Withdraw only' },
        },
      },
      DsrExportResponse: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
          exported_at: { type: 'string', format: 'date-time' },
          consents: { type: 'array' },
          events: { type: 'array' },
          policy_versions: { type: 'array' },
          audit_logs: { type: 'array' },
        },
      },
      PurposeDeactivateResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Purpose deactivated (soft delete)' },
        },
      },
      DataCatalogEntry: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          data_id: { type: 'string', example: 'AADHAAR_NUMBER' },
          category: { type: 'string', example: 'identity' },
          description: { type: 'string', nullable: true },
          sensitivity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          max_validity_days: { type: 'integer', nullable: true, description: 'Max consent validity days for this data type' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      DataCatalogListResponse: {
        type: 'object',
        properties: {
          data_catalog: { type: 'array', items: { $ref: '#/components/schemas/DataCatalogEntry' } },
        },
      },
    },
  },
  paths: {
    '/auth/google-login': {
      post: {
        tags: ['Auth'],
        summary: 'Google login',
        description: 'Exchange Google ID token for JWT. If user has no tenant, returns onboarding token; otherwise full JWT. Blocked if status is suspended/inactive.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GoogleLoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GoogleLoginResponse' },
              },
            },
          },
          400: { description: 'Bad request (e.g. missing googleToken)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid or expired Google token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Account disabled (suspended/inactive)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: { description: 'Too many login attempts (rate limit)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user (client + tenant + permissions)',
        description: 'Returns logged-in user\'s client, tenant, and permissions. Requires full JWT (after onboarding).',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MeResponse' },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Tenant onboarding required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/tenant/onboard': {
      post: {
        tags: ['Tenant'],
        summary: 'Create organization (first-time onboarding)',
        description: 'Creates tenant and owner client. Use with onboarding JWT (from Google login when no client exists). If user already has a tenant, returns 400.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OnboardRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Tenant and client created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OnboardResponse' },
              },
            },
          },
          400: { description: 'User already onboarded or validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Organization name or domain already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/tenant/apps': {
      get: {
        tags: ['Tenant'],
        summary: 'List apps',
        description: 'List all apps for the current tenant.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppListResponse' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Tenant onboarding required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Tenant', 'Apps'],
        summary: 'Create app',
        description: 'Create an app under the tenant. Owner/admin only. Policy, consent, and DSR are then scoped to this app.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AppCreateRequest' } } },
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { app: { $ref: '#/components/schemas/App' } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Slug already exists for tenant', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/tenant/apps/{appId}': {
      get: {
        tags: ['Tenant', 'Apps'],
        summary: 'Get app',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/App' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Tenant onboarding required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Tenant', 'Apps'],
        summary: 'Update app',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, slug: { type: 'string' }, status: { type: 'string', enum: ['active', 'inactive'] } } } } } },
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { type: 'object', properties: { app: { $ref: '#/components/schemas/App' } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Tenant', 'Apps'],
        summary: 'Delete app',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          204: { description: 'Deleted' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/tenant/me': {
      get: {
        tags: ['Tenant'],
        summary: 'Get current tenant',
        description: 'Returns the logged-in user\'s organization (tenant).',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Tenant' },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Tenant onboarding required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Tenant not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/tenant/api-keys': {
      post: {
        tags: ['Tenant'],
        summary: 'Create API key',
        description: 'Creates an API key for the tenant (public/CMS integration). The plain key is returned only in this response; store it securely. Only owner or admin.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiKeyCreateRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'API key created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiKeyCreateResponse' },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden (tenant onboarding required or not owner/admin)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Tenant'],
        summary: 'List API keys',
        description: 'Returns API keys for the tenant (key value masked). Only owner or admin.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiKeysListResponse' },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/tenant/api-keys/{id}': {
      delete: {
        tags: ['Tenant'],
        summary: 'Revoke API key',
        description: 'Deactivates an API key. Only owner or admin.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'API key UUID' },
        ],
        responses: {
          204: { description: 'API key revoked' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'API key not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/webhooks': {
      post: {
        tags: ['Webhooks'],
        summary: 'Create webhook',
        description:
          'Register a webhook endpoint. Payloads are signed with HMAC SHA256. ' +
          'Headers: x-webhook-timestamp (unix seconds), x-webhook-event, x-webhook-signature (t=<ts>,v1=<hex>). ' +
          'HMAC input: `${t}.${rawBody}`. JSON body: { event, timestamp, data }. For consent.granted / consent.withdrawn, data includes tenant_id, user_id (derived HMAC principal), purpose_id, policy_version_id — see components ConsentWebhookEnvelope. Secret is returned only on create. Only owner or admin.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WebhookCreateRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Webhook created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WebhookCreateResponse' },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Webhooks'],
        summary: 'List webhooks',
        description: 'Returns webhook endpoints for the tenant (no secret). Only owner or admin.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WebhooksListResponse' },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/webhooks/{id}': {
      delete: {
        tags: ['Webhooks'],
        summary: 'Delete webhook',
        description: 'Removes a webhook endpoint. Only owner or admin.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Webhook UUID' },
        ],
        responses: {
          204: { description: 'Webhook deleted' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Webhook not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/dsr/request': {
      post: {
        tags: ['DSR'],
        summary: 'Submit DSR request (public)',
        description: 'Data subject submits access, erasure, or rectification request. Uses API key (x-api-key). Creates request with status pending.',
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DsrSubmitRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'DSR request created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DsrRequestItem' },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/dsr': {
      get: {
        tags: ['DSR'],
        summary: 'List DSR requests',
        description: 'Returns all DSR requests for the tenant. Requires dsr:submit scope.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'processing', 'completed', 'rejected'] } },
          { name: 'request_type', in: 'query', schema: { type: 'string', enum: ['access', 'erasure', 'rectification'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DsrListResponse' },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/dsr/{id}': {
      patch: {
        tags: ['DSR'],
        summary: 'Update DSR status',
        description: 'Update request status (pending, processing, completed, rejected). Appends lifecycle event. For completed erasure, executes erasure and emits dsr.completed webhook.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'DSR request UUID' },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DsrUpdateRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Status updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DsrRequestItem' },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'DSR request not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/dsr/{id}/export': {
      get: {
        tags: ['DSR'],
        summary: 'Export data (access request)',
        description: 'Compiles user data: consents, consent events, purposes, policy versions, audit logs. Only for access requests.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'DSR request UUID' },
        ],
        responses: {
          200: {
            description: 'Export JSON',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DsrExportResponse' } } },
          },
          400: { description: 'Export only for access requests', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'DSR request not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/clients/invite': {
      post: {
        tags: ['Clients'],
        summary: 'Invite client to organization',
        description: 'Creates a new client (inactive until they sign in with Google). Only owner or admin.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InviteRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Client invited',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Client' },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden (not owner/admin)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Client with this email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/apps/{appId}/consent': {
      post: {
        tags: ['Consent', 'Apps'],
        summary: 'Grant consent',
        description:
          'Record consent for a user and purpose (per app). Identity is derived server-side from email + (phone_number or phoneNumber); persists email_hash, phone_hash, user_id. Audit stores email_hash only in metadata. Webhook consent.granted fires. Requires consent:write.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'App UUID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ConsentGrantRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Consent recorded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsentGrantResponse' } } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found, or purpose or policy version not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Consent', 'Apps'],
        summary: 'Withdraw consent (per purpose)',
        description:
          'Append WITHDRAWN event for (derived identity, purpose) in this app. Body: email + (phone_number or phoneNumber) + (purposeId or purpose_id). Idempotent. Triggers consent.withdrawn webhook. Audit metadata includes email_hash. Requires consent:write.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'App UUID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ConsentWithdrawRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Consent withdrawn (or already withdrawn)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsentWithdrawResponse' } } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found, or consent not found for this identity and purpose', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/apps/{appId}/consent/{userId}': {
      get: {
        tags: ['Consent', 'Apps'],
        summary: 'Get consent state (derived from events)',
        description:
          'Derives current consent state per purpose from latest consent_events (not cache). Response: { consents: [{ purposeId, status, policyVersionId, timestamp }] }. Audits CONSENT_READ with metadata.user_id (derived hash).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'App UUID' },
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description:
              'Derived consent principal id (tenant-keyed HMAC hex from email+phone). Same as consents.user_id and webhook payload data.user_id. Not raw email. Filter audit by plaintext email: GET /audit-logs?email=.',
          },
        ],
        responses: {
          200: {
            description: 'Consent state derived from events',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsentStateResponse' } } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/apps/{appId}/consent/{userId}/artifact': {
      get: {
        tags: ['Consent', 'Apps'],
        summary: 'Get consent artifact',
        description:
          'DPDP-style artifact per consent: consentId, dataPrincipal.id (derived user_id), dataFiduciary (tenant), purpose, data_ids, audit, signature, status ACTIVE|WITHDRAWN. Audits CONSENT_READ (metadata.artifact). No plaintext PII.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'App UUID' },
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description:
              'Derived consent principal id (HMAC hex). Same as POST/DELETE body-derived user_id for that email+phone pair.',
          },
        ],
        responses: {
          200: {
            description: 'Consent artifacts',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsentArtifactResponse' } } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/apps/{appId}/consent/{userId}/export': {
      get: {
        tags: ['Consent', 'Apps'],
        summary: 'Get consent export (legacy)',
        description: 'Legacy export shape; dataPrincipal.id is derived user_id. Prefer GET /apps/{appId}/consent/{userId}/artifact. Audits CONSENT_READ (metadata.export).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'App UUID' },
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Derived consent principal id (HMAC hex), same as other consent read routes.',
          },
        ],
        responses: {
          200: {
            description: 'Consent export',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsentExportResponse' } } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/clients': {
      get: {
        tags: ['Clients'],
        summary: 'List clients',
        description: 'Returns all clients for the current tenant.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClientsListResponse' },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Tenant onboarding required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'List audit logs',
        description:
          'Returns paginated audit logs for the current tenant. Only owner or admin. Consent grant/withdraw/public consent rows use metadata.email_hash (no plaintext email stored). Use **email** query to find them: server hashes the query with tenant secret and matches metadata.email_hash.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'action', in: 'query', schema: { type: 'string' }, description: 'Filter by action (e.g. CONSENT_GRANTED, CONSENT_WITHDRAWN, PUBLIC_CONSENT_GRANTED, TENANT_CREATED)' },
          { name: 'email', in: 'query', schema: { type: 'string', format: 'email' }, description: 'Plaintext email; hashed server-side and matched to metadata.email_hash on consent-related audit entries' },
          { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'From date (inclusive)' },
          { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'To date (inclusive)' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuditLogsResponse' },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden (not owner/admin)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/data-catalog': {
      get: {
        tags: ['Data Catalog'],
        summary: 'List data catalog',
        description: 'Platform-wide data catalog (active entries only). JWT required. Used to reference data_id in purposes.required_data.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DataCatalogListResponse' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/data-catalog/{dataId}': {
      get: {
        tags: ['Data Catalog'],
        summary: 'Get data catalog entry by data_id',
        description: 'Single catalog entry by data_id (e.g. AADHAAR_NUMBER).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'dataId', in: 'path', required: true, schema: { type: 'string' }, description: 'Data ID (e.g. AADHAAR_NUMBER)' }],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DataCatalogEntry' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/purposes': {
      post: {
        tags: ['Purposes'],
        summary: 'Create purpose',
        description: 'Create a purpose scoped to tenant. Owner/admin only. Audit: PURPOSE_CREATE.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PurposeCreateRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PurposeSingleResponse' } } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Purpose with this name already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Purposes'],
        summary: 'List purposes',
        description: 'List purposes for tenant. By default only active; use include_inactive=true to include soft-deleted. Audit: PURPOSE_LIST.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'include_inactive', in: 'query', required: false, schema: { type: 'string', enum: ['true', 'false'] }, description: 'If true, include inactive (soft-deleted) purposes' },
        ],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PurposeListResponse' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/purposes/{id}': {
      put: {
        tags: ['Purposes'],
        summary: 'Update purpose',
        description: 'Update purpose. Owner/admin only. Audit: PURPOSE_UPDATE.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Purpose UUID' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PurposeUpdateRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PurposeSingleResponse' } } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Purpose not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Purposes'],
        summary: 'Delete purpose (soft)',
        description: 'Set active = false. Owner/admin only. Audit: PURPOSE_DELETE.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Purpose UUID' }],
        responses: {
          200: {
            description: 'Deactivated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PurposeDeactivateResponse' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Purpose not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/tenant/apps/{appId}/policy-versions': {
      post: {
        tags: ['Policy Versions', 'Apps'],
        summary: 'Create policy version',
        description: 'Deactivate previous active for this app, create new, set is_active = true. Owner/admin only. Audit: POLICY_VERSION_CREATE. Policy is per app.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'App UUID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PolicyVersionCreateRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Created',
            content: { 'application/json': { schema: { type: 'object', properties: { policyVersion: { $ref: '#/components/schemas/PolicyVersion' } } } } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Version label already exists for this app', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Policy Versions', 'Apps'],
        summary: 'List policy versions',
        description: 'All policy versions for this app, ordered by created_at desc. Owner/admin only. Audit: POLICY_VERSION_LIST.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'App UUID' }],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PolicyVersionListResponse' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/tenant/apps/{appId}/policy-versions/active': {
      get: {
        tags: ['Policy Versions', 'Apps'],
        summary: 'Get active policy version',
        description: 'Return active policy for this app. Audit: POLICY_VERSION_READ.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'appId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'App UUID' }],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PolicyVersionActiveResponse' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/public/purposes': {
      get: {
        tags: ['Public API'],
        summary: 'List purposes (public)',
        description: 'Active purposes for consent banner. API key required (x-api-key). Audit: PUBLIC_PURPOSE_LIST.',
        security: [{ apiKey: [] }],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PublicPurposesResponse' } } },
          },
          401: { description: 'Invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: { description: 'Rate limit exceeded (public API)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/public/apps/{appId}/policy': {
      get: {
        tags: ['Public API'],
        summary: 'Get active policy (public)',
        description: 'Active policy version for the app. API key required. Audit: PUBLIC_POLICY_READ. Returns null if no active policy.',
        security: [{ apiKey: [] }],
        parameters: [
          { name: 'appId', in: 'path', required: true, description: 'App UUID', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PublicPolicyResponse' } } },
          },
          401: { description: 'Invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: { description: 'Rate limit exceeded (public API)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/public/apps/{appId}/consent': {
      post: {
        tags: ['Public API', 'Consent'],
        summary: 'Submit consent (public)',
        description:
          'Submit user consent for the app. Identity: email (or userEmail/user_email) + phone (phone_number/phoneNumber/phone); purpose/policy camelCase or snake_case. Server stores hashes + derived user_id. API key (x-api-key). Audit: PUBLIC_CONSENT_GRANTED (metadata.email_hash). Webhook: consent.granted.',
        security: [{ apiKey: [] }],
        parameters: [
          { name: 'appId', in: 'path', required: true, description: 'App UUID', schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PublicConsentGrantRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PublicConsentSuccessResponse' } } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App, purpose or policy version not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: { description: 'Rate limit exceeded (public API)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Public API', 'Consent'],
        summary: 'Withdraw consent (public)',
        description:
          'Withdraw for (derived identity, purpose). Same field aliases as public grant. API key required. Audit: PUBLIC_CONSENT_WITHDRAWN (metadata.email_hash). Webhook: consent.withdrawn.',
        security: [{ apiKey: [] }],
        parameters: [
          { name: 'appId', in: 'path', required: true, description: 'App UUID', schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PublicConsentWithdrawRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PublicConsentSuccessResponse' } } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'App or consent not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: { description: 'Rate limit exceeded (public API)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};

module.exports = spec;
