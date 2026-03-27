import apiClient from './apiClient';

export interface Tenant {
    id: string;
    organizationName: string;
    industry?: string;
    country?: string;
    consentFlow?: 'embedded' | 'redirect';
    legal_info?: {
        cin?: string;
        gst?: string;
    };
    address?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
    createdAt?: string;
}

export interface ApiKey {
    id: string;
    name: string;
    keyMasked?: string;
    key?: string;
    createdDate: string;
    expiryDate: string;
    status: string;
}

export interface CreateApiKeyPayload {
    name?: string;
}

export interface OnboardTenantPayload {
    organizationName: string;
    industry: string;
    country: string;
    consentFlow?: 'embedded' | 'redirect';
    cin?: string;
    gst?: string;
    address?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
}

export const tenantApi = {
    onboardTenant: async (data: OnboardTenantPayload) => {
        const payload = {
            organization_name: data.organizationName,
            industry: data.industry,
            country: data.country,
            consent_flow: data.consentFlow,
            cin: data.cin,
            gst: data.gst,
            address: data.address
        };
        const response = await apiClient.post('/tenant/onboard', payload);
        return response.data;
    },
    getCurrentTenant: async () => {
        const response = await apiClient.get<any>('/tenant/me');
        const data = response.data;
        return {
            id: data.id,
            organizationName: data.name || 'Not Set',
            industry: data.industry || 'Not Set',
            country: data.country || 'Not Set',
            consentFlow: data.consent_flow || 'embedded',
            legal_info: data.legal_info,
            address: data.address,
            createdAt: data.created_at
        };
    },
    updateTenant: async (data: Partial<OnboardTenantPayload>) => {
        const payload = {
            organization_name: data.organizationName,
            industry: data.industry,
            country: data.country,
            consent_flow: data.consentFlow,
            cin: data.cin,
            gst: data.gst,
            address: data.address
        };
        const response = await apiClient.put('/tenant/me', payload);
        return response.data;
    },
    createApiKey: async (data: CreateApiKeyPayload) => {
        const payload = {
            name: data.name
        };
        const response = await apiClient.post<any>('/tenant/api-keys', payload);
        const key = response.data;
        return {
            id: key.id,
            name: key.name || 'Unnamed Key',
            key: key.key,
            keyMasked: key.key ? `...${String(key.key).slice(-4)}` : '...',
            createdDate: new Date(key.created_at).toLocaleDateString(),
            expiryDate: 'Never',
            status: key.active ? 'Active' : 'Revoked'
        } as ApiKey;
    },
    listApiKeys: async () => {
        const response = await apiClient.get<{ api_keys: any[] }>('/tenant/api-keys');
        return response.data.api_keys.map(key => ({
            id: key.id,
            name: key.name || 'Unnamed Key',
            keyMasked: key.key_masked || '...',
            createdDate: new Date(key.created_at).toLocaleDateString(),
            expiryDate: 'Never', // Backend currently doesn't provide expiry
            status: key.active ? 'Active' : 'Revoked'
        }));
    },
    revokeApiKey: async (id: string) => {
        const response = await apiClient.delete(`/tenant/api-keys/${id}`);
        return response.data;
    },
};
