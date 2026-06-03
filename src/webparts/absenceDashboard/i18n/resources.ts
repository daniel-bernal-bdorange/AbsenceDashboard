import absenceTypesEn from './locales/en/absenceTypes.json';
import chartsEn from './locales/en/charts.json';
import commonEn from './locales/en/common.json';
import dashboardEn from './locales/en/dashboard.json';
import errorsEn from './locales/en/errors.json';
import filtersEn from './locales/en/filters.json';
import tableEn from './locales/en/table.json';
import absenceTypesEs from './locales/es/absenceTypes.json';
import chartsEs from './locales/es/charts.json';
import commonEs from './locales/es/common.json';
import dashboardEs from './locales/es/dashboard.json';
import errorsEs from './locales/es/errors.json';
import filtersEs from './locales/es/filters.json';
import tableEs from './locales/es/table.json';

export const resources = {
  es: {
    common: commonEs,
    dashboard: dashboardEs,
    filters: filtersEs,
    charts: chartsEs,
    table: tableEs,
    absenceTypes: absenceTypesEs,
    errors: errorsEs,
  },
  en: {
    common: commonEn,
    dashboard: dashboardEn,
    filters: filtersEn,
    charts: chartsEn,
    table: tableEn,
    absenceTypes: absenceTypesEn,
    errors: errorsEn,
  },
} as const;

export const supportedLanguages = ['es', 'en'] as const;
export const namespaces = ['common', 'dashboard', 'filters', 'charts', 'table', 'absenceTypes', 'errors'] as const;
export const defaultNamespace = 'common' as const;

export type AppLanguage = (typeof supportedLanguages)[number];
export type AppNamespace = (typeof namespaces)[number];
