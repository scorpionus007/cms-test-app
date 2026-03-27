import apiClient from './apiClient';

export interface DSRRequest {
    id: string;
    user_id: string;
    request_type: 'access' | 'erasure' | 'correction' | 'portability' | 'rectification';
    status: 'pending' | 'processing' | 'created' | 'identity_verified' | 'approved' | 'executing' | 'completed' | 'rejected' | 'escalated';
    created_at: string;
    updated_at: string;
    metadata?: any;
}

export interface DSRTimelineEntry {
    status: string;
    timestamp: string;
    metadata?: any;
}

export interface DSRStatusResponse {
    dsr: DSRRequest;
    timeline: DSRTimelineEntry[];
}

export const dsrApi = {
    getDsrRequests: async (appId: string) => {
        const response = await apiClient.get<{ requests: DSRRequest[] }>(`/tenant/apps/${appId}/dsr`);
        return response.data.requests || [];
    },
    createDsrRequest: async (appId: string, data: { user_id: string, type: string }) => {
        const response = await apiClient.post<DSRRequest>('/dsr/request', { ...data, app_id: appId });
        return response.data;
    },
    getDsrStatus: async (appId: string, id: string) => {
        const response = await apiClient.get<DSRStatusResponse>(`/tenant/apps/${appId}/dsr/${id}`);
        return response.data;
    },
    updateDsrStatus: async (appId: string, id: string, data: { status: string, metadata?: any }) => {
        const response = await apiClient.patch<{ message: string, dsr: DSRRequest }>(`/tenant/apps/${appId}/dsr/${id}`, data);
        return response.data;
    },
    exportDsrData: async (appId: string, id: string) => {
        const response = await apiClient.get(`/tenant/apps/${appId}/dsr/${id}/export`);
        return response.data;
    }
};
