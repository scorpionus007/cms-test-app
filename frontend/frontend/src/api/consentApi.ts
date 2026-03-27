import apiClient from './apiClient';

export interface GrantConsentRequest {
    email: string;
    phone_number?: string;
    purposeId: string;
    policyVersionId: string;
}

export interface Consent {
    userId: string;
    purposeId: string;
    policyVersionId: string;
    grantedAt: string;
}

export const consentApi = {
    grantConsent: async (appId: string, data: GrantConsentRequest) => {
        const response = await apiClient.post<Consent>(`/tenant/apps/${appId}/consent`, data);
        return response.data;
    },
    getUserConsent: async (appId: string, userId: string) => {
        const response = await apiClient.get<{ consents: Consent[] }>(`/tenant/apps/${appId}/consent/${userId}`);
        return response.data.consents;
    },
    getAllConsents: async (appId: string) => {
        const response = await apiClient.get<{ consents: any[] }>(`/tenant/apps/${appId}/consents`);
        return response.data.consents;
    },
    withdrawConsent: async (appId: string, userId: string, purposeId: string) => {
        const response = await apiClient.delete(`/tenant/apps/${appId}/consent/${userId}/${purposeId}`);
        return response.data;
    },
    requestManualOtp: async (appId: string, data: GrantConsentRequest) => {
        const response = await apiClient.post<{ sessionId: string; sentTo: string; success: boolean; dev_otp?: string }>(`/tenant/apps/${appId}/consent/request-otp`, data);
        return response.data;
    },
    verifyManualOtp: async (appId: string, sessionId: string, otp: string) => {
        const response = await apiClient.post<{ success: boolean; consentId: string; alreadyConsented?: boolean }>(`/tenant/apps/${appId}/consent/verify-otp`, { sessionId, otp });
        return response.data;
    },
};
