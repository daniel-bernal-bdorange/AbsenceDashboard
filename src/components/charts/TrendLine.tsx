import { useMemo, useCallback } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { AbsenceDayRecord } from '../../types';
import { getDayValue } from '../../types';

interface TrendLineProps {
  year: number;
}

interface MonthlyData {
  currentYear: number[];
  previousYear: number[];
}

const buildMonthlyData = (dailyRecords: AbsenceDayRecord[], year: number): MonthlyData => {
  const currentYear = Array(12).fill(0);
  const previousYear = Array(12).fill(0);
  
  for (const record of dailyRecords) {
    if (record.status !== 'Accepted') continue;
    const recordYear = record.date.getFullYear();
    const month = record.date.getMonth();
    const days = getDayValue(record.isFullDay);
    
    if (recordYear === year) {
      currentYear[month] += days;
    } else if (recordYear === year - 1) {
      previousYear[month] += days;
    }
  }
  
  return { currentYear, previousYear };
};

const getHistoricalAverage = (data: number[], upToMonth: number): number => {
  if (upToMonth <= 0) return 0;
  const sum = data.slice(0, upToMonth).reduce((a, b) => a + b, 0);
  return sum / upToMonth;
};

export function TrendLine({ year }: TrendLineProps) {
  const dailyRecords = useAppStore((s) => s.dailyRecords);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const { i18n, t } = useTranslation('charts');

  const handleChartClick = useCallback((params: unknown) => {
    const p = params as { dataIndex?: number; seriesIndex?: number; componentType?: string; seriesName?: string };

    if ((p.componentType === 'xAxis' || p.componentType === 'axisLabel') && p.dataIndex !== undefined) {
      const month = p.dataIndex;
      const fromDate = new Date(year, month, 1);
      const toDate = new Date(year, month + 1, 0);

      if (filters.selectedMonth === month) {
        setFilters({ selectedMonth: null, dateRange: { from: null, to: null } });
      } else {
        setFilters({ 
          selectedMonth: month,
          dateRange: { from: fromDate, to: toDate }
        });
      }
      return;
    }

    if (p.dataIndex !== undefined && p.seriesIndex !== undefined) {
      const month = p.dataIndex;
      const seriesName = p.seriesName;
      const targetYear = seriesName === t('previousYear') ? year - 1 : year;
      
      const fromDate = new Date(targetYear, month, 1);
      const toDate = new Date(targetYear, month + 1, 0);

      if (filters.selectedMonth === month && filters.dateRange.from?.getFullYear() === targetYear) {
        setFilters({ selectedMonth: null, dateRange: { from: null, to: null } });
      } else {
        setFilters({ 
          selectedMonth: month,
          dateRange: { from: fromDate, to: toDate }
        });
      }
    }
  }, [filters.selectedMonth, filters.dateRange, setFilters, year, t]);

  const onEvents = {
  click: handleChartClick
};

  const filteredDayRecords = useMemo(() => {
    return dailyRecords.filter((dr) => {
      if (filters.departments.length && !filters.departments.includes(dr.department ?? 'Unknown')) return false;
      if (filters.employees.length && !filters.employees.includes(dr.employeeUsername)) return false;
      if (filters.categories.length && !filters.categories.includes(dr.category)) return false;
      if (filters.dateRange.from) {
        const from = new Date(filters.dateRange.from);
        from.setHours(0, 0, 0, 0);
        if (dr.date < from) return false;
      }
      if (filters.dateRange.to) {
        const to = new Date(filters.dateRange.to);
        to.setHours(0, 0, 0, 0);
        if (dr.date > to) return false;
      }
      if (filters.selectedMonth !== null && dr.date.getMonth() !== filters.selectedMonth) return false;
      return true;
    });
  }, [dailyRecords, filters]);

  const monthlyData = useMemo(() => buildMonthlyData(filteredDayRecords, year), [filteredDayRecords, year]);
  
  const monthLabels = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'es', { month: 'short' }).format(new Date(year, i, 1))
    );
  }, [i18n.resolvedLanguage, year]);

  const projectionData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYearMonth = new Date().getFullYear() === year ? currentMonth : 11;
    
    return monthlyData.currentYear.map((_, idx) => {
      if (idx <= currentYearMonth) return null;
      return getHistoricalAverage(monthlyData.previousYear, idx);
    });
  }, [monthlyData, year]);

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
          const items = params as Array<{ name: string; seriesName: string; value: number }>;
          if (!items?.length) return '';
          
          const month = items[0]?.name ?? '';
          const current = items.find((p) => p.seriesName === t('currentYear'))?.value ?? 0;
          const previous = items.find((p) => p.seriesName === t('previousYear'))?.value ?? 0;
          const projection = items.find((p) => p.seriesName === t('projection'))?.value;
          
          const diff = current - previous;
          const diffSign = diff >= 0 ? '+' : '';
          const diffColor = diff >= 0 ? '#2E7D32' : '#C62828';
          
          let html = `<div style="min-width:180px">
            <div style="font-weight:600;margin-bottom:6px;color:#FF7900">${month}</div>
            <div style="display:flex;justify-content:space-between"><span style="color:#FF7900">●</span><span>${t('currentYear')}</span><strong>${current.toFixed(1)}</strong></div>
            <div style="display:flex;justify-content:space-between"><span style="color:#888">●</span><span>${t('previousYear')}</span><strong>${previous.toFixed(1)}</strong></div>`;
          
          if (projection != null) {
            html += `<div style="display:flex;justify-content:space-between"><span style="color:#FF8533">●</span><span>${t('projection')}</span><strong>${projection.toFixed(1)}</strong></div>`;
          }
          
          if (previous > 0) {
            html += `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #333;text-align:right;color:${diffColor}">${diffSign}${diff.toFixed(1)} ${t('vsLastYear')}</div>`;
          }
          
          return html + '</div>';
        },
      },
      legend: {
        top: 0,
        right: 24,
        itemWidth: 16,
        itemHeight: 3,
        textStyle: { color: '#666', fontSize: 11 },
      },
      grid: {
        left: 12,
        right: 12,
        bottom: 8,
        top: 48,
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
          name: t('previousYear'),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#888888', width: 2 },
          itemStyle: { color: '#888888' },
          data: monthlyData.previousYear,
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
          data: monthlyData.currentYear,
          z: 2,
        },
        {
          name: t('projection'),
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#FF8533', width: 2, type: 'dashed' },
          data: projectionData,
          z: 3,
        },
      ],
    };
  }, [monthlyData, projectionData, monthLabels, t]);

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