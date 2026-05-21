import { useMemo, useCallback } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { chartColors } from './charts/chartColors';
import type { AbsenceCategory, AbsenceDayRecord } from '../types';
import { getDayValue } from '../types';
import { filterDayRecords } from '../utils/filterDayRecords';

type OverviewChartProps = {
  year: number;
};

const monthLabels = (language: string, year: number) =>
  Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat(language, { month: 'short' }).format(new Date(year, index, 1)),
  );

const buildMonthlySeries = (dailyRecords: AbsenceDayRecord[], year: number) => {
  const vacationData = Array(12).fill(0);
  const sickLeaveData = Array(12).fill(0);
  const maternityData = Array(12).fill(0);
  const specialLeaveData = Array(12).fill(0);

  for (const record of dailyRecords) {
    if (record.date.getFullYear() !== year) continue;
    if (record.status !== 'Accepted') continue;

    const monthIndex = record.date.getMonth();
    const days = getDayValue(record.isFullDay);

    switch (record.category) {
      case 'Vacation':
        vacationData[monthIndex] += days;
        break;
      case 'SickLeave':
        sickLeaveData[monthIndex] += days;
        break;
      case 'Maternity':
        maternityData[monthIndex] += days;
        break;
      case 'Special':
        specialLeaveData[monthIndex] += days;
        break;
    }
  }

  return { vacationData, sickLeaveData, maternityData, specialLeaveData };
};

const seriesIndexToCategory: Record<number, AbsenceCategory> = {
  0: 'Vacation',
  1: 'SickLeave',
  2: 'Maternity',
  3: 'Special',
};

export function OverviewChart({ year }: OverviewChartProps) {
  const { i18n, t } = useTranslation('charts');
  const dailyRecords = useAppStore((s) => s.dailyRecords);
  const filters = useAppStore((s) => s.filters);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const setFilters = useAppStore((s) => s.setFilters);

  const handleChartClick = useCallback((params: unknown) => {
    const p = params as { dataIndex?: number; seriesIndex?: number; name?: string; event?: unknown; componentType?: string; value?: string | number };
    const customEvent = p.event as { type?: string };
    
    if (customEvent?.type === 'legendselectchanged') {
      const selected = (p as { selected?: Record<string, boolean> }).selected;
      if (selected) {
        const selectedCategories: AbsenceCategory[] = [];
        if (selected[t('vacationSeries')]) selectedCategories.push('Vacation');
        if (selected[t('sickLeaveSeries')]) selectedCategories.push('SickLeave');
        if (selected[t('specialSeries')]) selectedCategories.push('Special');
        setFilters({ categories: selectedCategories });
      }
      return;
    }
    
    if (p.componentType === 'legend' && p.name) {
      const nameToCategory: Record<string, AbsenceCategory> = {
        [t('vacationSeries')]: 'Vacation',
        [t('sickLeaveSeries')]: 'SickLeave',
        [t('specialSeries')]: 'Special',
      };
      
      const category = nameToCategory[p.name];
      if (category) {
        const isActive = filters.categories.includes(category);
        if (isActive) {
          setFilters({ categories: filters.categories.filter(c => c !== category) });
        } else {
          setFilters({ categories: [...filters.categories, category] });
        }
      }
      return;
    }
    
    const category = p.seriesIndex !== undefined ? seriesIndexToCategory[p.seriesIndex] : null;
    
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
    
    if (p.seriesIndex !== undefined && p.dataIndex !== undefined) {
      const month = p.dataIndex;
      const fromDate = new Date(year, month, 1);
      const toDate = new Date(year, month + 1, 0);
      
      if (filters.selectedMonth === month && filters.categories.length === 1 && category && filters.categories.includes(category)) {
        setFilters({ selectedMonth: null, dateRange: { from: null, to: null }, categories: [] });
      } else {
        setFilters({ 
          selectedMonth: month,
          dateRange: { from: fromDate, to: toDate },
          categories: category ? [category] : []
        });
      }
    } else if (p.dataIndex !== undefined && p.seriesIndex === undefined) {
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
    }
  }, [filters.selectedMonth, filters.categories, setFilters, year, t]);

  const handleLegendSelect = useCallback((params: unknown) => {
    const p = params as { selected: Record<string, boolean> };
    const selected = p.selected;
    
    const selectedCategories: AbsenceCategory[] = [];
    if (selected[t('vacationSeries')]) selectedCategories.push('Vacation');
    if (selected[t('sickLeaveSeries')]) selectedCategories.push('SickLeave');
    if (selected[t('specialSeries')]) selectedCategories.push('Special');
    
    setFilters({ categories: selectedCategories });
  }, [setFilters, t]);

  const handleChartClickParams = useCallback((params: unknown) => {
    handleChartClick(params);
  }, [handleChartClick]);

  const filteredDayRecords = useMemo(
    () => filterDayRecords(dailyRecords, filters, selectedYear),
    [dailyRecords, filters, selectedYear],
  );

  const monthlySeries = useMemo(
    () => buildMonthlySeries(filteredDayRecords, year),
    [filteredDayRecords, year],
  );

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    color: [chartColors.vacation, chartColors.sickLeave, chartColors.maternity, chartColors.special],
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
      axisLabel: { color: '#666666', fontSize: 11, interval: 0 },
      triggerEvent: true,
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
        name: t('maternitySeries'),
        type: 'bar',
        stack: 'absences',
        barWidth: 20,
        emphasis: { focus: 'series' },
        data: monthlySeries.maternityData,
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
      <ReactECharts 
        option={option} 
        style={{ height: 320, width: '100%' }}
        onEvents={{ 
          click: handleChartClickParams,
          legendselectchanged: handleLegendSelect 
        }}
      />
    </div>
  );
}