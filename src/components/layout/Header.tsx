import type { ReactNode } from 'react';

import { useTranslation } from '../../i18n/useTranslation';

const getInitials = (name?: string | null) => {
  const trimmedName = name?.trim();

  if (!trimmedName) {
    return 'OB';
  }

  const initials = trimmedName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'OB';
};

type HeaderProps = {
  accountEmail?: string | null;
  accountName?: string | null;
  appName: string;
  appSubtitle: string;
  authConfigured: boolean;
  isAuthenticated: boolean;
  isBusy: boolean;
  languageSwitcher: ReactNode;
  onAuthAction: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
};

export function Header({
  accountEmail,
  accountName,
  appName,
  appSubtitle,
  authConfigured,
  isAuthenticated,
  isBusy,
  languageSwitcher,
  onAuthAction,
  onToggleSidebar,
  sidebarOpen,
}: HeaderProps) {
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');

  return (
    <header className="rounded-[28px] border border-white/70 bg-ink shadow-soft">
      <div className="flex flex-col gap-5 px-5 py-5 text-white md:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orangeBusiness text-2xl font-black text-white shadow-insetGlow">
            OB
          </div>
          <div>
            <p className="font-display text-xs uppercase tracking-[0.35em] text-orangeBusiness-light">
              {appName}
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight md:text-4xl">
              {tDashboard('title')}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/75 md:text-base">{appSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <button
              aria-label={sidebarOpen ? tCommon('hideSidebar') : tCommon('showSidebar')}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 lg:hidden"
              type="button"
              onClick={onToggleSidebar}
            >
              <span className="text-base">☰</span>
              <span>{sidebarOpen ? tCommon('hideSidebar') : tCommon('showSidebar')}</span>
            </button>

            {languageSwitcher}

            {isAuthenticated ? (
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orangeBusiness text-sm font-black text-white shadow-insetGlow">
                  {getInitials(accountName ?? accountEmail)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {accountName ?? tDashboard('user')}
                  </p>
                  {accountEmail ? (
                    <p className="truncate text-xs text-white/65">{accountEmail}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <button
              className="rounded-full bg-orangeBusiness px-5 py-2.5 font-medium text-white transition hover:bg-orangeBusiness-dark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!authConfigured || isBusy}
              type="button"
              onClick={onAuthAction}
            >
              {isAuthenticated ? tCommon('signOut') : tCommon('signIn')}
            </button>
          </div>

          {!isAuthenticated ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {tDashboard('authPending')}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}