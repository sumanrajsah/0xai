
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
type QuickAccessBarStore = {
    isQuickAccessBarOpen: boolean;
    toggleQuickAccessBar: () => void;
    closeQuickAccessBar: () => void;
};

export const useQuickAccessBarStore = create<QuickAccessBarStore>()(
    persist(
        (set) => ({
            isQuickAccessBarOpen: false,
            toggleQuickAccessBar: () =>
                set((state) => ({ isQuickAccessBarOpen: !state.isQuickAccessBarOpen })),
            closeQuickAccessBar: () => set({ isQuickAccessBarOpen: false }),
        }),
        {
            name: 'QuickAccessBar-settings', // key in localStorage
        }
    )
);