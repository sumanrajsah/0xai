
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
type HistoryBarStore = {
    isHistoryBarOpen: boolean;
    toggleHistoryBar: () => void;
    closeHistoryBar: () => void;
};

export const useHistoryBarStore = create<HistoryBarStore>()(
    persist(
        (set) => ({
            isHistoryBarOpen: false,
            toggleHistoryBar: () =>
                set((state) => ({ isHistoryBarOpen: !state.isHistoryBarOpen })),
            closeHistoryBar: () => set({ isHistoryBarOpen: false }),
        }),
        {
            name: 'HistoryBar-settings', // key in localStorage
        }
    )
);