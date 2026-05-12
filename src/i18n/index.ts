import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { defaultNamespace, namespaces, resources, supportedLanguages } from './resources';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: supportedLanguages,
    fallbackLng: 'es',
    defaultNS: defaultNamespace,
    ns: namespaces,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ob-dashboard-lang',
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;
