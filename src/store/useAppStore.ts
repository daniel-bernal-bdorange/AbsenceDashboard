import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AbsenceRecord } from '../types';
import type { AbsenceFilters } from '../components/filters/filterTypes';
import { defaultFilters } from '../components/filters/filterTypes';

type AppState = {
  selectedYear: number;
  records: AbsenceRecord[];
  folderName: string | null;
  sidebarOpen: boolean;
  filters: AbsenceFilters;
  setRecords: (records: AbsenceRecord[], folderName?: string | null) => void;
  setSelectedYear: (year: number) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  clearRecords: () => void;
  toggleSidebar: () => void;
  setFilters: (filters: Partial<AbsenceFilters>) => void;
  resetFilters: () => void;
  getFilteredRecords: () => AbsenceRecord[];
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
    (set, get) => ({
      selectedYear: currentYear,
      records: [],
      folderName: null,
      sidebarOpen: true,
      filters: defaultFilters,
      setRecords: (records, folderName = null) => set({ records, folderName }),
      clearRecords: () => set({ records: [], folderName: null }),
      setSelectedYear: (year) => set({ selectedYear: year }),
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),
      getFilteredRecords: () => {
        const { records, filters, selectedYear } = get();
        return records.filter((r) => {
          if (r.from.getFullYear() !== selectedYear) return false;
          if (filters.departments.length && !filters.departments.includes(r.department ?? 'Unknown')) return false;
          if (filters.employees.length && !filters.employees.includes(r.employeeUsername)) return false;
          if (filters.categories.length && !filters.categories.includes(r.category)) return false;
          if (filters.dateRange.from && r.from < filters.dateRange.from) return false;
          if (filters.dateRange.to && r.till > filters.dateRange.to) return false;
          if (filters.selectedMonth !== null) {
            const recordMonth = r.from.getMonth();
            const recordEndMonth = r.till.getMonth();
            if (recordMonth > filters.selectedMonth || recordEndMonth < filters.selectedMonth) return false;
          }
          return true;
        });
      },
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
