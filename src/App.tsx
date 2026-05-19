import { useState } from 'react';

import { ErrorBoundary, OverviewChart, TrendLine, AbsenceTypeDonut, DepartmentComparison, FolderPicker, AppShell, ToastContainer, FilterPanel } from './components';
import { AbsenceTable } from './components/tables';
import { type NavigationItem } from './components/layout/AppShell';
import { appEnv } from './config/env';
import { useTranslation } from './i18n/useTranslation';
import { useAppStore } from './store/useAppStore';

export function App() {
  const { selectedYear, setSelectedYear, records } = useAppStore();
  const [activeSection, setActiveSection] = useState('overview');
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const { t: tCharts } = useTranslation('charts');

  if (records.length === 0) {
    return <FolderPicker />;
  }

  const stackItems = [
    'Vite + React + TypeScript',
    'Tailwind CSS 3',
    'Apache ECharts',
    'Zustand',
    'i18next',
    'ESLint + Prettier',
    'Local file loading',
  ];

  const setupChecks = ['Vite', 'ECharts', 'i18n', 'Zustand'];

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigationItems: NavigationItem[] = [
    { id: 'overview', label: tCommon('navDashboard'), shortLabel: 'DB' },
    { id: 'stack', label: tCommon('navStack'), shortLabel: 'STK' },
    { id: 'setup', label: tCommon('navSetup'), shortLabel: 'SET' },
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
        <section id="overview" className="px-8 py-12">
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

<div className="mb-8 relative">
              <FilterPanel />
            </div>

            <div className="py-10">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
                {tDashboard('chartTitle')}
              </p>
            <OverviewChart year={selectedYear} />
          </div>

          <hr className="border-gray-100" />

          <div className="py-10">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-6">
              {tCharts('tableTitle') || 'Registro de ausencias'}
            </p>
            <AbsenceTable />
          </div>

          <hr className="border-gray-100" />

          <div className="py-10 grid grid-cols-1 xl:grid-cols-2 gap-16">
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

          <div className="py-10 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
            {stackItems.slice(0, 4).map((item) => (
              <div key={item} className="px-6 first:pl-0">
                <span className="text-xs uppercase tracking-wider text-gray-400">{item}</span>
              </div>
            ))}
          </div>

          <hr className="border-gray-100" />

          <div className="py-6 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
            {setupChecks.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </AppShell>
    </ErrorBoundary>
  );
}