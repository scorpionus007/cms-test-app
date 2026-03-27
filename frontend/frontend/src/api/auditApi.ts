import apiClient from './apiClient';

export interface AuditLog {
    id: string;
    action: string;
    actor_client_id: string;
    resource_type: string;
    resource_id: string;
    ip_address: string;
    created_at: string;
    metadata: any;
}

export const auditApi = {
    getAuditLogs: async (params?: { page?: number; limit?: number; [key: string]: any }) => {
        // Removed custom Cache-Control headers to avoid CORS preflight issues.
        // The backend now handles Cache-Control in the response.
        const response = await apiClient.get('/audit-logs', { params });

        // Backend returns { logs: [], pagination: {} }
        const { logs = [], pagination = null } = response.data;

        return {
            logs: logs.map((log: any) => ({
                id: log.id,
                action: log.action,
                actor_client_id: log.actor_client_id || null,
                resource_type: log.resource_type,
                resource_id: log.resource_id,
                ip_address: log.ip_address,
                created_at: log.created_at,
                metadata: log.metadata
            })),
            pagination
        };
    },
};