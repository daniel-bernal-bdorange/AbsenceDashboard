import { useState } from 'react';

import { OverviewChart } from './components/OverviewChart';
import { FolderPicker } from './components/FolderPicker';
import { AppShell, type NavigationItem } from './components/layout/AppShell';
import { appEnv } from './config/env';
import { useTranslation } from './i18n/useTranslation';
import { useAppStore } from './store/useAppStore';

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

export function App() {
  const { selectedYear, setSelectedYear, records } = useAppStore();
  const [activeSection, setActiveSection] = useState('overview');
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');

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
    {
      id: 'overview',
      label: tCommon('navDashboard'),
      shortLabel: 'DB',
    },
    {
      id: 'stack',
      label: tCommon('navStack'),
      shortLabel: 'STK',
    },
    {
      id: 'setup',
      label: tCommon('navSetup'),
      shortLabel: 'SET',
    },
  ];

  const decadeYears = [selectedYear - 1, selectedYear, selectedYear + 1];
  const vacationData = [12, 10, 9, 14, 11, 16, 18, 14, 12, 13, 9, 8];
  const sickLeaveData = [3, 4, 2, 5, 4, 4, 6, 5, 4, 3, 2, 3];
  const specialLeaveData = [1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2];

  return (
    <AppShell
      activeSection={activeSection}
      appName={appEnv.appTitle}
      appSubtitle={tCommon('appSubtitle')}
      navigationItems={navigationItems}
      onNavigate={handleNavigate}
    >
      <section id="overview" className="surface scroll-mt-28 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orangeBusiness">
              {tDashboard('chartCardTitle')}
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-ink md:text-3xl">
              {tDashboard('chartTitle')}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted md:text-base">
              {tDashboard('chartDescription')}
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-orangeBusiness-pale bg-orangeBusiness-pale px-4 py-3 text-sm text-ink">
            <span className="font-semibold">{tDashboard('selectedYear')}</span>
            <select
              className="bg-transparent font-semibold outline-none"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {decadeYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6">
          <OverviewChart
            specialLeaveData={specialLeaveData}
            vacationData={vacationData}
            sickLeaveData={sickLeaveData}
            year={selectedYear}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section id="stack" className="surface scroll-mt-28 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orangeBusiness">
            {tDashboard('stackCardTitle')}
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {stackItems.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-orangeBusiness-pale bg-white px-4 py-3 text-sm font-medium text-ink shadow-[0_2px_10px_rgba(26,26,26,0.04)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section id="setup" className="surface scroll-mt-28 p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orangeBusiness">
            {tDashboard('setupChecklistTitle')}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {setupChecks.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-orangeBusiness-pale bg-white px-4 py-4"
              >
                <span className="font-medium text-ink-soft">{item}</span>
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  {tCommon('configured')}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
