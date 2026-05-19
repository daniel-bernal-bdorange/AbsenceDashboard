import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';

interface AbsenceCalendarProps {
  year: number;
}

interface DayAbsence {
  date: Date;
  count: number;
  employees: string[];
  types: string[];
}

export function AbsenceCalendar({ year }: AbsenceCalendarProps) {
  const { records } = useAppStore();
  const { t: tCharts } = useTranslation('charts');

  const calendarData = useMemo(() => {
    const days: DayAbsence[] = [];

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const absences = records.filter((r) => {
          const from = new Date(r.from);
          const till = new Date(r.till);
          return date >= from && date <= till && r.status === 'Accepted';
        });

        days.push({
          date,
          count: absences.length,
          employees: [...new Set(absences.map((a) => a.employeeUsername))],
          types: [...new Set(absences.map((a) => a.type))],
        });
      }
    }

    return days;
  }, [records, year]);

  const monthNames = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      return new Date(year, i, 1).toLocaleDateString('es', { month: 'short' });
    });
  }, [year]);

  const option: EChartsOption = useMemo(() => {
    const data: number[] = [];
    const maxCount = Math.max(...calendarData.map((d) => d.count), 1);

    calendarData.forEach((day) => {
      data.push(day.count);
    });

    const heatmapData: [number, number, number][] = [];
    let dayIndex = 0;
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        heatmapData.push([month, day - 1, calendarData[dayIndex]?.count || 0]);
        dayIndex++;
      }
    }

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { data?: [number, number, number] };
          if (!p.data) return '';
          const [month, day, count] = p.data;
          const date = new Date(year, month, day + 1);
          const dayData = calendarData.find(
            (d) => d.date.getMonth() === month && d.date.getDate() === day + 1
          );

          if (!dayData || count === 0) {
            return `${date.toLocaleDateString('es', { day: 'numeric', month: 'long' })}<br/>Sin ausencias`;
          }

          return `
            <div style="font-size:12px">
              <strong>${date.toLocaleDateString('es', { day: 'numeric', month: 'long' })}</strong><br/>
              ${count} ausencia${count > 1 ? 's' : ''}<br/>
              <em>${dayData.employees.join(', ')}</em>
            </div>
          `;
        },
      },
      grid: {
        left: 12,
        right: 12,
        top: 40,
        bottom: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: monthNames,
        splitArea: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#666666', fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: Array.from({ length: 31 }, (_, i) => String(i + 1)),
        splitArea: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        show: false,
        inRange: {
          color: ['#FFF0E6', '#FF8533', '#FF6600', '#CC5200'],
        },
      },
      series: [
        {
          name: tCharts('absenceCalendar'),
          type: 'heatmap',
          data: heatmapData,
          label: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
        },
      ],
    };
  }, [calendarData, monthNames, year, tCharts]);

  return (
    <div className="rounded-2xl border border-orangeBusiness-pale bg-white p-4 shadow-[0_2px_8px_rgba(26,26,26,0.08)]">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">
        {tCharts('absenceCalendar')}
      </h3>
      <ReactECharts
        option={option}
        style={{ height: 400, width: '100%' }}
      />
    </div>
  );
}