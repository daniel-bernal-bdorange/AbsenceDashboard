export type AbsenceCategory = 'Vacation' | 'VacationPreviousYear' | 'SickLeave' | 'Maternity' | 'Special';

export type Department = 'Prod' | 'BackOffice' | 'Unknown';

export interface AbsenceFilters {
  departments: Department[];
  employees: string[];
  selectedYears: number[];
  selectedMonths: number[];
  categories: AbsenceCategory[];
}

const ALL_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export { ALL_MONTHS };

export const defaultFilters: AbsenceFilters = {
  departments: [],
  employees: [],
  selectedYears: [new Date().getFullYear()],
  selectedMonths: ALL_MONTHS,
  categories: [],
};