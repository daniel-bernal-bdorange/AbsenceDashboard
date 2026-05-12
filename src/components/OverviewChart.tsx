import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useTranslation } from '../i18n/useTranslation';

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
    color: ['#ff6600', '#c62828', '#0277bd'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      top: 0,
      textStyle: {
        color: '#333333',
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
      axisLine: { lineStyle: { color: '#d6c6bb' } },
      axisTick: { show: false },
      axisLabel: { color: '#666666' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0e4da' } },
      axisLabel: { color: '#666666' },
    },
    series: [
      {
        name: t('vacationSeries'),
        type: 'bar',
        stack: 'absences',
        barWidth: 18,
        emphasis: { focus: 'series' },
        data: vacationData,
      },
      {
        name: t('sickLeaveSeries'),
        type: 'bar',
        stack: 'absences',
        barWidth: 18,
        emphasis: { focus: 'series' },
        data: sickLeaveData,
      },
      {
        name: t('specialSeries'),
        type: 'bar',
        stack: 'absences',
        barWidth: 18,
        emphasis: { focus: 'series' },
        data: specialLeaveData,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 360, width: '100%' }} />;
}
