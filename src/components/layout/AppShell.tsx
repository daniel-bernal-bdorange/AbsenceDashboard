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
    <main className="min-h-screen bg-orange-radial text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
        <Header
          appName={appName}
          appSubtitle={appSubtitle}
          languageSwitcher={<LanguageSwitcher />}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />

        <div className="relative flex flex-1 gap-4">
          {sidebarOpen ? (
            <button
              aria-label={tCommon('hideSidebar')}
              className="fixed inset-0 z-20 bg-ink/35 lg:hidden"
              type="button"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}

          <Sidebar
            activeSection={activeSection}
            isOpen={sidebarOpen}
            navigationItems={navigationItems}
            onNavigate={handleNavigate}
          />

          <div className="relative z-0 flex min-w-0 flex-1 flex-col pb-6">
            <div className="grid gap-6">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}