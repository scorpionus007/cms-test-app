/**
 * OpenAPI 3.0 spec for SecureDApp CMS API.
 * Served at /api-docs
 */
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'SecureDApp CMS API',
    description: 'Multi-tenant consent management system (DPDP compliance).',
    version: '1.0.0',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and current user' },
    { name: 'Tenant', description: 'Organization / tenant' },
    { name: 'Clients', description: 'Tenant users (invite, list)' },
    { name: 'Audit', description: 'Audit logs (owner/admin)' },
    { name: 'Consent', description: 'Consent identity and events (event-sourced)' },
    { name: 'Purposes', description: 'Consent purposes (tenant-scoped)' },
    { name: 'Policy Versions', description: 'Policy versions (tenant-scoped)' },
    { name: 'Webhooks', description: 'Webhook endpoints (notify external systems on events)' },
    { name: 'DSR', description: 'Data Subject Requests (access, erasure, rectification)' },
    { name: 'Public API', description: 'External CMS integration (API key auth, no JWT)' },
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
            items: { type: 'string', enum: ['consent.granted', 'consent.withdrawn', 'policy.updated', 'purpose.created', 'dsr.completed'] },
            example: ['consent.granted', 'consent.withdrawn'],
          },
          secret: { type: 'string', nullable: true, description: 'Optional; generated if omitted' },
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
          metadata: { type: 'object', nullable: true },
          ip_address: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
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
        required: ['user_id'],
        properties: {
          user_id: { type: 'string', description: 'Pseudonymous user identifier' },
          type: { type: 'string', enum: ['access', 'erasure', 'rectification'], description: 'Request type' },
        },
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
        description: 'Register a webhook endpoint. Payloads are signed with HMAC SHA256 (x-webhook-signature). Secret is returned only on create. Only owner or admin.',
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
            content: {
              'application/json': {
                schema: {
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
              },
            },
          },
          400: { description: 'Export only for access requests', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } },
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
    '/consent': {
      post: {
        tags: ['Consent'],
        summary: 'Grant consent',
        description: 'Record consent for a user and purpose. Creates consent identity if needed, appends GRANTED event with hash. Requires consent:write.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'purposeId', 'policyVersionId'],
                properties: {
                  userId: { type: 'string', description: 'Pseudonymous user identifier' },
                  purposeId: { type: 'string', format: 'uuid' },
                  policyVersionId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Consent recorded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Consent recorded' },
                    consentId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Purpose or policy version not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/consent/{userId}': {
      get: {
        tags: ['Consent'],
        summary: 'Get consent state (derived from events)',
        description: 'Consent Read / Derivation Layer. Derives current consent state from consent_events (latest event per consent for tenant+user). No status stored in consents table. Audits CONSENT_READ.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, description: 'Pseudonymous user identifier' },
        ],
        responses: {
          200: {
            description: 'Consent state derived from events',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    consents: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          purposeId: { type: 'string', format: 'uuid' },
                          status: { type: 'string', enum: ['granted', 'withdrawn'] },
                          policyVersionId: { type: 'string', format: 'uuid', nullable: true },
                          timestamp: { type: 'string', format: 'date-time', description: 'ISO-8601 of latest event' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/consent/{userId}/{purposeId}': {
      delete: {
        tags: ['Consent'],
        summary: 'Withdraw consent (per purpose)',
        description: 'Append WITHDRAWN event for (user, purpose). Consent identity is never deleted; state is derived from events. Idempotent: if already withdrawn, returns 200 without duplicate event. Triggers webhook. Requires consent:write.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, description: 'Pseudonymous user identifier' },
          { name: 'purposeId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Purpose UUID to withdraw' },
        ],
        responses: {
          200: {
            description: 'Consent withdrawn (or already withdrawn)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Consent withdrawn' },
                    consentId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Consent not found for this user and purpose', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
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
        description: 'Returns paginated audit logs for the current tenant. Only owner or admin. Filter by action and date range.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'action', in: 'query', schema: { type: 'string' }, description: 'Filter by action (e.g. TENANT_CREATED, CLIENT_LOGIN, CLIENT_INVITED)' },
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
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  required: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { purpose: { type: 'object' } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Purposes'],
        summary: 'List purposes',
        description: 'List active purposes for tenant. Audit: PURPOSE_LIST.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { type: 'object', properties: { purposes: { type: 'array', items: { type: 'object' } } } } } } },
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
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  required: { type: 'boolean' },
                  active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { type: 'object', properties: { purpose: { type: 'object' } } } } } },
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
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deactivated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Purpose not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/policy-versions': {
      post: {
        tags: ['Policy Versions'],
        summary: 'Create policy version',
        description: 'Deactivate previous active, create new, set is_active = true. Owner/admin only. Audit: POLICY_VERSION_CREATE.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['version', 'policy_text'],
                properties: {
                  version: { type: 'string' },
                  policy_text: { type: 'string' },
                  effective_from: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { policyVersion: { type: 'object' } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Version label already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Policy Versions'],
        summary: 'List policy versions',
        description: 'All tenant policy versions, ordered by created_at desc. Owner/admin only. Audit: POLICY_VERSION_LIST.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { type: 'object', properties: { policyVersions: { type: 'array', items: { type: 'object' } } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/policy-versions/active': {
      get: {
        tags: ['Policy Versions'],
        summary: 'Get active policy version',
        description: 'Return tenant active policy. Audit: POLICY_VERSION_READ.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { type: 'object', properties: { policyVersion: { type: 'object', nullable: true } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
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
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    purposes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          description: { type: 'string', nullable: true },
                          required: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/public/policy': {
      get: {
        tags: ['Public API'],
        summary: 'Get active policy (public)',
        description: 'Active policy version. API key required. Audit: PUBLIC_POLICY_READ.',
        security: [{ apiKey: [] }],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    policyVersion: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        version: { type: 'string' },
                        policy_text: { type: 'string' },
                        effective_from: { type: 'string', format: 'date' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/public/consent': {
      post: {
        tags: ['Public API'],
        summary: 'Submit consent (public)',
        description: 'Submit user consent. API key required. Audit: PUBLIC_CONSENT_GRANTED.',
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user_id', 'purpose_id', 'policy_version_id'],
                properties: {
                  user_id: { type: 'string' },
                  purpose_id: { type: 'string', format: 'uuid' },
                  policy_version_id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Purpose or policy version not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Public API'],
        summary: 'Withdraw consent (public)',
        description: 'Withdraw consent for (user_id, purpose_id). API key required. Audit: PUBLIC_CONSENT_WITHDRAWN.',
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user_id', 'purpose_id'],
                properties: {
                  user_id: { type: 'string' },
                  purpose_id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Consent not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    }
};

module.exports = spec;
