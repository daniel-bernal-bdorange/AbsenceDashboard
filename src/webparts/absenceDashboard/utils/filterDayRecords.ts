import type { AbsenceDayRecord } from '../types';
import type { AbsenceFilters } from '../components/filters/filterTypes';

function normalizeDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function filterDayRecords(
  dailyRecords: AbsenceDayRecord[],
  filters: AbsenceFilters,
  selectedYear?: number,
): AbsenceDayRecord[] {
  return dailyRecords.filter((dr) => {
    if (selectedYear !== undefined && dr.date.getFullYear() !== selectedYear) return false;
    if (filters.departments.length && !filters.departments.includes(dr.department ?? 'Unknown')) return false;
    if (filters.employees.length && !filters.employees.includes(dr.employeeUsername)) return false;
    if (filters.categories.length && !filters.categories.includes(dr.category)) return false;
    if (filters.dateRange.from && dr.date < normalizeDate(filters.dateRange.from)) return false;
    if (filters.dateRange.to && dr.date > normalizeDate(filters.dateRange.to)) return false;
    if (filters.selectedMonth !== null && dr.date.getMonth() !== filters.selectedMonth) return false;
    return true;
  });
}
