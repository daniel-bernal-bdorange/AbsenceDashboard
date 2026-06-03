import { format, formatDistance, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay } from 'date-fns';
import { es, enGB } from 'date-fns/locale';
import i18n from '../i18n';

const getLocale = () => {
  const lang = i18n.language.startsWith('en') ? enGB : es;
  return lang;
};

export const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yyyy', { locale: getLocale() });
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'dd/MM/yyyy HH:mm', { locale: getLocale() });
};

export const formatMonthYear = (date: Date): string => {
  return format(date, 'MMMM yyyy', { locale: getLocale() });
};

export const formatShortMonth = (date: Date): string => {
  return format(date, 'MMM', { locale: getLocale() });
};

export const formatRelative = (date: Date): string => {
  return formatDistance(date, new Date(), { addSuffix: true, locale: getLocale() });
};

export const getMonthDays = (year: number, month: number): Date[] => {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start, end });
};

export const isWeekendDay = (date: Date): boolean => {
  return isWeekend(date);
};

export const isSameDayCheck = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

export const getMonthName = (month: number): string => {
  const date = new Date(2000, month, 1);
  return format(date, 'MMMM', { locale: getLocale() });
};

export const getShortMonthNames = (): string[] => {
  return Array.from({ length: 12 }, (_, i) => getMonthName(i));
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat(i18n.language.startsWith('en') ? 'en-GB' : 'es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatPercent = (value: number, decimals: number = 1): string => {
  return formatNumber(value, decimals) + '%';
};