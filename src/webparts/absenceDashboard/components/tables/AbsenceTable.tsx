import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../common/Badge';
import { NoDataState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { exportCSV } from '../../utils/exportCSV';
import { formatDate } from '../../utils/dateUtils';
import { filterDayRecords } from '../../utils/filterDayRecords';
import { useSort } from '../../hooks/useSort';

export function AbsenceTable() {
  const { t } = useTranslation('table');
  const { t: tDashboard, i18n } = useTranslation('dashboard');
  const dailyRecords = useAppStore((s) => s.dailyRecords);
  const records = useAppStore((s) => s.records);
  const filters = useAppStore((s) => s.filters);
  const isLoading = useAppStore((s) => s.records.length === 0);

  const regularizedLabel = (delta: number): string => {
    const language = i18n.resolvedLanguage ?? i18n.language;
    const deltaText = delta > 0 ? `+${delta}` : `${delta}`;

    if (language?.startsWith('es')) {
      return `Regularizado (${deltaText} días)`;
    }

    return `Regularized (${deltaText} days)`;
  };

  const filteredRecords = useMemo(() => {
    const matchingIds = new Set(
      filterDayRecords(dailyRecords, filters).map((dr) => dr.originalAbsenceId),
    );
    return records.filter((r) => matchingIds.has(r.id));
  }, [dailyRecords, records, filters]);

  const { sortConfig, handleSort, getSortIndicator } = useSort();

  const sortedRecords = useMemo(() => {
    if (!sortConfig) return filteredRecords;
    const { key, direction } = sortConfig;
    const mult = direction === 'asc' ? 1 : -1;
    return [...filteredRecords].sort((a, b) => {
      switch (key) {
        case 'employee':
          return a.employeeUsername.localeCompare(b.employeeUsername) * mult;
        case 'type':
          return a.type.localeCompare(b.type) * mult;
        case 'from':
          return (a.from.getTime() - b.from.getTime()) * mult;
        case 'till':
          return (a.till.getTime() - b.till.getTime()) * mult;
        case 'days':
          return (a.numberOfDays - b.numberOfDays) * mult;
        case 'status':
          return a.status.localeCompare(b.status) * mult;
        default:
          return 0;
      }
    });
  }, [filteredRecords, sortConfig]);

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
              <th
                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('employee')}
              >
                {t('employee')}{getSortIndicator('employee')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('type')}
              >
                {t('type')}{getSortIndicator('type')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('from')}
              >
                {t('from')}{getSortIndicator('from')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('till')}
              >
                {t('till')}{getSortIndicator('till')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('days')}
              >
                {t('days')}{getSortIndicator('days')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
                onClick={() => handleSort('status')}
              >
                {t('status')}{getSortIndicator('status')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedRecords.map((record) => {
              const regularizedDelta = record.regularizedDelta ?? 0;

              return (
                <tr
                  key={record.id}
                  className={`transition-colors hover:bg-gray-50/50 ${record.regularized ? 'bg-amber-50/40' : ''}`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2 font-medium">
                      <span>{record.employeeUsername}</span>
                      {record.regularized && (
                        <Badge
                          label={regularizedLabel(regularizedDelta)}
                          variant="regularized"
                        />
                      )}
                    </div>
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
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500 text-right">
        {sortedRecords.length} {tDashboard('records')}
      </div>
    </div>
  );
}