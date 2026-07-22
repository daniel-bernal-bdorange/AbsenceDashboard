import { useMemo, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { chartColors } from './charts/chartColors';
import type { AbsenceCategory } from '../types';
import { getDayValue } from '../types';
import { saveVacationException, deleteVacationException } from '../fileSystem/useSharePointData';
import { computeVacationStats } from '../utils/vacationEntitlement';
import { resolveEmployeeDisplayName } from '../utils/employeeDisplayName';

interface EmployeeDetailProps {
  username: string;
  onClose: () => void;
}

export function EmployeeDetail({ username, onClose }: EmployeeDetailProps) {
  const { t: tDashboard, i18n } = useTranslation('dashboard');
  const { t: tCharts } = useTranslation('charts');
  const { t: tTable } = useTranslation('table');
  const dailyRecords = useAppStore((s) => s.dailyRecords);
  const records = useAppStore((s) => s.records);
  const filters = useAppStore((s) => s.filters);
  const vacationStats = useAppStore((s) => s.vacationStats);
  const vacationExceptions = useAppStore((s) => s.vacationExceptions);
  const employeeDisplayNames = useAppStore((s) => s.employeeDisplayNames);

  const currentYear = new Date().getFullYear();

  // Exception form state
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exYear, setExYear] = useState(currentYear);
  const [exDays, setExDays] = useState(23);
  const [exNotes, setExNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const employeeCode = useMemo(() => {
    const match = records.find((r) => r.employeeUsername === username);
    return match?.employeeCode ?? null;
  }, [records, username]);

  const employeeDisplayName = useMemo(
    () => resolveEmployeeDisplayName(username, employeeDisplayNames),
    [employeeDisplayNames, username],
  );

  const vacationCurrentYear = useMemo(() => {
    if (!employeeCode) return null;
    return vacationStats[employeeCode.toLowerCase()] ?? null;
  }, [vacationStats, employeeCode]);

  const employeeDayRecords = useMemo(() => {
    return dailyRecords.filter((dr) => {
      if (dr.employeeUsername !== username) return false;
      if (filters.categories.length && !filters.categories.includes(dr.category)) return false;
      if (filters.selectedYears.length > 0 && !filters.selectedYears.includes(dr.date.getFullYear())) return false;
      if (filters.selectedMonths.length > 0 && !filters.selectedMonths.includes(dr.date.getMonth())) return false;
      return true;
    });
  }, [dailyRecords, username, filters]);

  const hasRegularizedRecords = useMemo(
    () => employeeDayRecords.some((record) => record.regularized),
    [employeeDayRecords],
  );

  const totalRegularizedDelta = useMemo(() => {
    return records
      .filter((record) => record.employeeUsername === username && record.regularized)
      .reduce((total, record) => total + (record.regularizedDelta ?? 0), 0);
  }, [records, username]);

  const regularizedLabel = useMemo(() => {
    const language = i18n.resolvedLanguage ?? i18n.language;
    const deltaText = totalRegularizedDelta > 0 ? `+${totalRegularizedDelta}` : `${totalRegularizedDelta}`;

    if (language?.startsWith('es')) {
      return `Regularizado (${deltaText} días)`;
    }

    return `Regularized (${deltaText} days)`;
  }, [i18n.language, i18n.resolvedLanguage, totalRegularizedDelta]);

  const employeeInfo = useMemo(() => {
    const acceptedDayRecords = employeeDayRecords.filter(r => r.status === 'Accepted');
    const totals: Record<AbsenceCategory, number> = {
      Vacation: 0,
      VacationPreviousYear: 0,
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
    VacationPreviousYear: 'vacationPrevYearSeries',
    SickLeave: 'sickLeaveSeries',
    Maternity: 'maternitySeries',
    Special: 'specialSeries',
  };

  const categoryColors: Record<AbsenceCategory, string> = {
    Vacation: chartColors.vacation,
    VacationPreviousYear: chartColors.vacationPrevYear,
    SickLeave: chartColors.sickLeave,
    Maternity: chartColors.maternity,
    Special: chartColors.special,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-32 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{employeeDisplayName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {employeeInfo.department === 'Unknown' ? tDashboard('unknown') : employeeInfo.department}
            </p>
            {hasRegularizedRecords && (
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {regularizedLabel}
                </span>
              </div>
            )}
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
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1 leading-tight whitespace-normal break-words">
                  {tDashboard('employeeDetailTotalAbsences')}
                </div>
              </div>
            </div>
            <div className="col-span-3 grid grid-cols-4 gap-3">
              {(['Vacation', 'VacationPreviousYear', 'SickLeave', 'Maternity', 'Special'] as AbsenceCategory[]).map((cat) => (
                <div key={cat} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold" style={{ color: categoryColors[cat] }}>
                    {employeeInfo.totals[cat].toFixed(0)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1 leading-tight whitespace-normal break-words">
                    {tCharts(categoryLabels[cat] as 'vacationSeries' | 'vacationPrevYearSeries' | 'sickLeaveSeries' | 'maternitySeries' | 'specialSeries')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {vacationCurrentYear && employeeCode && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  {tDashboard('vacationCardTitle', { year: currentYear })}
                </h3>
                <div className="flex items-center gap-2">
                  {vacationExceptions[`${employeeCode.toLowerCase()}|${currentYear}`] !== undefined && !showExceptionForm && (
                    <button
                      title={tDashboard('vacationCustomDelete')}
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);
                        setSaveMessage(null);
                        try {
                          await deleteVacationException(employeeCode, currentYear);
                          // Read fresh state to avoid stale closure
                          const s = useAppStore.getState();
                          const newExc = { ...s.vacationExceptions };
                          delete newExc[`${employeeCode.toLowerCase()}|${currentYear}`];
                          s.setVacationExceptions(newExc);
                          const excMap = new Map(Object.entries(newExc).map(([k, v]) => [k, (v as { days: number }).days]));
                          const arrMap = new Map(Object.entries(s.arrivalDates).map(([k, v]) => [k, new Date(v as string)]));
                          const stats = computeVacationStats(s.records, arrMap, currentYear, new Date(), excMap);
                          const rec: Record<string, import('../types').VacationStats> = {};
                          stats.forEach((v, k) => { rec[k] = v; });
                          s.setVacationStats({ ...s.vacationStats, ...rec });
                          setSaveMessage({ type: 'ok', text: tDashboard('vacationCustomDeleted') });
                        } catch (err) {
                          console.error('[VacationException] delete failed:', err);
                          const detail = err instanceof Error ? err.message : String(err);
                          setSaveMessage({ type: 'err', text: `${tDashboard('vacationCustomError')}: ${detail}` });
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const existing = vacationExceptions[`${employeeCode.toLowerCase()}|${currentYear}`];
                      setExYear(currentYear);
                      setExDays(existing?.days ?? vacationCurrentYear.entitlementY);
                      setExNotes(existing?.notes ?? '');
                      setSaveMessage(null);
                      setShowExceptionForm((v) => !v);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    {tDashboard('vacationCustomBtn')}
                  </button>
                </div>
              </div>

              {showExceptionForm && (
                <div className="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                          {tDashboard('vacationCustomYear')}
                        </label>
                        <select
                          value={exYear}
                          onChange={(e) => {
                            const y = parseInt(e.target.value, 10);
                            setExYear(y);
                            const existing = vacationExceptions[`${employeeCode.toLowerCase()}|${y}`];
                            setExDays(existing?.days ?? 23);
                            setExNotes(existing?.notes ?? '');
                          }}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                        >
                          {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                          {tDashboard('vacationCustomDays')}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={40}
                          value={exDays}
                          onChange={(e) => setExDays(parseInt(e.target.value, 10))}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-24 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                        {tDashboard('vacationCustomNotes')}
                      </label>
                      <textarea
                        value={exNotes}
                        onChange={(e) => setExNotes(e.target.value)}
                        rows={2}
                        placeholder="..."
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={saving || isNaN(exDays) || exDays < 1}
                        onClick={async () => {
                          setSaving(true);
                          setSaveMessage(null);
                          try {
                            await saveVacationException(employeeCode, exYear, exDays, exNotes || undefined);
                            // Read fresh state to avoid stale closure
                            const s = useAppStore.getState();
                            const newExc = {
                              ...s.vacationExceptions,
                              [`${employeeCode.toLowerCase()}|${exYear}`]: { days: exDays, notes: exNotes || undefined },
                            };
                            s.setVacationExceptions(newExc);
                            const excMap = new Map(Object.entries(newExc).map(([k, v]) => [k, (v as { days: number }).days]));
                            const arrMap = new Map(Object.entries(s.arrivalDates).map(([k, v]) => [k, new Date(v as string)]));
                            const stats = computeVacationStats(s.records, arrMap, currentYear, new Date(), excMap);
                            const rec: Record<string, import('../types').VacationStats> = {};
                            stats.forEach((v, k) => { rec[k] = v; });
                            s.setVacationStats({ ...s.vacationStats, ...rec });
                            setSaveMessage({ type: 'ok', text: tDashboard('vacationCustomSaved') });
                            setShowExceptionForm(false);
                          } catch (err) {
                            console.error('[VacationException] save failed:', err);
                            const detail = err instanceof Error ? err.message : String(err);
                            setSaveMessage({ type: 'err', text: `${tDashboard('vacationCustomError')}: ${detail}` });
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-40"
                      >
                        {saving ? '…' : tDashboard('vacationCustomSave')}
                      </button>
                      <button
                        onClick={() => { setShowExceptionForm(false); setSaveMessage(null); }}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {tDashboard('vacationCustomCancel')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {saveMessage && (
                <p className={`text-xs mb-3 ${saveMessage.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage.text}
                </p>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold" style={{ color: chartColors.vacation }}>
                    {vacationCurrentYear.requestedY}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1 leading-tight whitespace-normal break-words">
                    {tDashboard('vacationRequested')}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center relative">
                  <div className="text-2xl font-bold text-gray-900">
                    {vacationCurrentYear.entitlementY}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1 leading-tight whitespace-normal break-words">
                    {tDashboard('vacationEntitlement')}
                  </div>
                  {vacationExceptions[`${employeeCode.toLowerCase()}|${currentYear}`] !== undefined && (
                    <>
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-400" />
                      <div className="text-[10px] text-orange-500 mt-1 font-medium">
                        {tDashboard('vacationCustomBtn')}
                      </div>
                      {vacationExceptions[`${employeeCode.toLowerCase()}|${currentYear}`]?.notes && (
                        <div className="text-[10px] text-gray-400 mt-0.5 italic leading-tight">
                          {vacationExceptions[`${employeeCode.toLowerCase()}|${currentYear}`]?.notes}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div
                    className={`text-2xl font-bold ${vacationCurrentYear.remainingY < 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {vacationCurrentYear.remainingY}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1 leading-tight whitespace-normal break-words">
                    {tDashboard('vacationRemaining')}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              {tDashboard('timeline')}
            </h3>
            {timelineData.length === 0 ? (
              <p className="text-gray-400 text-sm">{tDashboard('noRecords')}</p>
            ) : (
              <div className="max-h-[260px] overflow-y-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{tTable('type')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{tTable('from')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{tTable('till')}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">{tTable('days')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{tTable('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {timelineData.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: categoryColors[record.category] }}
                            />
                            {tCharts(categoryLabels[record.category] as 'vacationSeries' | 'vacationPrevYearSeries' | 'sickLeaveSeries' | 'maternitySeries' | 'specialSeries')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {record.from.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {record.till.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {record.numberOfDays.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {record.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
}