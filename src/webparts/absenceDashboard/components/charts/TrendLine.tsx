import { useMemo, useCallback } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { AbsenceDayRecord } from '../../types';
import { getDayValue } from '../../types';

interface MonthlyData {
  series: number[];
}

const buildMonthlyData = (dailyRecords: AbsenceDayRecord[]): MonthlyData => {
  const series = Array(12).fill(0);
  
  for (const record of dailyRecords) {
    if (record.status !== 'Accepted') continue;
    const month = record.date.getMonth();
    series[month] += getDayValue(record.isFullDay);
  }
  
  return { series };
};

export function TrendLine() {
  const dailyRecords = useAppStore((s) => s.dailyRecords);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const { i18n, t } = useTranslation('charts');

  const handleChartClick = useCallback((params: unknown) => {
    const p = params as { dataIndex?: number; seriesIndex?: number; componentType?: string; };

    if ((p.componentType === 'xAxis' || p.componentType === 'axisLabel') && p.dataIndex !== undefined) {
      const month = p.dataIndex;
      const isMonthSelected = filters.selectedMonths.length === 1 && filters.selectedMonths[0] === month;
      if (isMonthSelected) {
        setFilters({ selectedMonths: [0,1,2,3,4,5,6,7,8,9,10,11] });
      }
      return;
    }
  }, [filters.selectedMonths, setFilters]);

  const onEvents = {
  click: handleChartClick
};

  const filteredDayRecords = useMemo(() => {
    return dailyRecords.filter((dr) => {
      if (filters.departments.length && !filters.departments.includes(dr.department ?? 'Unknown')) return false;
      if (filters.employees.length && !filters.employees.includes(dr.employeeUsername)) return false;
      if (filters.categories.length && !filters.categories.includes(dr.category)) return false;
      if (filters.selectedYears.length > 0 && !filters.selectedYears.includes(dr.date.getFullYear())) return false;
      if (filters.selectedMonths.length > 0 && !filters.selectedMonths.includes(dr.date.getMonth())) return false;
      return true;
    });
  }, [dailyRecords, filters]);

  const monthlyData = useMemo(() => buildMonthlyData(filteredDayRecords), [filteredDayRecords]);
  
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
      },
      grid: {
        left: 12,
        right: 12,
        bottom: 8,
        top: 16,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: monthLabels,
        triggerEvent: true,
        axisLine: { lineStyle: { color: '#e5e5e5' } },
        axisTick: { show: false },
        axisLabel: { color: '#666', fontSize: 11, triggerEvent: true },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f5f5f5' } },
        axisLabel: { color: '#666', fontSize: 11 },
      },
      series: [
        {
          name: t('totalAbsences'),
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
          data: monthlyData.series,
          z: 2,
        },
      ],
    };
  }, [monthlyData, monthLabels, t]);

  return (
    <div style={{ overflow: 'visible' }}>
      <ReactECharts 
        option={option} 
        style={{ height: 280, width: '100%' }}
        onEvents={onEvents}
      />
    </div>
  );
}