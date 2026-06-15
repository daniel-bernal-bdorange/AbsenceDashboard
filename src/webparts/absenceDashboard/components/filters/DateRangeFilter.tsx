import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { ALL_MONTHS } from './filterTypes';

export function DateRangeFilter() {
  const { t, i18n } = useTranslation('filters');
  const { filters, setFilters, records } = useAppStore();

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>();
    for (const r of records) {
      years.add(r.from.getFullYear());
      years.add(r.till.getFullYear());
    }
    // Always include current year and the previous one (needed for vacation carry-over)
    years.add(currentYear);
    years.add(currentYear - 1);
    return Array.from(years).sort((a, b) => a - b);
  }, [records]);

  const monthLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'es', { month: 'short' }).format(
          new Date(2000, i, 1),
        ),
      ),
    [i18n.resolvedLanguage],
  );

  const toggleYear = (year: number) => {
    const next = filters.selectedYears.includes(year)
      ? filters.selectedYears.filter((y) => y !== year)
      : [...filters.selectedYears, year].sort((a, b) => a - b);
    setFilters({ selectedYears: next.length > 0 ? next : [year] });
  };

  const toggleMonth = (month: number) => {
    const next = filters.selectedMonths.includes(month)
      ? filters.selectedMonths.filter((m) => m !== month)
      : [...filters.selectedMonths, month].sort((a, b) => a - b);
    setFilters({ selectedMonths: next.length > 0 ? next : ALL_MONTHS });
  };

  const allMonthsSelected = filters.selectedMonths.length === 12;

  const toggleAllMonths = () => {
    setFilters({ selectedMonths: allMonthsSelected ? [new Date().getMonth()] : ALL_MONTHS });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Year toggles */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {t('yearLabel')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => toggleYear(year)}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${
                filters.selectedYears.includes(year)
                  ? 'bg-orangeBusiness text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-orangeBusiness hover:text-orangeBusiness'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Month pills */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {t('monthLabel')}
          </span>
          <button
            onClick={toggleAllMonths}
            className="text-[10px] font-medium text-orangeBusiness hover:underline"
          >
            {allMonthsSelected ? t('monthNone') : t('monthAll')}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {monthLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => toggleMonth(i)}
              className={`rounded-md px-1 py-1 text-[11px] font-medium capitalize transition-colors ${
                filters.selectedMonths.includes(i)
                  ? 'bg-orangeBusiness text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-orangeBusiness hover:text-orangeBusiness'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}