import { useState } from 'react';

import { ErrorBoundary, OverviewChart, TrendLine, AbsenceTypeDonut, DepartmentComparison, AppShell, ToastContainer, FilterPanel, EmployeeDetail, KPIBar } from './components';
import { AbsenceTable, EmployeeSummaryTable, VacationStatsTable } from './components/tables';
import { type NavigationItem } from './components/layout/AppShell';
import { appEnv } from './config/env';
import { useTranslation } from './i18n/useTranslation';
import { useAppStore } from './store/useAppStore';
import { useSharePointData } from './fileSystem/useSharePointData';

export function App() {
  const { records, selectedEmployeeDetail, setSelectedEmployeeDetail } = useAppStore();
  const { isLoading, error } = useSharePointData();
  const [activeSection, setActiveSection] = useState('overview');
  const [absenceTableExpanded, setAbsenceTableExpanded] = useState(true);
  const [employeeSummaryExpanded, setEmployeeSummaryExpanded] = useState(true);
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const { t: tCharts } = useTranslation('charts');

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-orangeBusiness" />
          <span className="text-sm text-gray-500">{tCommon('loading')}</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-900">{tDashboard('folderPickerTitle')}</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  if (records.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-500">{tCommon('loading')}</p>
      </main>
    );
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
    { id: 'vacations', label: tDashboard('navVacations'), shortLabel: 'VC' },
  ];

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
          <div className="mb-8">
            <FilterPanel />
          </div>

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

          </div>

          <KPIBar />

          <div className="py-10">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
              {tDashboard('overviewTitle')}
            </p>
            <OverviewChart />
          </div>

          <hr className="border-gray-100" />

          <div id="charts" className="py-10 grid grid-cols-1 xl:grid-cols-2 gap-16">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
                {tCharts('trendTitle')}
              </p>
              <TrendLine />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
                {tCharts('donutTitle')}
              </p>
              <AbsenceTypeDonut />
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="py-10">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
              {tCharts('departmentComparison')}
            </p>
            <DepartmentComparison />
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

          <hr className="border-gray-100" />

          <div id="vacations" className="py-10">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
              {tDashboard('vacationSectionTitle')}
            </p>
            <VacationStatsTable />
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