import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { AbsenceStatus } from '../../types';
import type { TranslationKey } from '../../i18n/TranslationKeys';

const STATUS_COLORS: Record<AbsenceStatus, string> = {
  [AbsenceStatus.ACCEPTED]: '#16a34a',
  [AbsenceStatus.REFUSED]: '#dc2626',
  [AbsenceStatus.CANCELED]: '#6b7280',
  [AbsenceStatus.CANCELLATION]: '#9ca3af',
  [AbsenceStatus.RUNNING]: '#2563eb',
  [AbsenceStatus.EMPLOYEE_VALIDATION]: '#d97706',
  [AbsenceStatus.HR_VALIDATION]: '#7c3aed',
};

const ALL_STATUSES = Object.values(AbsenceStatus);

export function StatusFilter() {
  const { t } = useTranslation('filters');
  const { filters, setFilters } = useAppStore();

  const handleToggle = (status: AbsenceStatus) => {
    const current = filters.statuses;
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    setFilters({ statuses: next });
  };

  const labelKey: Record<AbsenceStatus, TranslationKey<'filters'>> = {
    [AbsenceStatus.ACCEPTED]: 'statusAccepted',
    [AbsenceStatus.REFUSED]: 'statusRefused',
    [AbsenceStatus.CANCELED]: 'statusCanceled',
    [AbsenceStatus.CANCELLATION]: 'statusCancellation',
    [AbsenceStatus.RUNNING]: 'statusRunning',
    [AbsenceStatus.EMPLOYEE_VALIDATION]: 'statusEmployeeValidation',
    [AbsenceStatus.HR_VALIDATION]: 'statusHrValidation',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_STATUSES.map((status) => {
        const isActive = filters.statuses.includes(status);
        const color = STATUS_COLORS[status];
        return (
          <button
            key={status}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-transparent text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
            style={isActive ? { backgroundColor: color } : {}}
            onClick={() => handleToggle(status)}
            type="button"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.8)' : color }}
            />
            {t(labelKey[status])}
          </button>
        );
      })}
    </div>
  );
}
