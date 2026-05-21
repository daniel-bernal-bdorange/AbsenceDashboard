import { useMemo } from 'react';

import { KPICard } from './KPICard';
import {
  calcAbsenteeismRate,
  calcEmployeesCurrentlyOut,
  calcMostFrequentAbsenceType,
  calcTopEmployee,
  calcTotalAbsenceDays,
} from './kpiCalculations';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';

export function KPIBar() {
  const dailyRecords = useAppStore((s) => s.dailyRecords);
  const { t: tDashboard } = useTranslation('dashboard');

  const kpis = useMemo(() => {
    const totalDays = calcTotalAbsenceDays(dailyRecords);
    const currentlyOut = calcEmployeesCurrentlyOut(dailyRecords);
    const topEmployee = calcTopEmployee(dailyRecords);
    const mostFrequent = calcMostFrequentAbsenceType(dailyRecords);
    const absenteeismRate = calcAbsenteeismRate(dailyRecords);

    const uniqueEmployees = new Set(
      dailyRecords.map((r) => r.employeeUsername),
    ).size;

    return {
      totalDays,
      currentlyOut,
      uniqueEmployees,
      topEmployee,
      mostFrequent,
      absenteeismRate: absenteeismRate.rate,
      absenteeismDelta: 0,
      absenteeismDirection: 'neutral' as const,
    };
  }, [dailyRecords]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title={tDashboard('kpiTotalDays')}
        value={kpis.totalDays.toFixed(1)}
        subtitle={tDashboard('kpiTotalDaysSubtitle')}
      />

      <KPICard
        title={tDashboard('kpiCurrentlyOut')}
        value={kpis.currentlyOut}
        subtitle={tDashboard('kpiCurrentlyOutSubtitle')}
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

      <KPICard
        title={kpis.topEmployee ? tDashboard('kpiTopEmployee') : tDashboard('kpiEmployees')}
        value={kpis.topEmployee ? kpis.topEmployee.username : kpis.uniqueEmployees}
        subtitle={
          kpis.topEmployee
            ? `${kpis.topEmployee.days.toFixed(1)} ${tDashboard('days')}`
            : tDashboard('kpiEmployeesSubtitle')
        }
      />
    </div>
  );
}