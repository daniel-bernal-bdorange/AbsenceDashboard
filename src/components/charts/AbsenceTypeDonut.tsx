import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import { chartColors } from './chartColors';
import type { AbsenceCategory } from '../../types';

interface AbsenceTypeDonutProps {
  year: number;
}

const categoryColors: Record<AbsenceCategory, string> = {
  Vacation: chartColors.vacation,
  SickLeave: chartColors.sickLeave,
  Maternity: chartColors.maternity,
  Special: chartColors.special,
};

export function AbsenceTypeDonut({ year }: AbsenceTypeDonutProps) {
  const { records } = useAppStore();
  const { t } = useTranslation('charts');

  const distribution = useMemo(() => {
    const totals: Record<AbsenceCategory, number> = {
      Vacation: 0,
      SickLeave: 0,
      Maternity: 0,
      Special: 0,
    };

    for (const record of records) {
      if (record.from.getFullYear() !== year) continue;
      if (record.status !== 'Accepted') continue;
      totals[record.category] += record.numberOfDays;
    }

    return Object.entries(totals)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        name: key,
        value,
        color: categoryColors[key as AbsenceCategory],
      }));
  }, [records, year]);

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
        return `
          <div style="min-width:140px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
              <span style="font-weight:600">${p.name}</span>
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
          name: t(d.name.toLowerCase() as never) || d.name,
          itemStyle: { color: d.color },
        })),
      },
    ],
  }), [distribution, t]);

  return (
    <div className="relative" style={{ overflow: 'visible' }}>
      <ReactECharts option={option} style={{ height: 280, width: '100%' }} />
      
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