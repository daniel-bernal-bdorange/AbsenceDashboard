import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { NoDataState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getDayValue } from '../../types';
import { useSort } from '../../hooks/useSort';
interface EmployeeSummary {
  username: string;
  department: string;
  totalDays: number;
  vacationDays: number;
  vacationPrevYearDays: number;
  sickDays: number;
  specialDays: number;
  absenceCount: number;
}

export function EmployeeSummaryTable() {
  const { t } = useTranslation('table');
  const { t: tCharts } = useTranslation('charts');
  const { t: tDashboard } = useTranslation('dashboard');
  const getFilteredDayRecords = useAppStore((s) => s.getFilteredDayRecords);
  const dailyRecords = useAppStore((s) => s.dailyRecords);
  const setSelectedEmployeeDetail = useAppStore((s) => s.setSelectedEmployeeDetail);
  const isLoading = useAppStore((s) => s.dailyRecords.length === 0);
  const filteredDayRecords = getFilteredDayRecords();

  const employeeSummaries = useMemo(() => {
    const summaryMap: Record<string, EmployeeSummary> = {};

    for (const record of filteredDayRecords) {
      if (record.status !== 'Accepted') continue;

      if (!summaryMap[record.employeeUsername]) {
        summaryMap[record.employeeUsername] = {
          username: record.employeeUsername,
          department: record.department ?? 'Unknown',
          totalDays: 0,
          vacationDays: 0,
          vacationPrevYearDays: 0,
          sickDays: 0,
          specialDays: 0,
          absenceCount: 0,
        };
      }

      const summary = summaryMap[record.employeeUsername];
      const days = getDayValue(record.isFullDay);
      summary.totalDays += days;
      summary.absenceCount += 1;

      switch (record.category) {
        case 'Vacation':
          summary.vacationDays += days;
          break;
        case 'VacationPreviousYear':
          summary.vacationPrevYearDays += days;
          break;
        case 'SickLeave':
          summary.sickDays += days;
          break;
        case 'Maternity':
        case 'Special':
          summary.specialDays += days;
          break;
      }
    }

    return Object.values(summaryMap);
  }, [filteredDayRecords]);

  const { sortConfig, handleSort, getSortIndicator } = useSort({ key: 'days', direction: 'desc' });

  const sortedSummaries = useMemo(() => {
    if (!sortConfig) return employeeSummaries;
    const { key, direction } = sortConfig;
    const mult = direction === 'asc' ? 1 : -1;
    return [...employeeSummaries].sort((a, b) => {
      switch (key) {
        case 'employee':
          return a.username.localeCompare(b.username) * mult;
        case 'department':
          return a.department.localeCompare(b.department) * mult;
        case 'days':
          return (a.totalDays - b.totalDays) * mult;
        case 'vacationDays':
          return (a.vacationDays - b.vacationDays) * mult;
        case 'vacationPrevYearDays':
          return (a.vacationPrevYearDays - b.vacationPrevYearDays) * mult;
        case 'sickDays':
          return (a.sickDays - b.sickDays) * mult;
        case 'specialDays':
          return (a.specialDays - b.specialDays) * mult;
        case 'absenceCount':
          return (a.absenceCount - b.absenceCount) * mult;
        default:
          return 0;
      }
    });
  }, [employeeSummaries, sortConfig]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (employeeSummaries.length === 0) {
    return <NoDataState message={t('emptyState')} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50/50">
            <tr>
              <th
                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('employee')}
              >
                {t('employee')}{getSortIndicator('employee')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('department')}
              >
                {tDashboard('colDepartment')}{getSortIndicator('department')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('days')}
              >
                {t('days')}{getSortIndicator('days')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('vacationDays')}
              >
                {tCharts('vacationSeries')}{getSortIndicator('vacationDays')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('vacationPrevYearDays')}
              >
                {tCharts('vacationPrevYearSeries')}{getSortIndicator('vacationPrevYearDays')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('sickDays')}
              >
                {tCharts('sickLeaveSeries')}{getSortIndicator('sickDays')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('specialDays')}
              >
                {tCharts('specialSeries')}{getSortIndicator('specialDays')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('absenceCount')}
              >
                {tDashboard('absences')}{getSortIndicator('absenceCount')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedSummaries.map((summary) => {
              const isUnknown = summary.department === 'Unknown';
              return (
              <tr
                key={summary.username}
                className={`transition-colors cursor-pointer ${isUnknown ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : 'hover:bg-gray-50/50'}`}
                onClick={() => setSelectedEmployeeDetail(summary.username)}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {summary.username}
                </td>
                <td className={`px-4 py-3 text-sm ${isUnknown ? 'text-yellow-700 font-medium' : 'text-gray-500'}`}>
                  {isUnknown ? t('unknown') : summary.department}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                  {summary.totalDays}
                </td>
                <td className="px-4 py-3 text-right text-sm text-orangeBusiness">
                  {summary.vacationDays}
                </td>
                <td className="px-4 py-3 text-right text-sm" style={{ color: '#FFB366' }}>
                  {summary.vacationPrevYearDays}
                </td>
                <td className="px-4 py-3 text-right text-sm text-error">
                  {summary.sickDays}
                </td>
                <td className="px-4 py-3 text-right text-sm text-success">
                  {summary.specialDays}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-500">
                  {summary.absenceCount}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500 text-right">
        {sortedSummaries.length} {tDashboard('employees')}
      </div>
    </div>
  );
}