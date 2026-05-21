import { useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { chartColors } from './charts/chartColors';
import type { AbsenceCategory } from '../types';
import { getDayValue } from '../types';

interface EmployeeDetailProps {
  username: string;
  onClose: () => void;
}

export function EmployeeDetail({ username, onClose }: EmployeeDetailProps) {
  const { t: tDashboard } = useTranslation('dashboard');
  const { t: tCharts } = useTranslation('charts');
  const dailyRecords = useAppStore((s) => s.dailyRecords);
  const records = useAppStore((s) => s.records);
  const filters = useAppStore((s) => s.filters);
  const selectedYear = useAppStore((s) => s.selectedYear);

  const employeeDayRecords = useMemo(() => {
    return dailyRecords.filter((dr) => {
      if (dr.employeeUsername !== username) return false;
      if (dr.date.getFullYear() !== selectedYear) return false;
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
  }, [dailyRecords, username, selectedYear, filters]);

  const employeeInfo = useMemo(() => {
    const acceptedDayRecords = employeeDayRecords.filter(r => r.status === 'Accepted');
    const totals: Record<AbsenceCategory, number> = {
      Vacation: 0,
      SickLeave: 0,
      Maternity: 0,
      Special: 0,
    };

    for (const record of acceptedDayRecords) {
      totals[record.category] += getDayValue(record.isFullDay);
    }

    const totalDays = Object.values(totals).reduce((a, b) => a + b, 0);
    const department = employeeDayRecords[0]?.department ?? 'Unknown';

    const uniqueAbsenceIds = new Set(employeeDayRecords.map(r => r.originalAbsenceId));

    return { totals, totalDays, department, count: uniqueAbsenceIds.size };
  }, [employeeDayRecords]);

  const departmentAverages = useMemo(() => {
    const deptDayRecords = dailyRecords.filter((dr) => {
      if (dr.date.getFullYear() !== selectedYear) return false;
      if (dr.status !== 'Accepted') return false;
      if (dr.department !== employeeInfo.department) return false;
      if (dr.employeeUsername === username) return false;
      return true;
    });

    const employeeCount = new Set(deptDayRecords.map(r => r.employeeUsername)).size || 1;
    const totalDays = deptDayRecords.reduce((sum, r) => sum + getDayValue(r.isFullDay), 0);

    return {
      avgDaysPerEmployee: totalDays / employeeCount,
      employeeCount,
    };
  }, [dailyRecords, selectedYear, employeeInfo.department, username]);

  const timelineData = useMemo(() => {
    const acceptedIds = new Set(
      employeeDayRecords
        .filter(r => r.status === 'Accepted')
        .map(r => r.originalAbsenceId),
    );
    return records
      .filter(r => acceptedIds.has(r.id))
      .sort((a, b) => a.from.getTime() - b.from.getTime());
  }, [employeeDayRecords, records]);

  const categoryLabels: Record<AbsenceCategory, string> = {
    Vacation: 'vacationSeries',
    SickLeave: 'sickLeaveSeries',
    Maternity: 'maternitySeries',
    Special: 'specialSeries',
  };

  const categoryColors: Record<AbsenceCategory, string> = {
    Vacation: chartColors.vacation,
    SickLeave: chartColors.sickLeave,
    Maternity: chartColors.maternity,
    Special: chartColors.special,
  };

  const diff = employeeInfo.totalDays - departmentAverages.avgDaysPerEmployee;
  const diffPercent = departmentAverages.avgDaysPerEmployee > 0 
    ? ((diff / departmentAverages.avgDaysPerEmployee) * 100).toFixed(1)
    : '0';

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-32 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{username}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {employeeInfo.department === 'Unknown' ? tDashboard('unknown') : employeeInfo.department} • {selectedYear}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(70vh-80px)]">
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="col-span-1">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">{employeeInfo.totalDays.toFixed(0)}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1 truncate">{tDashboard('totalDays')}</div>
              </div>
            </div>
            <div className="col-span-3 grid grid-cols-4 gap-3">
              {(['Vacation', 'SickLeave', 'Maternity', 'Special'] as AbsenceCategory[]).map((cat) => (
                <div key={cat} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold" style={{ color: categoryColors[cat] }}>
                    {employeeInfo.totals[cat].toFixed(0)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1 truncate">
                    {tCharts(categoryLabels[cat] as 'vacationSeries' | 'sickLeaveSeries' | 'maternitySeries' | 'specialSeries')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 truncate">
              Comparativa vs {employeeInfo.department === 'Unknown' ? tDashboard('unknown') : employeeInfo.department}
            </h3>
            <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Media departamento</div>
                <div className="text-2xl font-bold text-gray-900">
                  {departmentAverages.avgDaysPerEmployee.toFixed(1)} {tDashboard('days').toLowerCase()}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {departmentAverages.employeeCount} empleados
                </div>
              </div>
              <div className="text-center px-6">
                <div className={`text-3xl font-bold ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {diff > 0 ? '+' : ''}{diffPercent}%
                </div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-sm text-gray-500 mb-1">{username}</div>
                <div className="text-2xl font-bold text-gray-900">
                  {employeeInfo.totalDays.toFixed(0)} {tDashboard('days').toLowerCase()}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {employeeInfo.count} {tDashboard('absences').toLowerCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              {tDashboard('timeline')}
            </h3>
            <div className="space-y-4">
              {timelineData.map((record, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: categoryColors[record.category] }}
                    />
                    {idx < timelineData.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {tCharts(categoryLabels[record.category] as 'vacationSeries' | 'sickLeaveSeries' | 'maternitySeries' | 'specialSeries')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {record.from.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {record.till.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {record.numberOfDays.toFixed(1)} {tDashboard('days').toLowerCase()}
                    </div>
                  </div>
                </div>
              ))}
              {timelineData.length === 0 && (
                <p className="text-gray-400 text-sm">{tDashboard('noRecords')}</p>
              )}
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
}