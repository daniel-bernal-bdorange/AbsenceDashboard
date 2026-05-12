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
  const { t: tDashboard } = useTranslation('dashboard');

  return (
    <aside
      className={`fixed inset-y-4 left-4 z-30 flex w-72 flex-col rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-soft backdrop-blur transition-all duration-300 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:flex-shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-[110%] lg:w-20 lg:translate-x-0'
      }`}
    >
      <div className={`flex items-start gap-3 ${isOpen ? '' : 'lg:flex-col lg:items-center'}`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orangeBusiness text-lg font-black text-white shadow-insetGlow">
          OB
        </div>
        <div className={`${isOpen ? '' : 'lg:hidden'}`}>
          <p className="font-display text-sm uppercase tracking-[0.28em] text-orangeBusiness">
            {tCommon('navigation')}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{tDashboard('subtitle')}</p>
        </div>
      </div>

      <nav className="mt-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = item.id === activeSection;

          return (
            <button
              key={item.id}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-full items-center rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orangeBusiness focus-visible:ring-offset-2 ${
                isActive
                  ? 'border-orangeBusiness bg-orangeBusiness text-white shadow-soft'
                  : 'border-transparent bg-white text-ink hover:border-orangeBusiness-pale hover:bg-orangeBusiness-pale'
              } ${isOpen ? 'justify-start' : 'lg:justify-center'}`}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl font-display text-xs font-black tracking-[0.25em] ${
                  isActive ? 'bg-white/15 text-white' : 'bg-orangeBusiness-pale text-orangeBusiness'
                }`}
              >
                {item.shortLabel}
              </span>
              <span className={`${isOpen ? 'ml-3' : 'lg:hidden'} font-medium`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={`mt-auto rounded-3xl bg-ink p-4 text-white ${isOpen ? '' : 'lg:hidden'}`}>
        <p className="text-xs uppercase tracking-[0.25em] text-orangeBusiness-light">{tCommon('ready')}</p>
        <p className="mt-2 text-sm text-white/70">{tCommon('sidebarHint')}</p>
      </div>
    </aside>
  );
}