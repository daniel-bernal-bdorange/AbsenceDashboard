import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useTranslation } from '../i18n/useTranslation';
import { chartColors } from './charts/chartColors';

type OverviewChartProps = {
  year: number;
  vacationData: number[];
  sickLeaveData: number[];
  specialLeaveData: number[];
};

const monthLabels = (language: string, year: number) =>
  Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat(language, { month: 'short' }).format(new Date(year, index, 1)),
  );

export function OverviewChart({
  year,
  vacationData,
  sickLeaveData,
  specialLeaveData,
}: OverviewChartProps) {
  const { i18n, t } = useTranslation('charts');

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
        data: vacationData,
      },
      {
        name: t('sickLeaveSeries'),
        type: 'bar',
        stack: 'absences',
        barWidth: 20,
        emphasis: { focus: 'series' },
        data: sickLeaveData,
      },
      {
        name: t('specialSeries'),
        type: 'bar',
        stack: 'absences',
        barWidth: 20,
        emphasis: { focus: 'series' },
        data: specialLeaveData,
      },
    ],
  };

  return (
    <div style={{ overflow: 'visible' }}>
      <ReactECharts option={option} style={{ height: 320, width: '100%' }} />
    </div>
  );
}