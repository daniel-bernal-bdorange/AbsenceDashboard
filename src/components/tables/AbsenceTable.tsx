import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../common/Badge';
import { NoDataState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { exportCSV } from '../../utils/exportCSV';
import { formatDate } from '../../utils/dateUtils';

export function AbsenceTable() {
  const { t } = useTranslation('table');
  const records = useAppStore((s) => s.records);
  const filters = useAppStore((s) => s.filters);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const isLoading = useAppStore((s) => s.records.length === 0);

  const filteredRecords = useMemo(() => {
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
  }, [records, filters, selectedYear]);

  const handleExport = () => {
    exportCSV(filteredRecords, `ausencias_${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (filteredRecords.length === 0) {
    return <NoDataState message={t('emptyState')} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <span>⬇</span>
          {t('exportCsv')}
        </button>
      </div>

      <div className="max-h-[500px] overflow-y-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('employee')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('type')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('from')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('till')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('days')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('status')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredRecords.map((record) => (
              <tr
                key={record.id}
                className="transition-colors hover:bg-gray-50/50"
              >
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="font-medium">{record.employeeUsername}</div>
                  <div className="text-xs text-gray-400">
                    {record.department ?? 'Unknown'}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <Badge label={record.type} variant="type" />
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatDate(record.from)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatDate(record.till)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  {record.numberOfDays}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge label={record.status} variant="status" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500 text-right">
        {filteredRecords.length} registros
      </div>
    </div>
  );
}