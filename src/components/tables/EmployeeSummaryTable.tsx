import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { NoDataState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface EmployeeSummary {
  username: string;
  department: string;
  totalDays: number;
  vacationDays: number;
  sickDays: number;
  specialDays: number;
  absenceCount: number;
}

export function EmployeeSummaryTable() {
  const { t } = useTranslation('table');
  const records = useAppStore((s) => s.records);
  const setSelectedEmployeeDetail = useAppStore((s) => s.setSelectedEmployeeDetail);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const isLoading = useAppStore((s) => s.records.length === 0);

  const employeeSummaries = useMemo(() => {
    const summaryMap: Record<string, EmployeeSummary> = {};

    for (const record of records) {
      if (record.from.getFullYear() !== selectedYear) continue;
      if (record.status !== 'Accepted') continue;

      if (!summaryMap[record.employeeUsername]) {
        summaryMap[record.employeeUsername] = {
          username: record.employeeUsername,
          department: record.department ?? 'Unknown',
          totalDays: 0,
          vacationDays: 0,
          sickDays: 0,
          specialDays: 0,
          absenceCount: 0,
        };
      }

      const summary = summaryMap[record.employeeUsername];
      summary.totalDays += record.numberOfDays;
      summary.absenceCount += 1;

      switch (record.category) {
        case 'Vacation':
          summary.vacationDays += record.numberOfDays;
          break;
        case 'SickLeave':
          summary.sickDays += record.numberOfDays;
          break;
        case 'Maternity':
        case 'Special':
          summary.specialDays += record.numberOfDays;
          break;
      }
    }

    return Object.values(summaryMap).sort((a, b) => b.totalDays - a.totalDays);
  }, [records, selectedYear]);

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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('employee')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                Dept.
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('days')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Vacaciones
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Baja
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Especial
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Ausencias
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {employeeSummaries.map((summary) => {
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
        {employeeSummaries.length} empleados
      </div>
    </div>
  );
}