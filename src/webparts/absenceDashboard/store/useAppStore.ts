import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AbsenceRecord, AbsenceDayRecord, RegulRecord, VacationStats } from '../types';
import type { AbsenceFilters } from '../components/filters/filterTypes';
import { defaultFilters } from '../components/filters/filterTypes';
import { expandToDailyRecords } from '../utils/absenceExpander';
import { filterDayRecords } from '../utils/filterDayRecords';

type AppState = {
  records: AbsenceRecord[];
  dailyRecords: AbsenceDayRecord[];
  regulRecords: RegulRecord[];
  vacationStats: Record<string, VacationStats>;
  processedFileNotes: string[];
  fileErrors: string[];
  folderName: string | null;
  sidebarOpen: boolean;
  filters: AbsenceFilters;
  selectedEmployeeDetail: string | null;
  setRecords: (records: AbsenceRecord[], folderName?: string | null) => void;
  setRegulRecords: (records: RegulRecord[]) => void;
  setVacationStats: (stats: Record<string, VacationStats>) => void;
  setProcessedFileNotes: (notes: string[]) => void;
  setFileErrors: (errors: string[]) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  clearRecords: () => void;
  toggleSidebar: () => void;
  setFilters: (filters: Partial<AbsenceFilters>) => void;
  resetFilters: () => void;
  getFilteredRecords: () => AbsenceRecord[];
  getFilteredDayRecords: () => AbsenceDayRecord[];
  setSelectedEmployeeDetail: (username: string | null) => void;
};

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

function reviveRegulDates(records: RegulRecord[]): RegulRecord[] {
  return records.map((r) => ({
    ...r,
    date: new Date(r.date),
    dateToRegularise: new Date(r.dateToRegularise),
  }));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      records: [],
      dailyRecords: [],
      regulRecords: [],
      vacationStats: {},
      processedFileNotes: [],
      fileErrors: [],
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
      setRegulRecords: (records) => set({ regulRecords: records }),
      setVacationStats: (stats) => set({ vacationStats: stats }),
      setProcessedFileNotes: (notes) => set({ processedFileNotes: notes }),
      setFileErrors: (errors) => set({ fileErrors: errors }),
      clearRecords: () => set({ records: [], dailyRecords: [], folderName: null, regulRecords: [], vacationStats: {}, processedFileNotes: [], fileErrors: [] }),
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),
      getFilteredRecords: () => {
        const { dailyRecords, records, filters } = get();
        const matchingIds = new Set(
          filterDayRecords(dailyRecords, filters).map((dr) => dr.originalAbsenceId),
        );
        return records.filter((r) => matchingIds.has(r.id));
      },
      getFilteredDayRecords: () => {
        const { dailyRecords, filters } = get();
        return filterDayRecords(dailyRecords, filters);
      },
      setSelectedEmployeeDetail: (username) => set({ selectedEmployeeDetail: username }),
    }),
    {
      name: 'absence-dashboard-storage',
      storage: createJSONStorage(() => sessionStorageMiddleware),
      partialize: (state) => ({
        records: state.records,
        regulRecords: state.regulRecords,
        folderName: state.folderName,
      }),
      merge: (persisted, current) => {
        const merged = { ...current, ...(typeof persisted === 'object' && persisted !== null ? persisted : {}) } as AppState;
        if (merged.records?.length) {
          merged.records = reviveDates(merged.records);
          merged.dailyRecords = merged.records.flatMap(expandToDailyRecords);
        }
        if (merged.regulRecords?.length) {
          merged.regulRecords = reviveRegulDates(merged.regulRecords);
        }
        // vacationStats is derived — always reset to force recomputation on load.
        merged.vacationStats = {};
        return merged;
      },
    },
  ),
);
