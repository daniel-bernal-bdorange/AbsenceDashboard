import type { AbsenceRecord } from '../types';
import i18n from '../i18n';

export function exportCSV(
  records: AbsenceRecord[],
  filename: string = 'ausencias.csv',
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
    String(r.numberOfDays),
    r.status,
    r.sourceFile,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const escaped = String(cell).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"')
          ? `"${escaped}"`
          : escaped;
      }).join(','),
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}