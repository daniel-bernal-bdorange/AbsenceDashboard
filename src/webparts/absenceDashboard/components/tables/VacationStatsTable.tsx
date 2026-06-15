import * as React from 'react';
import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { NoDataState } from '../common/EmptyState';
import { useSort } from '../../hooks/useSort';

interface VacationRow {
  code: string;
  username: string;
  department: string;
  entitlementY: number;
  requestedY: number;
  usedY: number;
  remainingY: number;
  entitlementPrev: number;
  usedPrev: number;
  usedCarryover: number;
  remainingPrev: number;
  expiredPrev: boolean;
}

const currentYear = new Date().getFullYear();
const prevYear = currentYear - 1;

export function VacationStatsTable(): React.ReactElement {
  const { t } = useTranslation('dashboard');
  const vacationStats = useAppStore((s) => s.vacationStats);
  const records = useAppStore((s) => s.records);
  const filters = useAppStore((s) => s.filters);
  const getFilteredRecords = useAppStore((s) => s.getFilteredRecords);
  const setSelectedEmployeeDetail = useAppStore((s) => s.setSelectedEmployeeDetail);

  // Usernames visible after applying active filters
  const filteredUsernames = useMemo(() => {
    const filtered = getFilteredRecords();
    return new Set(filtered.map((r) => (r.employeeUsername ?? r.employeeCode).toLowerCase()));
  }, [getFilteredRecords, filters]);

  // Build code → { username, department } map from records (same source as other tables)
  const infoByCode = useMemo(() => {
    const map = new Map<string, { username: string; department: string }>();
    for (const r of records) {
      if (r.employeeCode && !map.has(r.employeeCode.toLowerCase())) {
        map.set(r.employeeCode.toLowerCase(), {
          username: r.employeeUsername ?? r.employeeCode,
          department: r.department ?? 'Unknown',
        });
      }
    }
    return map;
  }, [records]);

  const rows = useMemo<VacationRow[]>(() => {
    // Merge rows that share the same username (same employee under different codes).
    const merged = new Map<string, VacationRow>();

    for (const [code, stats] of Object.entries(vacationStats)) {
      const info = infoByCode.get(code);
      const username = info?.username ?? code;

      // Respect active filters — skip employees not in the filtered set
      if (filteredUsernames.size > 0 && !filteredUsernames.has(username.toLowerCase())) continue;
      const existing = merged.get(username);

      if (existing) {
        existing.entitlementY = Math.max(existing.entitlementY, stats.entitlementY);
        existing.requestedY += stats.requestedY;
        existing.usedY += stats.usedY;
        existing.usedPrev += stats.usedPrev;
        existing.usedCarryover += stats.usedCarryover;
        existing.entitlementPrev = Math.max(existing.entitlementPrev, stats.entitlementPrev);
        // Recalculate from merged totals — do NOT sum remainingPrev directly
        // (two codes for the same person would double-count the entitlement).
        existing.remainingPrev = existing.entitlementPrev - existing.usedPrev - existing.usedCarryover;
        existing.remainingY = existing.entitlementY - existing.requestedY;
        // Recalculate from merged remainingPrev — individual flags may be stale.
        existing.expiredPrev = existing.remainingPrev > 0;
      } else {
        merged.set(username, {
          code,
          username,
          department: info?.department ?? 'Unknown',
          ...stats,
        });
      }
    }

    return Array.from(merged.values());
  }, [vacationStats, infoByCode, filteredUsernames]);

  const { sortConfig, handleSort, getSortIndicator } = useSort({ key: 'employee', direction: 'asc' });

  const sorted = useMemo(() => {
    if (!sortConfig) return rows;
    const { key, direction } = sortConfig;
    const mult = direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (key) {
        case 'employee': return a.username.localeCompare(b.username) * mult;
        case 'department': return a.department.localeCompare(b.department) * mult;
        case 'entitlementY': return (a.entitlementY - b.entitlementY) * mult;
        case 'requestedY': return (a.requestedY - b.requestedY) * mult;
        case 'usedY': return (a.usedY - b.usedY) * mult;
        case 'remainingY': return (a.remainingY - b.remainingY) * mult;
        case 'remainingPrev': return (a.remainingPrev - b.remainingPrev) * mult;
        default: return 0;
      }
    });
  }, [rows, sortConfig]);

  if (rows.length === 0) {
    return <NoDataState message={t('vacationNoData')} />;
  }

  const thClass =
    'cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600';
  const thRightClass = thClass + ' text-right';

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-700">
        {t('vacationTitle', { currentYear, prevYear })}
      </h3>
      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50/50">
            <tr>
              <th className={thClass} onClick={() => handleSort('employee')}>
                {t('kpiEmployees')}{getSortIndicator('employee')}
              </th>
              <th className={thClass} onClick={() => handleSort('department')}>
                {t('colDepartment')}{getSortIndicator('department')}
              </th>
              <th className={thRightClass} onClick={() => handleSort('entitlementY')}>
                {t('vacationEntitlement')} {currentYear}{getSortIndicator('entitlementY')}
              </th>
              <th className={thRightClass} onClick={() => handleSort('requestedY')}>
                {t('vacationRequested')} {currentYear}{getSortIndicator('requestedY')}
              </th>
              <th className={thRightClass} onClick={() => handleSort('usedY')}>
                {t('vacationUsedYear', { year: currentYear })}{getSortIndicator('usedY')}
              </th>
              <th className={thRightClass} onClick={() => handleSort('remainingPrev')}>
                {t('vacationRemainingYear', { year: prevYear })}{getSortIndicator('remainingPrev')}
              </th>
              <th className={thClass}>{t('vacationStatusYear', { year: prevYear })}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.code}
                className="border-b border-gray-50 hover:bg-orange-50/40 transition-colors cursor-pointer"
                onClick={() => setSelectedEmployeeDetail(row.username)}
              >
                <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{row.username}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{row.department}</td>
                <td className="px-4 py-2.5 text-right text-sm text-gray-700">{row.entitlementY}</td>
                <td className="px-4 py-2.5 text-right text-sm text-gray-700">{row.requestedY}</td>
                <td className="px-4 py-2.5 text-right text-sm text-gray-700">{row.usedY}</td>
                <td className="px-4 py-2.5 text-right text-sm text-gray-700">
                  {row.remainingPrev > 0 ? row.remainingPrev : 0}
                </td>
                <td className="px-4 py-2.5">
                  {row.expiredPrev ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      ⚠ {row.remainingPrev}d {t('vacationExpired')}
                    </span>
                  ) : row.remainingPrev <= 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      ✓ {t('vacationConsumed')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {row.remainingPrev}d {t('vacationPending')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
