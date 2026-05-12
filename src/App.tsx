import { useEffect, useState } from 'react';

import { InteractionStatus } from '@azure/msal-browser';

import { useAuth } from './auth/useAuth';
import { OverviewChart } from './components/OverviewChart';
import { AppShell, type NavigationItem } from './components/layout/AppShell';
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

const autoLoginRequestKey = 'ob-dashboard:auto-login-requested';
const autoLoginSuppressedKey = 'ob-dashboard:auto-login-suppressed';

const getSessionFlag = (key: string) => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.sessionStorage.getItem(key) === 'true';
};

const setSessionFlag = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(key, value);
};

const clearSessionFlag = (key: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(key);
};

export function App() {
  const {
    account,
    inProgress,
    isAccessDenied,
    isAuthenticated,
    isAuthConfigured: authConfigured,
    signIn,
    signOut,
  } = useAuth();
  const { selectedYear, setSelectedYear } = useAppStore();
  const [isBusy, setIsBusy] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');

  useEffect(() => {
    if (!authConfigured) {
      clearSessionFlag(autoLoginRequestKey);
      clearSessionFlag(autoLoginSuppressedKey);
      return;
    }

    if (isAuthenticated) {
      clearSessionFlag(autoLoginRequestKey);
      return;
    }

    if (inProgress !== InteractionStatus.None) {
      return;
    }

    if (getSessionFlag(autoLoginSuppressedKey) || getSessionFlag(autoLoginRequestKey)) {
      return;
    }

    setSessionFlag(autoLoginRequestKey, 'true');
    void signIn();
  }, [authConfigured, inProgress, isAuthenticated, signIn]);

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
      id: 'environment',
      label: tCommon('navEnvironment'),
      shortLabel: 'ENV',
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
    {
      id: 'auth',
      label: tCommon('navAuth'),
      shortLabel: 'AUTH',
    },
  ];

  const decadeYears = [selectedYear - 1, selectedYear, selectedYear + 1];

  const vacationData = [12, 10, 9, 14, 11, 16, 18, 14, 12, 13, 9, 8];
  const sickLeaveData = [3, 4, 2, 5, 4, 4, 6, 5, 4, 3, 2, 3];
  const specialLeaveData = [1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2];

  if (authConfigured && isAccessDenied) {
    return (
      <AuthStateScreen
        actionLabel={tCommon('accessDeniedAction')}
        description={tCommon('accessDeniedDescription')}
        onAction={handleAuthClick}
        title={tCommon('accessDeniedTitle')}
      />
    );
  }

  if (authConfigured && !isAuthenticated) {
    const isAutoLoginSuppressed = getSessionFlag(autoLoginSuppressedKey);

    if (isAutoLoginSuppressed) {
      return (
        <AuthStateScreen
          actionLabel={tCommon('signIn')}
          description={tCommon('authPromptDescription')}
          onAction={handleAuthClick}
          title={tCommon('authPromptTitle')}
        />
      );
    }

    return <AuthStateScreen description={tCommon('signingIn')} title={tCommon('authChecking')} />;
  }

  return (
    <AppShell
      activeSection={activeSection}
      accountEmail={account?.username ?? null}
      accountName={account?.name ?? account?.username ?? null}
      appName={tCommon('appName')}
      appSubtitle={tDashboard('subtitle')}
      authConfigured={authConfigured}
      isAuthenticated={isAuthenticated}
      isBusy={isBusy}
      navigationItems={navigationItems}
      onAuthAction={handleAuthClick}
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
        <section id="environment" className="surface scroll-mt-28 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orangeBusiness">
            {tDashboard('environmentCardTitle')}
          </p>
          <div className="mt-4 space-y-3">
            <EnvironmentLine label={tDashboard('clientId')} value={appEnv.aadClientId} />
            <EnvironmentLine label={tDashboard('tenantId')} value={appEnv.aadTenantId} />
            <EnvironmentLine label={tDashboard('redirectUri')} value={appEnv.aadRedirectUri} />
            <EnvironmentLine label={tDashboard('sharepointSiteId')} value={appEnv.sharepointSiteId || '—'} />
            <EnvironmentLine label={tDashboard('sharepointDriveId')} value={appEnv.sharepointDriveId || '—'} />
            <EnvironmentLine label={tDashboard('sharepointFolderPath')} value={appEnv.sharepointFolderPath} />
            <EnvironmentLine
              label={tDashboard('departmentConfigFile')}
              value={appEnv.departmentConfigFile}
            />
          </div>
        </section>

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
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section id="setup" className="surface scroll-mt-28 p-6 md:p-8">
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

        <section id="auth" className="surface scroll-mt-28 p-6 md:p-8">
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
      </div>
    </AppShell>
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

type AuthStateScreenProps = {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
};

function AuthStateScreen({ actionLabel, description, onAction, title }: AuthStateScreenProps) {
  const { t: tCommon } = useTranslation('common');

  return (
    <main className="min-h-screen bg-orange-radial text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-6 md:px-6 lg:px-8">
        <section className="surface w-full p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orangeBusiness">
            {tCommon('appName')}
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink md:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm text-ink-muted md:text-base">{description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {actionLabel && onAction ? (
              <button
                className="rounded-full bg-orangeBusiness px-5 py-2.5 font-medium text-white transition hover:bg-orangeBusiness-dark"
                type="button"
                onClick={onAction}
              >
                {actionLabel}
              </button>
            ) : null}

            {!actionLabel ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-orangeBusiness-pale bg-orangeBusiness-pale px-4 py-2 text-sm font-medium text-orangeBusiness-dark">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-orangeBusiness" />
                {tCommon('loading')}
              </span>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
