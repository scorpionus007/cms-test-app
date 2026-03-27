import apiClient from './apiClient';

export interface AppConfig {
    id: string;
    tenant_id: string;
    name: string;
    slug: string;
    status: 'active' | 'inactive';
    created_at: string;
}

export const appsApi = {
    // List all apps
    listApps: async (): Promise<{ apps: AppConfig[] }> => {
        const response = await apiClient.get('/tenant/apps');
        return response.data;
    },

    // Get single app
    getApp: async (appId: string): Promise<AppConfig> => {
        const response = await apiClient.get(`/tenant/apps/${appId}`);
        return response.data;
    },

    // Create app
    createApp: async (data: { name: string; slug: string }): Promise<{ app: AppConfig }> => {
        const response = await apiClient.post('/tenant/apps', data);
        return response.data;
    },

    // Update app
    updateApp: async (appId: string, data: { name?: string; slug?: string; status?: 'active' | 'inactive' }): Promise<{ app: AppConfig }> => {
        const response = await apiClient.put(`/tenant/apps/${appId}`, data);
        return response.data;
    },

    // Delete app
    deleteApp: async (appId: string): Promise<void> => {
        const response = await apiClient.delete(`/tenant/apps/${appId}`);
        return response.data;
    }
};
