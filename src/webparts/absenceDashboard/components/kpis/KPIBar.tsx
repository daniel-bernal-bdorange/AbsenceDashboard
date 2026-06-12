import { useCallback, useMemo } from 'react';

import { KPICard } from './KPICard';
import {
  calcAbsenteeismRate,
  calcCurrentlyOutUsernames,
  calcEmployeesCurrentlyOut,
  calcMostFrequentAbsenceType,
  calcTotalAbsenceDays,
} from './kpiCalculations';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';

export function KPIBar() {
  const dailyRecords = useAppStore((s) => s.getFilteredDayRecords());
  const setFilters = useAppStore((s) => s.setFilters);
  const filters = useAppStore((s) => s.filters);
  const { t: tDashboard } = useTranslation('dashboard');

  const handleCurrentlyOutClick = useCallback(() => {
    const usernames = calcCurrentlyOutUsernames(dailyRecords);
    if (usernames.length === 0) return;
    // Toggle: if already filtering by these exact employees, reset
    const isSameFilter =
      filters.employees.length === usernames.length &&
      usernames.every((u) => filters.employees.includes(u));
    setFilters({ employees: isSameFilter ? [] : usernames });
  }, [dailyRecords, filters.employees, setFilters]);

  const kpis = useMemo(() => {
    const totalDays = calcTotalAbsenceDays(dailyRecords);
    const currentlyOut = calcEmployeesCurrentlyOut(dailyRecords);
    const mostFrequent = calcMostFrequentAbsenceType(dailyRecords);
    const absenteeismRate = calcAbsenteeismRate(dailyRecords);

    return {
      totalDays,
      currentlyOut,
      mostFrequent,
      absenteeismRate: absenteeismRate.rate,
      absenteeismDelta: 0,
      absenteeismDirection: 'neutral' as const,
    };
  }, [dailyRecords]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KPICard
        title={tDashboard('kpiTotalDays')}
        value={kpis.totalDays.toFixed(1)}
        subtitle={tDashboard('kpiTotalDaysSubtitle')}
      />

      <KPICard
        title={tDashboard('kpiCurrentlyOut')}
        value={kpis.currentlyOut}
        subtitle={tDashboard('kpiCurrentlyOutSubtitle')}
        onClick={handleCurrentlyOutClick}
      />

      <KPICard
        title={tDashboard('kpiAbsenteeismRate')}
        value={`${kpis.absenteeismRate.toFixed(1)}%`}
        trend={
          kpis.absenteeismDelta !== 0
            ? {
                value: Math.abs(kpis.absenteeismDelta),
                direction: kpis.absenteeismDirection,
              }
            : undefined
        }
        subtitle={tDashboard('kpiAbsenteeismRateSubtitle')}
      />
    </div>
  );
}