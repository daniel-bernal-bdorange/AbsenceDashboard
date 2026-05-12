import { useTranslation as useI18nTranslation } from 'react-i18next';

import type { AppNamespace } from './resources';

export const useTranslation = (namespace: AppNamespace = 'common') => {
  return useI18nTranslation(namespace);
};
