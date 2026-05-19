import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';

interface TrendLineProps {
  year: number;
}

interface MonthlyData {
  currentYear: number[];
  previousYear: number[];
  months: string[];
}

const buildMonthlyData = (records: { from: Date; numberOfDays: number; status: string }[], year: number): MonthlyData => {
  const currentYear = Array(12).fill(0);
  const previousYear = Array(12).fill(0);
  
  for (const record of records) {
    if (record.status !== 'Accepted') continue;
    const recordYear = record.from.getFullYear();
    const month = record.from.getMonth();
    
    if (recordYear === year) {
      currentYear[month] += record.numberOfDays;
    } else if (recordYear === year - 1) {
      previousYear[month] += record.numberOfDays;
    }
  }
  
  return { currentYear, previousYear, months: [] };
};

const getHistoricalAverage = (data: number[], upToMonth: number): number => {
  if (upToMonth <= 0) return 0;
  const sum = data.slice(0, upToMonth).reduce((a, b) => a + b, 0);
  return sum / upToMonth;
};

export function TrendLine({ year }: TrendLineProps) {
  const { records } = useAppStore();
  const { i18n, t } = useTranslation('charts');
  const { t: tDashboard } = useTranslation('dashboard');

  const monthlyData = useMemo(() => buildMonthlyData(records, year), [records, year]);
  
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
  }, [monthlyData]);

  const option: EChartsOption = useMemo(() => {
    const areaData = monthlyData.currentYear.map((curr, idx) => {
      const prev = monthlyData.previousYear[idx] ?? 0;
      return curr - prev;
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1A1A1A',
        borderColor: '#FF6600',
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
            <div style="font-weight:600;margin-bottom:6px;color:#FF6600">${month}</div>
            <div style="display:flex;justify-content:space-between"><span style="color:#FF6600">●</span><span>${t('currentYear')}</span><strong>${current.toFixed(1)}</strong></div>
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
        axisLine: { lineStyle: { color: '#e0d6cc' } },
        axisTick: { show: false },
        axisLabel: { color: '#666', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f5ede6' } },
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
          lineStyle: { color: '#FF6600', width: 3 },
          itemStyle: { color: '#FF6600', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255,102,0,0.25)' },
                { offset: 1, color: 'rgba(255,102,0,0.02)' },
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
    <div className="group relative overflow-hidden rounded-2xl border border-orangeBusiness-pale bg-white p-5 shadow-[0_2px_8px_rgba(26,26,26,0.06)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(255,102,0,0.12)]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orangeBusiness">
            {tDashboard('trendCardTitle')}
          </p>
          <h3 className="mt-1.5 font-display text-lg font-bold text-ink">
            {t('trendTitle')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="h-3 w-6 rounded-sm bg-[#FF6600]" />
            {t('currentYear')}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="h-3 w-6 rounded-sm bg-[#888]" />
            {t('previousYear')}
          </span>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: 280, width: '100%' }} />
    </div>
  );
}