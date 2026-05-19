import { useMemo } from 'react';

import { KPICard } from './KPICard';
import {
  calcAbsenteeismRateComparison,
  calcEmployeesCurrentlyOut,
  calcMostFrequentAbsenceType,
  calcTopEmployee,
  calcTotalAbsenceDays,
} from './kpiCalculations';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';

export function KPIBar() {
  const { records, selectedYear } = useAppStore();
  const { t: tDashboard } = useTranslation('dashboard');

  const kpis = useMemo(() => {
    const totalDays = calcTotalAbsenceDays(records, selectedYear);
    const currentlyOut = calcEmployeesCurrentlyOut(records);
    const topEmployee = calcTopEmployee(records, selectedYear);
    const mostFrequent = calcMostFrequentAbsenceType(records, selectedYear);
    const comparison = calcAbsenteeismRateComparison(records, selectedYear);

    const uniqueEmployees = new Set(
      records
        .filter((r) => r.from.getFullYear() === selectedYear)
        .map((r) => r.employeeUsername),
    ).size;

    return {
      totalDays,
      currentlyOut,
      uniqueEmployees,
      topEmployee,
      mostFrequent,
      absenteeismRate: comparison.rate,
      absenteeismDelta: comparison.delta,
      absenteeismDirection: comparison.direction,
    };
  }, [records, selectedYear]);

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