import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { Department } from './filterTypes';

const DEPARTMENTS: Department[] = ['Prod', 'BackOffice'];

export function DepartmentFilter() {
  const { t } = useTranslation('filters');
  const { filters, setFilters } = useAppStore();

  const handleToggle = (dept: Department) => {
    const current = filters.departments;
    const next = current.includes(dept)
      ? current.filter((d) => d !== dept)
      : [...current, dept];
    setFilters({ departments: next });
  };

  return (
    <div className="flex gap-2">
      {DEPARTMENTS.map((dept) => {
        const isActive = filters.departments.includes(dept);
        return (
          <button
            key={dept}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-orangeBusiness bg-orangeBusiness text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-orangeBusiness hover:text-orangeBusiness'
            }`}
            onClick={() => handleToggle(dept)}
            type="button"
          >
            {dept === 'Prod' ? t('prod') : t('backOffice')}
          </button>
        );
      })}
    </div>
  );
}