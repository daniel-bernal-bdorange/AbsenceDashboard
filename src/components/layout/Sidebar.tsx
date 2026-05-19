import { useTranslation } from '../../i18n/useTranslation';

import type { NavigationItem } from './AppShell';

type SidebarProps = {
  activeSection: string;
  isOpen: boolean;
  navigationItems: NavigationItem[];
  onNavigate: (sectionId: string) => void;
};

export function Sidebar({ activeSection, isOpen, navigationItems, onNavigate }: SidebarProps) {
  const { t: tCommon } = useTranslation('common');

  return (
    <aside
      className={`sticky top-[97px] hidden h-[calc(100vh-97px)] w-48 flex-shrink-0 flex-col border-r border-gray-100 lg:flex ${isOpen ? '' : ''}`}
    >
      <nav className="flex flex-col gap-1 py-4">
        {navigationItems.map((item) => {
          const isActive = item.id === activeSection;

          return (
            <button
              key={item.id}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 border-l-2 px-4 py-3 text-left text-sm transition ${
                isActive
                  ? 'border-orangeBusiness bg-orangeBusiness/5 font-medium text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-50'
              }`}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <span className="text-xs font-bold tracking-wider">{item.shortLabel}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}