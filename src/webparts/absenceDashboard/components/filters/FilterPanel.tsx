import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { DepartmentFilter } from './DepartmentFilter';
import { AbsenceTypeFilter } from './AbsenceTypeFilter';
import { EmployeeFilter } from './EmployeeFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { StatusFilter } from './StatusFilter';

export function FilterPanel() {
  const { t } = useTranslation('filters');
  const { filters, resetFilters } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fixedRectRef = useRef<DOMRect | null>(null);

  const currentYear = new Date().getFullYear();
  const activeCount =
    filters.departments.length +
    filters.employees.length +
    filters.categories.length +
    filters.statuses.length +
    (filters.selectedYears.length !== 1 || filters.selectedYears[0] !== currentYear ? 1 : 0) +
    (filters.selectedMonths.length !== 12 ? 1 : 0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const past = !entry.isIntersecting;
        if (past) {
          const el = panelRef.current;
          if (el) fixedRectRef.current = el.getBoundingClientRect();
        } else {
          fixedRectRef.current = null;
          setManualOverride(false);
        }
        setIsFixed(past);
        setAutoCollapsed(past);
      },
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const handleToggle = () => {
    if (autoCollapsed) {
      setManualOverride((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  const isVisible = manualOverride || (!autoCollapsed && !collapsed);
  const rect = fixedRectRef.current;

  return (
    <>
      <div ref={sentinelRef} />
      {isFixed && rect && <div style={{ height: rect.height }} />}
      <div
        ref={panelRef}
        className={`rounded-xl border bg-white transition-shadow ${
          isFixed ? 'shadow-lg border-gray-200' : 'border-gray-200'
        }`}
        style={
          isFixed && rect
            ? { position: 'fixed', top: 60, left: rect.left, width: rect.width, zIndex: 40 }
            : undefined
        }
      >
        <button
          className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
          onClick={handleToggle}
          type="button"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">{t('title')}</span>
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
            <span
              className="text-gray-400 transition-transform duration-200"
              style={{ transform: isVisible ? 'rotate(0deg)' : 'rotate(180deg)' }}
            >
              ▼
            </span>
          </div>
        </button>

        <div
          className="border-t border-gray-100 transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isVisible ? '500px' : '0',
            opacity: isVisible ? 1 : 0,
            pointerEvents: isVisible ? 'auto' : 'none',
          }}
        >
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {t('department')}
                </label>
                <DepartmentFilter />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {t('type')}
                </label>
                <AbsenceTypeFilter />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {t('employee')}
                </label>
                <EmployeeFilter />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {t('dates')}
                </label>
                <DateRangeFilter />
              </div>
              <div className="flex flex-col gap-2 col-span-2 lg:col-span-3 xl:col-span-1">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {t('status')}
                </label>
                <StatusFilter />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
