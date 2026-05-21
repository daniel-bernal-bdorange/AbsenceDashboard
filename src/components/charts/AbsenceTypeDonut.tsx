import { useMemo, useCallback } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import { chartColors } from './chartColors';
import type { AbsenceCategory } from '../../types';
import { getDayValue } from '../../types';

const categoryColors: Record<AbsenceCategory, string> = {
  Vacation: chartColors.vacation,
  SickLeave: chartColors.sickLeave,
  Maternity: chartColors.maternity,
  Special: chartColors.special,
};

export function AbsenceTypeDonut() {
  const dailyRecords = useAppStore((s) => s.dailyRecords);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const { t } = useTranslation('charts');

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
      return true;
    });
  }, [dailyRecords, filters]);

  const distribution = useMemo(() => {
    const totals: Record<AbsenceCategory, number> = {
      Vacation: 0,
      SickLeave: 0,
      Maternity: 0,
      Special: 0,
    };

    for (const record of filteredDayRecords) {
      if (record.status !== 'Accepted') continue;
      totals[record.category] += getDayValue(record.isFullDay);
    }

    return Object.entries(totals)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        name: key,
        value,
        color: categoryColors[key as AbsenceCategory],
      }));
  }, [filteredDayRecords]);

  const handleDonutClick = useCallback((params: unknown) => {
    const p = params as { dataIndex?: number };
    if (p.dataIndex === undefined) return;
    
    const categoryKey = distribution[p.dataIndex]?.name;
    if (!categoryKey) return;
    
    const category = categoryKey as AbsenceCategory;
    
    if (filters.categories.length === 1 && filters.categories[0] === category) {
      setFilters({ categories: [] });
    } else {
      setFilters({ categories: [category] });
    }
  }, [filters.categories, setFilters, distribution]);

  const totalDays = distribution.reduce((sum, d) => sum + d.value, 0);

  const option: EChartsOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      position: 'top',
      backgroundColor: '#1A1A1A',
      borderColor: '#FF7900',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 12 },
      extraCssText: 'max-width: 200px; word-wrap: break-word;',
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number; color: string };
        const nameKeyMap: Record<string, string> = {
          Vacation: 'vacationSeries',
          SickLeave: 'sickLeaveSeries',
          Maternity: 'maternitySeries',
          Special: 'specialSeries',
        };
        const translatedName = (t as (key: string) => string)(nameKeyMap[p.name] || p.name) || p.name;
        return `
          <div style="min-width:140px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
              <span style="font-weight:600">${translatedName}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:16px">
              <span style="color:#999">${t('days')}</span>
              <strong>${p.value.toFixed(1)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;gap:16px">
              <span style="color:#999">${t('percentage')}</span>
              <strong>${p.percent.toFixed(1)}%</strong>
            </div>
          </div>
        `;
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 24,
      textStyle: {
        color: '#666',
        fontSize: 11,
      },
      formatter: (name: string) => {
        const keyMap: Record<string, string> = {
          Vacation: 'vacationSeries',
          SickLeave: 'sickLeaveSeries',
          Maternity: 'maternitySeries',
          Special: 'specialSeries',
        };
        const key = keyMap[name] || name;
        return (t as (key: string) => string)(key) || name;
      },
    },
    series: [
      {
        name: t('distribution'),
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 6,
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(255, 121, 0, 0.3)',
          },
        },
        data: distribution.map(d => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: d.color },
        })),
      },
    ],
  }), [distribution, t]);

  return (
    <div className="relative" style={{ overflow: 'visible' }}>
      <ReactECharts 
        option={option} 
        style={{ height: 280, width: '100%' }}
        onEvents={{ click: handleDonutClick }}
      />
      
      {totalDays > 0 && (
        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-4xl font-bold text-gray-900">
            {totalDays.toFixed(0)}
          </div>
          <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">
            {t('totalAbsences')}
          </div>
        </div>
      )}
    </div>
  );
}