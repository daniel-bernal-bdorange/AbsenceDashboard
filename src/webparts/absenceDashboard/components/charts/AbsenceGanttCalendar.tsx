import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import { chartColors } from './chartColors';
import { EmptyState } from '../common/EmptyState';
import type { AbsenceCategory } from '../../types';

const CATEGORY_COLOR: Record<AbsenceCategory, string> = {
  Vacation: chartColors.vacation,
  VacationPreviousYear: chartColors.vacationPrevYear,
  SickLeave: chartColors.sickLeave,
  Maternity: chartColors.maternity,
  Special: chartColors.special,
};

const BAR_HEIGHT = 16;
const ROW_HEIGHT = 26;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
// Both charts share the same grid margins so plot areas align pixel-perfectly.
const GRID_LEFT = 160;
const GRID_RIGHT = 24;

function computeInitialZoom(year: number): { start: number; end: number } {
  const now = new Date();
  if (now.getFullYear() !== year) return { start: 0, end: 100 };
  return {
    start: Math.max(0, (Math.max(0, now.getMonth() - 2) / 12) * 100),
    end: Math.min(100, ((Math.min(11, now.getMonth() + 3) + 1) / 12) * 100),
  };
}

export function AbsenceGanttCalendar() {
  const records = useAppStore((s) => s.records);
  const filters = useAppStore((s) => s.filters);
  const { t, i18n } = useTranslation('charts');
  const { t: tTypes } = useTranslation('absenceTypes');

  const currentYear = new Date().getFullYear();
  const [localYear, setLocalYear] = useState<number>(() => filters.selectedYears[0] ?? currentYear);
  const [xZoom, setXZoom] = useState<{ start: number; end: number }>(() =>
    computeInitialZoom(filters.selectedYears[0] ?? currentYear),
  );

  // Reset zoom window when navigating to a different year.
  useEffect(() => {
    setXZoom(computeInitialZoom(localYear));
  }, [localYear]);

  const yearStart = new Date(localYear, 0, 1).getTime();
  const yearEnd = new Date(localYear, 11, 31, 23, 59, 59, 999).getTime();

  // Apply dept/employee/category/status filters only — the Gantt owns year selection.
  const yearRecords = useMemo(() => {
    return records.filter((r) => {
      if (filters.departments.length && !filters.departments.includes(r.department ?? 'Unknown')) return false;
      if (filters.employees.length && !filters.employees.includes(r.employeeUsername)) return false;
      if (filters.categories.length && !filters.categories.includes(r.category)) return false;
      // Default to Accepted-only when no explicit status filter, matching behaviour of other charts.
      const statusOk = filters.statuses.length
        ? filters.statuses.includes(r.status)
        : r.status === 'Accepted';
      if (!statusOk) return false;
      // Keep only records that overlap the displayed year.
      return r.from.getTime() <= yearEnd && r.till.getTime() >= yearStart;
    });
  }, [records, filters.departments, filters.employees, filters.categories, filters.statuses, yearStart, yearEnd]);

  const employees = useMemo(() => {
    const names = new Set(yearRecords.map((r) => r.employeeUsername));
    return Array.from(names).sort((a, b) => a.localeCompare(b, i18n.language));
  }, [yearRecords, i18n.language]);

  // Each row: [startMs, endMs, yIndex, colorHex, absenceType, numberOfDays, employeeUsername]
  const chartData = useMemo<(string | number)[][]>(() => {
    return yearRecords.map((r) => {
      const yIdx = employees.indexOf(r.employeeUsername);
      const clampedStart = Math.max(r.from.getTime(), yearStart);
      // Add one day so a single-day absence renders with visible width on the time axis.
      const clampedEnd = Math.min(r.till.getTime() + ONE_DAY_MS, yearEnd);
      return [
        clampedStart,
        clampedEnd,
        yIdx,
        CATEGORY_COLOR[r.category] ?? '#888888',
        r.type,
        r.numberOfDays,
        r.employeeUsername,
      ];
    });
  }, [yearRecords, employees, yearStart, yearEnd]);

  // Sync zoom from either chart back to React state.
  const handleDataZoom = useCallback((params: unknown) => {
    const p = params as { start?: number; end?: number; batch?: { start: number; end: number }[] };
    if (p.start !== undefined && p.end !== undefined) {
      setXZoom({ start: p.start, end: p.end });
    } else if (p.batch?.[0]) {
      setXZoom({ start: p.batch[0].start, end: p.batch[0].end });
    }
  }, []);

  const tooltipFormatter = useCallback((params: unknown) => {
    const p = params as { data: (string | number)[] };
    const [startMs, endMs, , , type, days, employee] = p.data;
    const fmt = (ms: string | number) =>
      new Date(ms as number).toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    return [
      `<strong>${employee as string}</strong>`,
      (tTypes as unknown as (k: string) => string)(type as string),
      `${t('ganttTooltipFrom')}: ${fmt(startMs)}`,
      `${t('ganttTooltipTill')}: ${fmt(endMs)}`,
      `${t('days')}: ${days as number}`,
    ].join('<br/>');
  }, [i18n.language, t, tTypes]);

  // ── Header chart ──────────────────────────────────────────────────────────
  // Shows x-axis labels and the zoom slider. Sits above the scroll container
  // so months are always visible regardless of how far the user has scrolled.
  const headerOption: EChartsOption = useMemo(() => ({
    animation: false,
    backgroundColor: 'transparent',
    grid: { left: GRID_LEFT, right: GRID_RIGHT, top: 4, bottom: 36 },
    xAxis: {
      type: 'time',
      min: yearStart,
      max: yearEnd,
      axisLabel: {
        formatter: (value: number) =>
          new Date(value).toLocaleDateString(i18n.language, { month: 'short' }),
        fontSize: 11,
        color: '#6B7280',
      },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: { type: 'category', data: [''], show: false },
    series: [],
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        start: xZoom.start,
        end: xZoom.end,
        height: 20,
        bottom: 8,
        borderColor: '#E5E7EB',
        fillerColor: 'rgba(255,121,0,0.1)',
        handleStyle: { color: '#FF7900' },
      },
      { type: 'inside', xAxisIndex: 0, start: xZoom.start, end: xZoom.end },
    ],
  }), [yearStart, yearEnd, xZoom, i18n.language]);

  // ── Data chart ────────────────────────────────────────────────────────────
  // Shows y-axis employee names and absence bars. X-axis is hidden (labels
  // suppressed) but drives bar positioning. Lives inside a scrollable container.
  const dataOption: EChartsOption = useMemo(() => ({
    animation: false,
    backgroundColor: 'transparent',
    grid: { left: GRID_LEFT, right: GRID_RIGHT, top: 4, bottom: 0 },
    xAxis: {
      type: 'time',
      min: yearStart,
      max: yearEnd,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#F3F4F6' } },
    },
    yAxis: {
      type: 'category',
      data: employees,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { fontSize: 12, color: '#374151', overflow: 'truncate', width: 140 },
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#F9FAFB' } },
    },
    series: [
      {
        type: 'custom',
        renderItem: (_params: unknown, api: unknown) => {
          const a = api as {
            value: (idx: number) => string | number | null;
            coord: (point: number[]) => number[];
          };
          const startX = a.coord([a.value(0) as number, a.value(2) as number])[0];
          const endX = a.coord([a.value(1) as number, a.value(2) as number])[0];
          const centerY = a.coord([a.value(0) as number, a.value(2) as number])[1];
          const barWidth = Math.max(endX - startX, 2);
          return {
            type: 'rect',
            shape: { x: startX, y: centerY - BAR_HEIGHT / 2, width: barWidth, height: BAR_HEIGHT, r: 3 },
            style: { fill: a.value(3) as string, opacity: 0.85 },
            emphasis: { style: { opacity: 1 } },
          };
        },
        data: chartData,
        clip: true,
      },
    ],
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      backgroundColor: '#1A1A1A',
      borderColor: '#FF7900',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: tooltipFormatter,
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, start: xZoom.start, end: xZoom.end },
    ],
  }), [employees, chartData, yearStart, yearEnd, xZoom, tooltipFormatter]);

  const dataChartHeight = Math.max(employees.length * ROW_HEIGHT + 8, 80);

  if (employees.length === 0) {
    return <EmptyState title={t('ganttNoData')} icon="📅" />;
  }

  return (
    <div className="w-full">
      {/* Year navigation */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => setLocalYear((y) => y - 1)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors text-sm"
          aria-label="Previous year"
        >
          ◀
        </button>
        <span className="text-sm font-semibold text-gray-700 tabular-nums">{localYear}</span>
        <button
          onClick={() => setLocalYear((y) => y + 1)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors text-sm"
          aria-label="Next year"
        >
          ▶
        </button>
      </div>

      {/* Header: x-axis labels + zoom slider — always visible, outside the scroll area */}
      <ReactECharts
        option={headerOption}
        style={{ height: 64, width: '100%' }}
        notMerge={false}
        onEvents={{ datazoom: handleDataZoom }}
      />

      {/* Scrollable employee rows */}
      <div className="overflow-y-auto border-t border-gray-100" style={{ maxHeight: 440 }}>
        <ReactECharts
          option={dataOption}
          style={{ height: dataChartHeight, width: '100%' }}
          notMerge={false}
          onEvents={{ datazoom: handleDataZoom }}
        />
      </div>
    </div>
  );
}
