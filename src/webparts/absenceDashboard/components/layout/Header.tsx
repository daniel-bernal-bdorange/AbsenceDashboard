import type { ReactNode } from 'react';

import { useTranslation } from '../../i18n/useTranslation';
import orangeBusinessLogo from '../../assets/Orange_Business_RGB_Master_Logo_Black_Text.png';

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

  return (
    <header className="border-b border-gray-100 bg-white px-8 py-5">
      <div className="flex items-start justify-between gap-8">
        <div className="flex items-center gap-5">
          <img
            src={orangeBusinessLogo}
            alt={appName}
            className="h-12 w-auto shrink-0 object-contain"
          />
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
        </div>
      </div>
    </header>
  );
}