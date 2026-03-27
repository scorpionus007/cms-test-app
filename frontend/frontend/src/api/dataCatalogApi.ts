import apiClient from './apiClient';

export interface DataCatalogEntry {
    id: string;
    data_id: string;
    description: string;
    category: string;
    sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'active' | 'inactive';
}

export const dataCatalogApi = {

    // List all active data catalog entries
    listCatalog: async (): Promise<{ data: DataCatalogEntry[] }> => {
        const response = await apiClient.get('/data-catalog');
        return { data: response.data.data_catalog };
    },

    // Get a specific data catalog entry by data_id
    getEntry: async (dataId: string): Promise<DataCatalogEntry> => {
        const response = await apiClient.get(`/data-catalog/${dataId}`);
        return response.data;
    }
};