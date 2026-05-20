import { useState } from 'react';

import { ErrorBoundary, OverviewChart, TrendLine, AbsenceTypeDonut, DepartmentComparison, FolderPicker, AppShell, ToastContainer, FilterPanel, EmployeeDetail, KPIBar } from './components';
import { AbsenceTable, EmployeeSummaryTable } from './components/tables';
import { type NavigationItem } from './components/layout/AppShell';
import { appEnv } from './config/env';
import { useTranslation } from './i18n/useTranslation';
import { useAppStore } from './store/useAppStore';

export function App() {
  const { selectedYear, setSelectedYear, records, selectedEmployeeDetail, setSelectedEmployeeDetail } = useAppStore();
  const [activeSection, setActiveSection] = useState('overview');
  const [absenceTableExpanded, setAbsenceTableExpanded] = useState(true);
  const [employeeSummaryExpanded, setEmployeeSummaryExpanded] = useState(true);
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const { t: tCharts } = useTranslation('charts');

  if (records.length === 0) {
    return <FolderPicker />;
  }

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigationItems: NavigationItem[] = [
    { id: 'overview', label: tDashboard('navOverview'), shortLabel: 'DB' },
    { id: 'charts', label: tDashboard('navCharts'), shortLabel: 'GR' },
    { id: 'tables', label: tDashboard('navTables'), shortLabel: 'TB' },
  ];

  const decadeYears = [selectedYear - 1, selectedYear, selectedYear + 1];

  return (
    <ErrorBoundary>
      <ToastContainer />
      <AppShell
        activeSection={activeSection}
        appName={appEnv.appTitle}
        appSubtitle={tCommon('appSubtitle')}
        navigationItems={navigationItems}
        onNavigate={handleNavigate}
      >
        <div id="overview" className="px-8 py-12">
          <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                {tDashboard('chartCardTitle')}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl">
                {tDashboard('chartTitle')}
              </h1>
              <p className="mt-4 max-w-xl text-base text-gray-500 leading-relaxed">
                {tDashboard('chartDescription')}
              </p>
            </div>

            <label className="flex items-center gap-2 self-start text-sm text-gray-500 lg:self-auto">
              <span className="font-medium">{tDashboard('selectedYear')}</span>
              <select
                className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer"
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
              >
                {decadeYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-8">
            <FilterPanel />
          </div>

          <KPIBar />

          <div className="py-10">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
              {tDashboard('overviewTitle')}
            </p>
            <OverviewChart year={selectedYear} />
          </div>

          <hr className="border-gray-100" />

          <div id="charts" className="py-10 grid grid-cols-1 xl:grid-cols-2 gap-16">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
                {tCharts('trendTitle')}
              </p>
              <TrendLine year={selectedYear} />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
                {tCharts('donutTitle')}
              </p>
              <AbsenceTypeDonut year={selectedYear} />
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="py-10">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
              {tCharts('departmentComparison')}
            </p>
            <DepartmentComparison year={selectedYear} />
          </div>

          <hr className="border-gray-100" />

          <div id="tables" className="py-10 space-y-6">
            <button
              onClick={() => setAbsenceTableExpanded(!absenceTableExpanded)}
              className="flex w-full items-center justify-between px-2 py-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
                {tDashboard('absenceRegister')}
              </span>
              <span className={`text-gray-400 transition-transform duration-200 ${absenceTableExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {absenceTableExpanded && <AbsenceTable />}

            <button
              onClick={() => setEmployeeSummaryExpanded(!employeeSummaryExpanded)}
              className="flex w-full items-center justify-between px-2 py-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
                {tDashboard('employeeSummary')}
              </span>
              <span className={`text-gray-400 transition-transform duration-200 ${employeeSummaryExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {employeeSummaryExpanded && <EmployeeSummaryTable />}
          </div>
        </div>
        {selectedEmployeeDetail && (
          <EmployeeDetail 
            username={selectedEmployeeDetail} 
            onClose={() => setSelectedEmployeeDetail(null)} 
          />
        )}
      </AppShell>
    </ErrorBoundary>
  );
}