import type { ChangeEvent } from 'react';

import { useTranslation } from '../i18n/useTranslation';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');

  const currentLanguage = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es';

  const handleChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    await i18n.changeLanguage(event.target.value);
  };

  return (
    <label className="flex items-center gap-2 text-sm text-gray-500">
      <span className="font-medium">{t('language')}</span>
      <select
        aria-label={t('language')}
        className="cursor-pointer bg-transparent font-medium text-gray-900 outline-none"
        value={currentLanguage}
        onChange={handleChange}
      >
        <option value="es">{t('spanish')}</option>
        <option value="en">{t('english')}</option>
      </select>
    </label>
  );
}