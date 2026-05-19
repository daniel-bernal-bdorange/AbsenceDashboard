import { create } from 'zustand';

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

export const useAppStore = create<AppState>((set) => ({
  selectedYear: currentYear,
  records: [],
  folderName: null,
  sidebarOpen: true,
  setRecords: (records, folderName = null) => set({ records, folderName }),
  clearRecords: () => set({ records: [], folderName: null }),
  setSelectedYear: (year) => set({ selectedYear: year }),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
