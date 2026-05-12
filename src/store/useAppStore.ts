import { create } from 'zustand';

type AppState = {
  selectedYear: number;
  sidebarOpen: boolean;
  setSelectedYear: (year: number) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
};

const currentYear = new Date().getFullYear();

export const useAppStore = create<AppState>((set) => ({
  selectedYear: currentYear,
  sidebarOpen: true,
  setSelectedYear: (year) => set({ selectedYear: year }),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
