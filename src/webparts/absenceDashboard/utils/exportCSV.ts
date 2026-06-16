import * as XLSX from 'xlsx';
import type { AbsenceRecord } from '../types';
import i18n from '../i18n';

export function exportCSV(
  records: AbsenceRecord[],
  filename: string = 'ausencias.xlsx',
): void {
  const lang = i18n.language.startsWith('en') ? 'en' : 'es';

  const headers =
    lang === 'es'
      ? ['Empleado', 'Tipo', 'Desde', 'Hasta', 'Días', 'Estado', 'Fichero origen']
      : ['Employee', 'Type', 'From', 'Till', 'Days', 'Status', 'Source file'];

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const rows = records.map((r) => [
    r.employeeUsername,
    r.type,
    formatDate(r.from),
    formatDate(r.till),
    r.numberOfDays,
    r.status,
    r.sourceFile,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, lang === 'es' ? 'Ausencias' : 'Absences');
  XLSX.writeFile(workbook, filename);
}