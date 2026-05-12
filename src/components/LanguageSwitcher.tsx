import type { ChangeEvent } from 'react';

import { useTranslation } from '../i18n/useTranslation';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');

  const currentLanguage = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es';

  const handleChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    await i18n.changeLanguage(event.target.value);
  };

  return (
    <label className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-ink shadow-soft backdrop-blur">
      <span className="font-medium text-ink-muted">{t('language')}</span>
      <select
        aria-label={t('language')}
        className="cursor-pointer bg-transparent text-ink outline-none"
        value={currentLanguage}
        onChange={handleChange}
      >
        <option value="es">{t('spanish')}</option>
        <option value="en">{t('english')}</option>
      </select>
    </label>
  );
}
