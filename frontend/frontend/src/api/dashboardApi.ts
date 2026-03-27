import apiClient from './apiClient';

export interface DashboardStats {
    active_consents: number;
    open_dsr_requests: number;
    registered_clients: number;
    active_webhooks: number;
}

export const dashboardApi = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await apiClient.get('/tenant/stats');
        return response.data;
    }
};
