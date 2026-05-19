import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AbsenceRecord } from '../types';

type AppState = {
  selectedYear: number;
  records: AbsenceRecord[];
  folderName: string | null;
  sidebarOpen: boolean;
  setRecords: (records: AbsenceRecord[], folderName?: string | null) => void;
  setSelectedYear: (year: number) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  clearRecords: () => void;
  toggleSidebar: () => void;
};

const currentYear = new Date().getFullYear();

const sessionStorageMiddleware = {
  getItem: (name: string) => {
    const str = sessionStorage.getItem(name);
    return str ? JSON.parse(str) : null;
  },
  setItem: (name: string, value: string) => {
    sessionStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    sessionStorage.removeItem(name);
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedYear: currentYear,
      records: [],
      folderName: null,
      sidebarOpen: true,
      setRecords: (records, folderName = null) => set({ records, folderName }),
      clearRecords: () => set({ records: [], folderName: null }),
      setSelectedYear: (year) => set({ selectedYear: year }),
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'absence-dashboard-storage',
      storage: createJSONStorage(() => sessionStorageMiddleware),
      partialize: (state) => ({
        records: state.records,
        folderName: state.folderName,
        selectedYear: state.selectedYear,
      }),
    },
  ),
);
