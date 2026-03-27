import apiClient from './apiClient';

export interface Client {
    id: string;
    name: string;
    email?: string;
    role?: string;
}

export interface InviteClientRequest {
    email: string;
    role: string;
}

export const clientApi = {
    getClients: async () => {
        const response = await apiClient.get<{ clients: Client[] }>('/clients');
        return response.data.clients;
    },
    inviteClient: async (data: InviteClientRequest) => {
        const response = await apiClient.post('/clients/invite', data);
        return response.data;
    },
};
