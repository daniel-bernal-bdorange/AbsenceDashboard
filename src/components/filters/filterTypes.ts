export type AbsenceCategory = 'Vacation' | 'SickLeave' | 'Maternity' | 'Special';

export type Department = 'Prod' | 'BackOffice' | 'Unknown';

export interface AbsenceFilters {
  departments: Department[];
  employees: string[];
  dateRange: { from: Date | null; to: Date | null };
  categories: AbsenceCategory[];
  selectedMonth: number | null;
}

export const defaultFilters: AbsenceFilters = {
  departments: [],
  employees: [],
  dateRange: { from: null, to: null },
  categories: [],
  selectedMonth: null,
};