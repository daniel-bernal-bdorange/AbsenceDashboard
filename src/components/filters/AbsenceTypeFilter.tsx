import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import type { AbsenceCategory } from './filterTypes';
import { chartColors } from '../charts/chartColors';

const CATEGORIES: { key: AbsenceCategory; color: string }[] = [
  { key: 'Vacation', color: chartColors.vacation },
  { key: 'VacationPreviousYear', color: chartColors.vacationPrevYear },
  { key: 'SickLeave', color: chartColors.sickLeave },
  { key: 'Special', color: chartColors.special },
  { key: 'Maternity', color: chartColors.maternity },
];

export function AbsenceTypeFilter() {
  const { t } = useTranslation('charts');
  const { filters, setFilters } = useAppStore();

  const handleToggle = (cat: AbsenceCategory) => {
    const current = filters.categories;
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    setFilters({ categories: next });
  };

  const labelMap: Record<AbsenceCategory, string> = {
    Vacation: t('vacationSeries'),
    VacationPreviousYear: t('vacationPrevYearSeries'),
    SickLeave: t('sickLeaveSeries'),
    Special: t('specialSeries'),
    Maternity: t('maternitySeries'),
  };

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(({ key, color }) => {
        const isActive = filters.categories.includes(key);
        return (
          <button
            key={key}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-transparent text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
            style={isActive ? { backgroundColor: color } : {}}
            onClick={() => handleToggle(key)}
            type="button"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.8)' : color }}
            />
            {labelMap[key]}
          </button>
        );
      })}
    </div>
  );
}