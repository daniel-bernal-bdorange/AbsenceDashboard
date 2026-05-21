import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AbsenceRecord, AbsenceDayRecord } from '../types';
import type { AbsenceFilters } from '../components/filters/filterTypes';
import { defaultFilters } from '../components/filters/filterTypes';
import { expandToDailyRecords } from '../utils/absenceExpander';
import { filterDayRecords } from '../utils/filterDayRecords';

type AppState = {
  selectedYear: number;
  records: AbsenceRecord[];
  dailyRecords: AbsenceDayRecord[];
  folderName: string | null;
  sidebarOpen: boolean;
  filters: AbsenceFilters;
  selectedEmployeeDetail: string | null;
  setRecords: (records: AbsenceRecord[], folderName?: string | null) => void;
  setSelectedYear: (year: number) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  clearRecords: () => void;
  toggleSidebar: () => void;
  setFilters: (filters: Partial<AbsenceFilters>) => void;
  resetFilters: () => void;
  getFilteredRecords: () => AbsenceRecord[];
  getFilteredDayRecords: () => AbsenceDayRecord[];
  setSelectedEmployeeDetail: (username: string | null) => void;
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

function reviveDates(records: AbsenceRecord[]): AbsenceRecord[] {
  return records.map((r) => ({
    ...r,
    from: new Date(r.from),
    till: new Date(r.till),
    requestDate: new Date(r.requestDate),
  }));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedYear: currentYear,
      records: [],
      dailyRecords: [],
      folderName: null,
      sidebarOpen: true,
      filters: defaultFilters,
      selectedEmployeeDetail: null,
      setRecords: (records, folderName = null) =>
        set({
          records,
          dailyRecords: records.flatMap(expandToDailyRecords),
          folderName,
        }),
      clearRecords: () => set({ records: [], dailyRecords: [], folderName: null }),
      setSelectedYear: (year) => set({ selectedYear: year }),
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),
      getFilteredRecords: () => {
        const { dailyRecords, records, filters, selectedYear } = get();
        const matchingIds = new Set(
          filterDayRecords(dailyRecords, filters, selectedYear).map((dr) => dr.originalAbsenceId),
        );
        return records.filter((r) => matchingIds.has(r.id));
      },
      getFilteredDayRecords: () => {
        const { dailyRecords, filters, selectedYear } = get();
        return filterDayRecords(dailyRecords, filters, selectedYear);
      },
      setSelectedEmployeeDetail: (username) => set({ selectedEmployeeDetail: username }),
    }),
    {
      name: 'absence-dashboard-storage',
      storage: createJSONStorage(() => sessionStorageMiddleware),
      partialize: (state) => ({
        records: state.records,
        folderName: state.folderName,
        selectedYear: state.selectedYear,
      }),
      merge: (persisted, current) => {
        const merged = { ...current, ...(typeof persisted === 'object' && persisted !== null ? persisted : {}) } as AppState;
        if (merged.records?.length) {
          merged.records = reviveDates(merged.records);
          merged.dailyRecords = merged.records.flatMap(expandToDailyRecords);
        }
        return merged;
      },
    },
  ),
);
