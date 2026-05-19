import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { DepartmentFilter } from './DepartmentFilter';
import { AbsenceTypeFilter } from './AbsenceTypeFilter';
import { EmployeeFilter } from './EmployeeFilter';
import { DateRangeFilter } from './DateRangeFilter';

export function FilterPanel() {
  const { t } = useTranslation('filters');
  const { filters, resetFilters } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  const activeCount =
    filters.departments.length +
    filters.employees.length +
    filters.categories.length +
    (filters.dateRange.from ? 1 : 0) +
    (filters.dateRange.to ? 1 : 0) +
    (filters.selectedMonth !== null ? 1 : 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
        type="button"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Filtros</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orangeBusiness text-xs font-medium text-white">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span
              className="text-xs text-gray-400 hover:text-orangeBusiness transition-colors px-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                resetFilters();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  resetFilters();
                }
              }}
            >
              {t('clear')}
            </span>
          )}
          <span className="text-gray-400 transition-transform duration-200" style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Dept.
              </label>
              <DepartmentFilter />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Tipo
              </label>
              <AbsenceTypeFilter />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Empleado
              </label>
              <EmployeeFilter />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Fechas
              </label>
              <DateRangeFilter />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}