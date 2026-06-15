import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { AbsenceDayRecord } from '../../types';
import { getDayValue } from '../../types';

// Aggregates daily records for a given year into a 12-element array (one per month).
const buildYearData = (records: AbsenceDayRecord[], year: number): number[] => {
  const data = Array(12).fill(0);
  for (const record of records) {
    if (record.status !== 'Accepted') continue;
    if (record.date.getFullYear() !== year) continue;
    data[record.date.getMonth()] += getDayValue(record.isFullDay);
  }
  return data;
};

// Builds a seasonally-adjusted forecast for future months.
// Method: compute the YoY growth ratio from completed months, then apply it to
// each future month's previous-year value. Falls back to a simple average when
// previous-year data is unavailable for a given month.
const buildForecast = (
  currentYearData: number[],
  previousYearData: number[],
  currentMonthIndex: number,
): (number | null)[] => {
  const completedMonths = currentMonthIndex; // months 0..currentMonthIndex-1 have real data
  if (completedMonths === 0) return Array(12).fill(null);

  const currentCompleted = currentYearData.slice(0, completedMonths).reduce((a, b) => a + b, 0);
  const previousCompleted = previousYearData.slice(0, completedMonths).reduce((a, b) => a + b, 0);

  // YoY ratio for the period already elapsed
  const yoyRatio = previousCompleted > 0 ? currentCompleted / previousCompleted : null;
  // Simple monthly average as fallback when no prior-year reference
  const avgPerMonth = currentCompleted / completedMonths;

  return currentYearData.map((_, i) => {
    if (i < completedMonths) return null; // real data covers this month
    if (yoyRatio !== null && previousYearData[i] > 0) {
      return Math.round(previousYearData[i] * yoyRatio * 10) / 10;
    }
    return Math.round(avgPerMonth * 10) / 10;
  });
};

export function TrendLine() {
  const dailyRecords = useAppStore((s) => s.dailyRecords);
  const filters = useAppStore((s) => s.filters);
  const { i18n, t } = useTranslation('charts');

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  // Month index of the current month (0-based). Months 0..currentMonth-1 have real data.
  const currentMonthIndex = new Date().getMonth();

  // Filter only by department, employee and category — year/month are handled internally.
  const baseRecords = useMemo(() => {
    return dailyRecords.filter((dr) => {
      if (filters.departments.length && !filters.departments.includes(dr.department ?? 'Unknown')) return false;
      if (filters.employees.length && !filters.employees.includes(dr.employeeUsername)) return false;
      if (filters.categories.length && !filters.categories.includes(dr.category)) return false;
      return true;
    });
  }, [dailyRecords, filters.departments, filters.employees, filters.categories]);

  const currentYearData = useMemo(() => buildYearData(baseRecords, currentYear), [baseRecords, currentYear]);
  const previousYearData = useMemo(() => buildYearData(baseRecords, previousYear), [baseRecords, previousYear]);
  const forecastData = useMemo(
    () => buildForecast(currentYearData, previousYearData, currentMonthIndex),
    [currentYearData, previousYearData, currentMonthIndex],
  );

  const monthLabels = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'es', { month: 'short' }).format(new Date(2000, i, 1))
    );
  }, [i18n.resolvedLanguage]);

  const option: EChartsOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1A1A1A',
        borderColor: '#FF7900',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: unknown) => {
          const items = params as Array<{ seriesName: string; value: number | null; color: string; marker: string; name: string }>;
          const label = items[0]?.name ?? '';
          const lines = items
            .filter((p) => p.value !== null && p.value !== undefined)
            .map((p) => `${p.marker} ${p.seriesName}: <b>${p.value} ${t('days')}</b>`)
            .join('<br/>');
          return `${label}<br/>${lines}`;
        },
      },
      legend: {
        top: 0,
        itemWidth: 14,
        itemHeight: 3,
        textStyle: { color: '#666666', fontSize: 11 },
      },
      grid: {
        left: 12,
        right: 12,
        bottom: 8,
        top: 36,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: monthLabels,
        axisLine: { lineStyle: { color: '#e5e5e5' } },
        axisTick: { show: false },
        axisLabel: { color: '#666', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f5f5f5' } },
        axisLabel: { color: '#666', fontSize: 11 },
      },
      series: [
        {
          name: t('previousYear'),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#A0A0A0', width: 2 },
          itemStyle: { color: '#A0A0A0', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(160,160,160,0.10)' },
                { offset: 1, color: 'rgba(160,160,160,0.01)' },
              ],
            },
          },
          data: previousYearData,
          z: 1,
        },
        {
          name: t('currentYear'),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#FF7900', width: 3 },
          itemStyle: { color: '#FF7900', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255,121,0,0.15)' },
                { offset: 1, color: 'rgba(255,121,0,0.02)' },
              ],
            },
          },
          data: currentYearData,
          z: 2,
        },
        {
          name: t('projection'),
          type: 'line',
          smooth: true,
          symbol: 'emptyCircle',
          symbolSize: 6,
          lineStyle: { color: '#FF7900', width: 2, type: 'dashed' },
          itemStyle: { color: '#FF7900' },
          // Connect nulls so the dashed line starts right where the real line ends
          connectNulls: false,
          data: forecastData,
          z: 3,
        },
      ],
    };
  }, [currentYearData, previousYearData, forecastData, monthLabels, t]);

  return (
    <div style={{ overflow: 'visible' }}>
      <ReactECharts
        option={option}
        style={{ height: 280, width: '100%' }}
      />
    </div>
  );
}
