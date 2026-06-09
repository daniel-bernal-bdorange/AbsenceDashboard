import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

export function DateRangeFilter() {
  const { t } = useTranslation('filters');
  const { filters, setFilters, records } = useAppStore();

  const { minDate, maxDate } = useMemo(() => {
    if (records.length === 0) return { minDate: '', maxDate: '' };
    
    let min = records[0].from;
    let max = records[0].till;
    
    for (const record of records) {
      if (record.from < min) min = record.from;
      if (record.till > max) max = record.till;
    }
    
    return {
      minDate: min.toISOString().split('T')[0],
      maxDate: max.toISOString().split('T')[0],
    };
  }, [records]);

  return (
    <div className="flex flex-col gap-1.5">
      <input
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-orangeBusiness focus:outline-none"
        placeholder={t('from')}
        type="date"
        min={minDate}
        max={filters.dateRange.to ? filters.dateRange.to.toISOString().split('T')[0] : maxDate}
        value={
          filters.dateRange.from
            ? filters.dateRange.from.toISOString().split('T')[0]
            : ''
        }
        onChange={(e) => {
          const dateStr = e.target.value;
          setFilters({
            dateRange: {
              ...filters.dateRange,
              from: dateStr ? new Date(dateStr + 'T12:00:00') : null,
            },
            selectedMonth: null,
          });
        }}
      />
      <input
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-orangeBusiness focus:outline-none"
        placeholder={t('to')}
        type="date"
        min={filters.dateRange.from ? filters.dateRange.from.toISOString().split('T')[0] : minDate}
        max={maxDate}
        value={
          filters.dateRange.to
            ? filters.dateRange.to.toISOString().split('T')[0]
            : ''
        }
        onChange={(e) => {
          const dateStr = e.target.value;
          setFilters({
            dateRange: {
              ...filters.dateRange,
              to: dateStr ? new Date(dateStr + 'T12:00:00') : null,
            },
            selectedMonth: null,
          });
        }}
      />
    </div>
  );
}