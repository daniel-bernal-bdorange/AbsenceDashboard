import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { chartColors } from './charts/chartColors';

type OverviewChartProps = {
  year: number;
};

const monthLabels = (language: string, year: number) =>
  Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat(language, { month: 'short' }).format(new Date(year, index, 1)),
  );

const buildMonthlySeries = (records: ReturnType<typeof useAppStore.getState>['records'], year: number) => {
  const vacationData = Array(12).fill(0);
  const sickLeaveData = Array(12).fill(0);
  const specialLeaveData = Array(12).fill(0);

  for (const record of records) {
    if (record.from.getFullYear() !== year) continue;
    if (record.status !== 'Accepted') continue;

    const monthIndex = record.from.getMonth();
    const days = record.numberOfDays;

    switch (record.category) {
      case 'Vacation':
        vacationData[monthIndex] += days;
        break;
      case 'SickLeave':
        sickLeaveData[monthIndex] += days;
        break;
      case 'Maternity':
      case 'Special':
        specialLeaveData[monthIndex] += days;
        break;
    }
  }

  return { vacationData, sickLeaveData, specialLeaveData };
};

export function OverviewChart({ year }: OverviewChartProps) {
  const { i18n, t } = useTranslation('charts');
  const records = useAppStore((s) => s.records);
  const filters = useAppStore((s) => s.filters);
  const selectedYear = useAppStore((s) => s.selectedYear);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.from.getFullYear() !== selectedYear) return false;
      if (filters.departments.length && !filters.departments.includes(r.department ?? 'Unknown')) return false;
      if (filters.employees.length && !filters.employees.includes(r.employeeUsername)) return false;
      if (filters.categories.length && !filters.categories.includes(r.category)) return false;
      if (filters.dateRange.from && r.from < filters.dateRange.from) return false;
      if (filters.dateRange.to && r.till > filters.dateRange.to) return false;
      return true;
    });
  }, [records, filters, selectedYear]);

  const monthlySeries = useMemo(
    () => buildMonthlySeries(filteredRecords, year),
    [filteredRecords, year],
  );

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    color: [chartColors.vacation, chartColors.sickLeave, chartColors.special],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: '#1A1A1A',
      borderColor: '#FF7900',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 12 },
    },
    legend: {
      top: 0,
      itemWidth: 14,
      itemHeight: 3,
      textStyle: {
        color: '#666666',
        fontSize: 11,
      },
    },
    grid: {
      left: 8,
      right: 8,
      bottom: 0,
      top: 44,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: monthLabels(i18n.resolvedLanguage ?? 'es', year),
      axisLine: { lineStyle: { color: '#e5e5e5' } },
      axisTick: { show: false },
      axisLabel: { color: '#666666', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f5f5f5' } },
      axisLabel: { color: '#666666', fontSize: 11 },
    },
    series: [
      {
        name: t('vacationSeries'),
        type: 'bar',
        stack: 'absences',
        barWidth: 20,
        emphasis: { focus: 'series' },
        data: monthlySeries.vacationData,
      },
      {
        name: t('sickLeaveSeries'),
        type: 'bar',
        stack: 'absences',
        barWidth: 20,
        emphasis: { focus: 'series' },
        data: monthlySeries.sickLeaveData,
      },
      {
        name: t('specialSeries'),
        type: 'bar',
        stack: 'absences',
        barWidth: 20,
        emphasis: { focus: 'series' },
        data: monthlySeries.specialLeaveData,
      },
    ],
  };

  return (
    <div style={{ overflow: 'visible' }}>
      <ReactECharts option={option} style={{ height: 320, width: '100%' }} />
    </div>
  );
}