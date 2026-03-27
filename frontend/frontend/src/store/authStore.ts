import { create } from 'zustand';

export interface User {
    name: string;
    email: string;
}

export interface TenantMetadata {
    organizationName: string;
    industry: string;
    country: string;
}

interface AuthState {
    token: string | null;
    onboardingToken: string | null;
    tenantId: string | null;
    clientId: string | null;
    user: User | null;
    tenantMetadata: TenantMetadata | null;

    // Actions
    loginWithOnboarding: (onboardingToken: string, user: User) => void;
    loginFull: (token: string, tenantId: string, clientId: string, user: User, tenantMetadata?: TenantMetadata) => void;
    completeOnboarding: (token: string, tenantId: string, clientId: string, tenantMetadata: TenantMetadata) => void;
    setTenantMetadata: (tenantMetadata: TenantMetadata) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('token'),
    onboardingToken: localStorage.getItem('onboardingToken'),
    tenantId: localStorage.getItem('tenantId'),
    clientId: localStorage.getItem('clientId'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
    tenantMetadata: localStorage.getItem('tenantMetadata') ? JSON.parse(localStorage.getItem('tenantMetadata') as string) : null,

    loginWithOnboarding: (onboardingToken, user) => {
        localStorage.setItem('onboardingToken', onboardingToken);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('token');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('clientId');
        localStorage.removeItem('tenantMetadata');
        set({ onboardingToken, user, token: null, tenantId: null, clientId: null, tenantMetadata: null });
    },

    loginFull: (token, tenantId, clientId, user, tenantMetadata) => {
        localStorage.setItem('token', token);
        localStorage.setItem('tenantId', tenantId);
        localStorage.setItem('clientId', clientId);
        localStorage.setItem('user', JSON.stringify(user));
        if (tenantMetadata) {
            localStorage.setItem('tenantMetadata', JSON.stringify(tenantMetadata));
        } else {
            localStorage.removeItem('tenantMetadata');
        }
        localStorage.removeItem('onboardingToken');
        set({ token, tenantId, clientId, user, tenantMetadata: tenantMetadata || null, onboardingToken: null });
    },

    completeOnboarding: (token, tenantId, clientId, tenantMetadata) => {
        localStorage.setItem('token', token);
        localStorage.setItem('tenantId', tenantId);
        localStorage.setItem('clientId', clientId);
        localStorage.setItem('tenantMetadata', JSON.stringify(tenantMetadata));
        localStorage.removeItem('onboardingToken');
        set({ token, tenantId, clientId, tenantMetadata, onboardingToken: null });
    },

    setTenantMetadata: (tenantMetadata) => {
        localStorage.setItem('tenantMetadata', JSON.stringify(tenantMetadata));
        set({ tenantMetadata });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('onboardingToken');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('clientId');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantMetadata');
        set({ token: null, onboardingToken: null, tenantId: null, clientId: null, user: null, tenantMetadata: null });
    }
}));
