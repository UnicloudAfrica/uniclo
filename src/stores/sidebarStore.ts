import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapse: () => void;
  setCollapsed: (value: boolean) => void;
  toggleMobile: () => void;
  setMobileOpen: (value: boolean) => void;
  closeMobile: () => void;
}

const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (value) => set({ isCollapsed: value }),
      toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      setMobileOpen: (value) => set({ isMobileOpen: value }),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: "sidebar-storage",
      partialize: (state) => ({ isCollapsed: state.isCollapsed }) as any, // Only persist collapsed state
    }
  )
);

export default useSidebarStore;
