import apiClient from './apiClient';

export interface Purpose {
    id: string;
    name: string;
    description: string;
    required: boolean;
    required_data?: string[];
    permissions?: {
        allowed_access: string[];
        allowed_frequency: string[];
    };
    validity_days?: number;
    retention_days?: number;
    createdAt?: string;
}

export const purposeApi = {
    getPurposes: async () => {
        const response = await apiClient.get<{ purposes: Purpose[] }>('/purposes');
        return response.data.purposes;
    },
    createPurpose: async (data: Partial<Purpose>) => {
        const response = await apiClient.post<Purpose>('/purposes', data);
        return response.data;
    },
    updatePurpose: async (id: string, data: Partial<Purpose>) => {
        const response = await apiClient.put<Purpose>(`/purposes/${id}`, data);
        return response.data;
    },
    deletePurpose: async (id: string) => {
        const response = await apiClient.delete(`/purposes/${id}`);
        return response.data;
    },
};
