import apiClient from './apiClient';

export interface Webhook {
    id: string;
    url: string;
    events: string[];
    created_at?: string;
    active: boolean;
}

export const webhookApi = {
    getWebhooks: async () => {
        const response = await apiClient.get<{ webhooks: Webhook[] }>('/webhooks');
        return response.data.webhooks;
    },
    createWebhook: async (data: Partial<Webhook>) => {
        const response = await apiClient.post<Webhook>('/webhooks', data);
        return response.data;
    },
    deleteWebhook: async (id: string) => {
        const response = await apiClient.delete(`/webhooks/${id}`);
        return response.data;
    },
};
