import type { ReactNode } from 'react';

import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

import { LanguageSwitcher } from '../LanguageSwitcher';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

export type NavigationItem = {
  id: string;
  label: string;
  shortLabel: string;
};

type AppShellProps = {
  activeSection: string;
  appName: string;
  appSubtitle: string;
  children: ReactNode;
  navigationItems: NavigationItem[];
  onNavigate: (sectionId: string) => void;
};

export function AppShell({
  activeSection,
  appName,
  appSubtitle,
  children,
  navigationItems,
  onNavigate,
}: AppShellProps) {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const { t: tCommon } = useTranslation('common');

  const handleNavigate = (sectionId: string) => {
    onNavigate(sectionId);

    if (window.matchMedia('(max-width: 1023px)').matches) {
      setSidebarOpen(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-screen-xl">
        <Header
          appName={appName}
          appSubtitle={appSubtitle}
          languageSwitcher={<LanguageSwitcher />}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />

        <div className="flex">
          <Sidebar
            activeSection={activeSection}
            isOpen={sidebarOpen}
            navigationItems={navigationItems}
            onNavigate={handleNavigate}
          />

          <div className="relative z-0 flex min-w-0 flex-1 flex-col">
            <div>{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}