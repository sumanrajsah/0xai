
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
type SidebarStore = {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
};

export const useSidebarStore = create<SidebarStore>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            toggleSidebar: () =>
                set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            closeSidebar: () => set({ isSidebarOpen: false }),
        }),
        {
            name: 'sidebar-settings', // key in localStorage
        }
    )
);