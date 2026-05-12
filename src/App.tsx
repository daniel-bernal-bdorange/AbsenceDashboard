import { useState } from 'react';

import { useAuth } from './auth/useAuth';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { OverviewChart } from './components/OverviewChart';
import { appEnv, isAuthConfigured, isSharePointConfigured } from './config/env';
import { useTranslation } from './i18n/useTranslation';
import { useAppStore } from './store/useAppStore';

const stackItems = [
  'Vite + React + TypeScript',
  'Tailwind CSS 3',
  'Apache ECharts',
  'MSAL.js',
  'Zustand',
  'i18next',
  'ESLint + Prettier',
  'GitHub Actions + Azure Static Web Apps',
];

const setupChecks = [
  {
    label: 'MSAL',
    ok: isAuthConfigured,
  },
  {
    label: 'SharePoint',
    ok: isSharePointConfigured,
  },
  {
    label: 'Tailwind',
    ok: true,
  },
  {
    label: 'ECharts',
    ok: true,
  },
];

export function App() {
  const { account, isAuthenticated, isAuthConfigured: authConfigured, signIn, signOut } = useAuth();
  const { selectedYear, setSelectedYear } = useAppStore();
  const [isBusy, setIsBusy] = useState(false);
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');

  const handleAuthClick = async () => {
    setIsBusy(true);

    try {
      if (isAuthenticated) {
        await signOut();
        return;
      }

      await signIn();
    } finally {
      setIsBusy(false);
    }
  };

  const decadeYears = [selectedYear - 1, selectedYear, selectedYear + 1];

  const vacationData = [12, 10, 9, 14, 11, 16, 18, 14, 12, 13, 9, 8];
  const sickLeaveData = [3, 4, 2, 5, 4, 4, 6, 5, 4, 3, 2, 3];
  const specialLeaveData = [1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2];

  return (
    <main className="min-h-screen bg-orange-radial text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 lg:px-10">
        <header className="rounded-[28px] border border-white/70 bg-ink shadow-soft">
          <div className="flex flex-col gap-6 px-6 py-5 text-white md:flex-row md:items-center md:justify-between md:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orangeBusiness text-2xl font-black text-white shadow-insetGlow">
                OB
              </div>
              <div>
                <p className="font-display text-sm uppercase tracking-[0.35em] text-orangeBusiness-light">
                  {tCommon('appName')}
                </p>
                <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight md:text-4xl">
                  {tDashboard('title')}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/75 md:text-base">
                  {tDashboard('subtitle')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <LanguageSwitcher />
              <button
                className="rounded-full bg-orangeBusiness px-5 py-2.5 font-medium text-white transition hover:bg-orangeBusiness-dark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!authConfigured || isBusy}
                type="button"
                onClick={handleAuthClick}
              >
                {isAuthenticated ? tCommon('signOut') : tCommon('signIn')}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="surface p-6 md:p-8">
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
          </div>

          <div className="space-y-6">
            <section className="surface p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orangeBusiness">
                {tDashboard('environmentCardTitle')}
              </p>
              <div className="mt-4 space-y-3">
                <EnvironmentLine label={tDashboard('clientId')} value={appEnv.aadClientId} />
                <EnvironmentLine label={tDashboard('tenantId')} value={appEnv.aadTenantId} />
                <EnvironmentLine label={tDashboard('redirectUri')} value={appEnv.aadRedirectUri} />
                <EnvironmentLine label={tDashboard('sharepointSiteId')} value={appEnv.sharepointSiteId || '—'} />
                <EnvironmentLine label={tDashboard('sharepointDriveId')} value={appEnv.sharepointDriveId || '—'} />
                <EnvironmentLine
                  label={tDashboard('sharepointFolderPath')}
                  value={appEnv.sharepointFolderPath}
                />
                <EnvironmentLine
                  label={tDashboard('departmentConfigFile')}
                  value={appEnv.departmentConfigFile}
                />
              </div>
            </section>

            <section className="surface p-6">
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
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="surface p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orangeBusiness">
              {tDashboard('setupChecklistTitle')}
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {setupChecks.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-orangeBusiness-pale bg-white px-4 py-4"
                >
                  <span className="font-medium text-ink-soft">{item.label}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.ok ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {item.ok ? tCommon('configured') : tCommon('notConfigured')}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orangeBusiness">
              {tDashboard('authCardTitle')}
            </p>
            <div className="mt-4 rounded-3xl bg-ink p-5 text-white">
              <p className="text-sm text-white/65">{tCommon('appSubtitle')}</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-orangeBusiness-light">
                    {tCommon('status')}
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {isAuthenticated ? tCommon('configured') : tCommon('notConfigured')}
                  </p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-orangeBusiness-light">
                    {tDashboard('user')}
                  </p>
                  <p className="mt-2 break-words text-lg font-medium text-white/90">
                    {account?.name ?? account?.username ?? tDashboard('authPending')}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

type EnvironmentLineProps = {
  label: string;
  value: string;
};

function EnvironmentLine({ label, value }: EnvironmentLineProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-orangeBusiness-pale bg-white px-4 py-3">
      <span className="max-w-[55%] text-sm font-medium text-ink-muted">{label}</span>
      <span className="break-all text-right text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
