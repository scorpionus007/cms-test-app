import { create } from 'zustand';

interface AppState {
    selectedAppId: string | null;
    setSelectedAppId: (appId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    selectedAppId: localStorage.getItem('selectedAppId'),
    setSelectedAppId: (appId) => {
        if (appId) {
            localStorage.setItem('selectedAppId', appId);
        } else {
            localStorage.removeItem('selectedAppId');
        }
        set({ selectedAppId: appId });
    },
}));
