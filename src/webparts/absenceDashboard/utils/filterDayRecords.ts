import type { AbsenceDayRecord } from '../types';
import type { AbsenceFilters } from '../components/filters/filterTypes';

export function filterDayRecords(
  dailyRecords: AbsenceDayRecord[],
  filters: AbsenceFilters,
  selectedYear?: number,
): AbsenceDayRecord[] {
  return dailyRecords.filter((dr) => {
    // selectedYear (explicit, for OverviewChart) takes priority over global selectedYears
    if (selectedYear !== undefined) {
      if (dr.date.getFullYear() !== selectedYear) return false;
    } else if (filters.selectedYears.length > 0) {
      if (!filters.selectedYears.includes(dr.date.getFullYear())) return false;
    }
    if (filters.selectedMonths.length > 0 && !filters.selectedMonths.includes(dr.date.getMonth())) return false;
    if (filters.departments.length && !filters.departments.includes(dr.department ?? 'Unknown')) return false;
    if (filters.employees.length && !filters.employees.includes(dr.employeeUsername)) return false;
    if (filters.categories.length && !filters.categories.includes(dr.category)) return false;
    return true;
  });
}
