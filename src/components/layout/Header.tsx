import type { ReactNode } from 'react';

import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

type HeaderProps = {
  appName: string;
  appSubtitle: string;
  languageSwitcher: ReactNode;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
};

export function Header({
  appName,
  appSubtitle,
  languageSwitcher,
  onToggleSidebar,
  sidebarOpen,
}: HeaderProps) {
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const { folderName, clearRecords } = useAppStore();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-8 py-5">
      <div className="flex items-start justify-between gap-8">
        <div className="flex items-center gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-orangeBusiness text-xl font-black text-white">
            OB
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-orangeBusiness font-medium">
              {appName}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              {tDashboard('title')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{appSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            aria-label={sidebarOpen ? tCommon('hideSidebar') : tCommon('showSidebar')}
            className="hidden items-center gap-2 text-sm text-gray-500 hover:text-gray-900 lg:hidden"
            type="button"
            onClick={onToggleSidebar}
          >
            <span className="text-lg">☰</span>
          </button>

          {languageSwitcher}

          <button
            className="bg-orangeBusiness px-5 py-2 text-sm font-medium text-white hover:bg-orangeBusiness-dark"
            type="button"
            onClick={clearRecords}
          >
            {tDashboard('changeFolder')}
          </button>

          <span className="hidden text-sm text-gray-400 md:block">
            {folderName ?? '—'}
          </span>
        </div>
      </div>
    </header>
  );
}