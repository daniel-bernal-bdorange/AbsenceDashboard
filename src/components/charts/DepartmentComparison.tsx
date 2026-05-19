import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { AbsenceCategory } from '../../types';

interface DepartmentComparisonProps {
  year: number;
}

interface DepartmentData {
  department: string;
  totalDays: number;
  absenteeismRate: number;
  byCategory: Record<AbsenceCategory, number>;
}

export function DepartmentComparison({ year }: DepartmentComparisonProps) {
  const records = useAppStore((s) => s.records);
  const filters = useAppStore((s) => s.filters);
  const { t } = useTranslation('charts');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filters.departments.length && !filters.departments.includes(r.department ?? 'Unknown')) return false;
      if (filters.employees.length && !filters.employees.includes(r.employeeUsername)) return false;
      if (filters.categories.length && !filters.categories.includes(r.category)) return false;
      if (filters.dateRange.from && r.from < filters.dateRange.from) return false;
      if (filters.dateRange.to && r.till > filters.dateRange.to) return false;
      return true;
    });
  }, [records, filters]);

  const departmentData = useMemo(() => {
    const data: Record<string, DepartmentData> = {
      Prod: {
        department: 'Prod',
        totalDays: 0,
        absenteeismRate: 0,
        byCategory: { Vacation: 0, SickLeave: 0, Maternity: 0, Special: 0 },
      },
      BackOffice: {
        department: 'BackOffice',
        totalDays: 0,
        absenteeismRate: 0,
        byCategory: { Vacation: 0, SickLeave: 0, Maternity: 0, Special: 0 },
      },
    };

    const employeeCounts: Record<string, Set<string>> = {
      Prod: new Set(),
      BackOffice: new Set(),
    };

    for (const record of filteredRecords) {
      if (record.from.getFullYear() !== year) continue;
      if (record.status !== 'Accepted') continue;

      const dept = record.department === 'Prod' ? 'Prod' : record.department === 'BackOffice' ? 'BackOffice' : null;
      if (!dept) continue;

      data[dept].totalDays += record.numberOfDays;
      data[dept].byCategory[record.category] += record.numberOfDays;
      employeeCounts[dept].add(record.employeeUsername);
    }

    const totalEmployees = new Set(filteredRecords.map(r => r.employeeUsername)).size || 1;
    const prodEmployees = employeeCounts.Prod.size || Math.floor(totalEmployees * 0.6);
    const boEmployees = employeeCounts.BackOffice.size || Math.floor(totalEmployees * 0.4);
    const workingDays = 260;

    data.Prod.absenteeismRate = (data.Prod.totalDays / (prodEmployees * workingDays)) * 100;
    data.BackOffice.absenteeismRate = (data.BackOffice.totalDays / (boEmployees * workingDays)) * 100;

    return Object.values(data).filter(d => d.totalDays > 0).sort((a, b) => a.totalDays - b.totalDays);
  }, [filteredRecords, year]);

  const option: EChartsOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1A1A1A',
      borderColor: '#FF7900',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: unknown) => {
        const items = params as Array<{ name: string; seriesName: string; value: number }>;
        if (!items?.length) return '';
        const dept = items[0]?.name ?? '';
        const data = departmentData.find(d => d.department === dept);
        if (!data) return '';

        return `
          <div style="min-width:180px">
            <div style="font-weight:600;color:#FF7900;margin-bottom:8px">${dept}</div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="color:#999">${t('totalDays')}</span>
              <strong>${data.totalDays.toFixed(0)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="color:#999">${t('absenteeismRate')}</span>
              <strong>${data.absenteeismRate.toFixed(1)}%</strong>
            </div>
            <div style="border-top:1px solid #333;margin-top:6px;padding-top:6px">
              <div style="display:flex;justify-content:space-between"><span style="color:#FF7900">●</span><span>${t('vacationSeries')}</span><strong>${data.byCategory.Vacation.toFixed(0)}</strong></div>
              <div style="display:flex;justify-content:space-between"><span style="color:#C62828">●</span><span>${t('sickLeaveSeries')}</span><strong>${data.byCategory.SickLeave.toFixed(0)}</strong></div>
              <div style="display:flex;justify-content:space-between"><span style="color:#2E7D32">●</span><span>${t('specialSeries')}</span><strong>${(data.byCategory.Special + data.byCategory.Maternity).toFixed(0)}</strong></div>
            </div>
          </div>
        `;
      },
    },
    grid: {
      left: 8,
      right: 24,
      bottom: 16,
      top: 8,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f5f5f5' } },
      axisLabel: { color: '#666', fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: departmentData.map(d => d.department),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        color: '#1A1A1A', 
        fontSize: 13, 
        fontWeight: 600,
      },
    },
    series: [
      {
        name: t('totalDays'),
        type: 'bar',
        barWidth: 40,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(255, 121, 0, 0.2)',
          },
        },
        data: departmentData.map(d => ({
          value: d.totalDays,
          itemStyle: {
            color: d.department === 'Prod' ? '#FF7900' : '#666666',
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
          color: '#666',
          fontSize: 12,
          fontWeight: 500,
        },
      },
    ],
  }), [departmentData, t]);

  return (
    <div style={{ overflow: 'visible' }}>
      <ReactECharts option={option} style={{ height: Math.max(120, departmentData.length * 80), width: '100%' }} />
    </div>
  );
}