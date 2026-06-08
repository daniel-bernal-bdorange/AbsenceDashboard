import * as XLSX from 'xlsx';

import {
  AbsenceStatus,
  AbsenceType,
  type AbsenceCategory,
  type AbsenceRecord,
  type EverwinAbsenceRow,
  type RegulRecord,
} from '../types';

import type { WorkBook } from 'xlsx';

const SHEET_NAMES = ['Export ASA', 'SX'];

const typeToCategory: Record<AbsenceType, AbsenceCategory> = {
  [AbsenceType.VACATION]: 'Vacation',
  [AbsenceType.VACATION_PREV_YEAR]: 'VacationPreviousYear',
  [AbsenceType.SICK_LEAVE]: 'SickLeave',
  [AbsenceType.MATERNITY_PATERNITY]: 'Maternity',
  [AbsenceType.SPECIAL_FAMILY_ILLNESS]: 'Special',
  [AbsenceType.SPECIAL_BEREAVEMENT]: 'Special',
  [AbsenceType.SPECIAL_MARRIAGE]: 'Special',
  [AbsenceType.SPECIAL_MOVING]: 'Special',
};

const absenceTypeValues = new Set<string>(Object.values(AbsenceType));
const absenceStatusValues = new Set<string>(Object.values(AbsenceStatus));

const asText = (value: unknown) => String(value ?? '').trim();

const parseRequiredText = (value: unknown, fieldName: string, sourceFile: string) => {
  const text = asText(value);

  if (!text) {
    throw new Error(`Falta campo ${fieldName} en ${sourceFile}`);
  }

  return text;
};

const parseNumber = (value: unknown, fieldName: string, sourceFile: string) => {
  const numberValue = typeof value === 'number' ? value : Number(asText(value).replace(',', '.'));

  if (Number.isNaN(numberValue)) {
    throw new Error(`Campo ${fieldName} invalido en ${sourceFile}`);
  }

  return numberValue;
};

const parseDateTime = (value: unknown, fieldName: string, sourceFile: string) => {
  if (value instanceof Date) {
    return new Date(value);
  }

  const text = parseRequiredText(value, fieldName, sourceFile);
  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  throw new Error(`Campo ${fieldName} invalido en ${sourceFile}`);
};

const parseBoundaryDate = (value: unknown, fieldName: string, sourceFile: string) => {
  console.log('parseBoundaryDate', fieldName, 'value:', value, 'type:', typeof value, 'instance:', value?.constructor?.name);

  if (value instanceof Date) {
    const d = new Date(value);
    d.setHours(23, 59, 0, 0);
    return d;
  }

  const text = parseRequiredText(value, fieldName, sourceFile);

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 0, 0);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const match = text.match(/^([0-3]\d)\/([0-1]\d)\/(\d{4})\s+(Morning|Noon|End of the day|Evening)$/);

  if (!match) {
    throw new Error(`Campo ${fieldName} invalido en ${sourceFile}`);
  }

  const [, day, month, year, boundary] = match;
  // Evening is an alias for End of the day
  const normalizedBoundary = boundary === 'Evening' ? 'End of the day' : boundary;
  const hours = normalizedBoundary === 'Morning' ? 0 : normalizedBoundary === 'Noon' ? 12 : 23;
  const minutes = normalizedBoundary === 'Morning' ? 0 : normalizedBoundary === 'Noon' ? 0 : 59;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes, 0, 0);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Campo ${fieldName} invalido en ${sourceFile}`);
  }

  return parsed;
};

const parseAbsenceType = (value: unknown, sourceFile: string) => {
  const text = parseRequiredText(value, 'Type', sourceFile);

  if (!absenceTypeValues.has(text)) {
    throw new Error(`Tipo de ausencia desconocido en ${sourceFile}: ${text}`);
  }

  return text as AbsenceType;
};

const normalizeStatusText = (raw: string): string => {
  if (raw === 'Cancelled') return 'Canceled';
  if (raw === 'In progress') return 'Running';
  return raw;
};

const parseAbsenceStatus = (value: unknown, sourceFile: string) => {
  const text = normalizeStatusText(parseRequiredText(value, 'Status', sourceFile));

  if (!absenceStatusValues.has(text)) {
    throw new Error(`Estado desconocido en ${sourceFile}: ${text}`);
  }

  return text as AbsenceStatus;
};

export function getAbsenceCategory(type: AbsenceType) {
  return typeToCategory[type];
}

const parseAbsenceRows = (rows: EverwinAbsenceRow[], sourceFile: string): AbsenceRecord[] => {
  return rows
    .filter((row) => {
      const code = String(row.Code ?? '').toLowerCase();
      return !code.startsWith('total') && !code.includes('suma') && code.trim() !== '';
    })
    .map((row) => {
    const type = parseAbsenceType(row.Type, sourceFile);

    return {
      id: crypto.randomUUID(),
      employeeCode: parseRequiredText(row.Code, 'Code', sourceFile),
      employeeUsername: parseRequiredText(row.Employee, 'Employee', sourceFile),
      type,
      category: getAbsenceCategory(type),
      from: parseBoundaryDate(row.From, 'From', sourceFile),
      till: parseBoundaryDate(row.Till, 'Till', sourceFile),
      requestDate: parseDateTime(row['Request date'], 'Request date', sourceFile),
      numberOfDays: parseNumber(row['Number of days'], 'Number of days', sourceFile),
      status: parseAbsenceStatus(row.Status, sourceFile),
      validationStatus: parseRequiredText(row['Validation status'], 'Validation status', sourceFile),
      sourceFile,
      department: undefined,
    } satisfies AbsenceRecord;
  });
};

const parseSpreadsheetXmlValue = (cell: Element) => {
  const dataCell = cell.getElementsByTagName('Data')[0];

  if (!dataCell) {
    return '';
  }

  const cellType = dataCell.getAttribute('ss:Type') ?? dataCell.getAttribute('Type') ?? 'String';
  const text = dataCell.textContent?.trim() ?? '';

  if (cellType === 'DateTime') {
    return new Date(text);
  }

  if (cellType === 'Number') {
    return Number(text);
  }

  return text;
};

const parseSpreadsheetXml = (xmlText: string, sourceFile: string): EverwinAbsenceRow[] => {
  const document = new DOMParser().parseFromString(xmlText, 'text/xml');

  if (document.querySelector('parsererror')) {
    throw new Error(`No se pudo interpretar ${sourceFile}`);
  }

  const worksheet = Array.from(document.getElementsByTagName('Worksheet')).find((node) => {
    const name = node.getAttribute('ss:Name') ?? node.getAttribute('Name') ?? '';
    return SHEET_NAMES.includes(name);
  });

  const table = worksheet?.getElementsByTagName('Table')[0];

  if (!table) {
    throw new Error(`No existe hoja ${SHEET_NAMES.join(' / ')} en ${sourceFile}`);
  }

  const rows = Array.from(table.getElementsByTagName('Row'));

  if (rows.length === 0) {
    return [];
  }

  const headers = Array.from(rows[0].getElementsByTagName('Cell')).map((cell) => String(parseSpreadsheetXmlValue(cell)));

  return rows.slice(1).map((row) => {
    const rowData: Partial<EverwinAbsenceRow> = {};
    const cells = Array.from(row.getElementsByTagName('Cell'));
    let currentIndex = 0;

    for (const cell of cells) {
      const indexValue = cell.getAttribute('ss:Index') ?? cell.getAttribute('Index');

      if (indexValue) {
        currentIndex = Number(indexValue) - 1;
      }

      const header = headers[currentIndex];

      if (header) {
        rowData[header as keyof EverwinAbsenceRow] = parseSpreadsheetXmlValue(cell) as never;
      }

      currentIndex += 1;
    }

    return rowData as EverwinAbsenceRow;
  });
};

export function parseExcelFile(workbook: WorkBook, sourceFile: string): AbsenceRecord[] {
  const sheetName = SHEET_NAMES.find((n) => workbook.Sheets[n]);

  if (!sheetName) {
    throw new Error(`No existe hoja ${SHEET_NAMES.join(' / ')} en ${sourceFile}`);
  }

  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<EverwinAbsenceRow>(worksheet, { defval: '' });

  return parseAbsenceRows(rows, sourceFile);
}

export function parseSpreadsheetXmlFile(xmlText: string, sourceFile: string): AbsenceRecord[] {
  return parseAbsenceRows(parseSpreadsheetXml(xmlText, sourceFile), sourceFile);
}

export function parseRegulFile(workbook: WorkBook, sourceFile: string): RegulRecord[] {
  const sheetName = SHEET_NAMES.find((n) => workbook.Sheets[n]);

  if (!sheetName) {
    throw new Error(`No existe hoja ${SHEET_NAMES.join(' / ')} en ${sourceFile}`);
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  return rows
    .filter((row) => absenceTypeValues.has(asText(row['Row type'])))
    .map((row) => ({
      date: parseDateTime(row['Date'], 'Date', sourceFile),
      rowType: asText(row['Row type']),
      employeeCode: parseRequiredText(row['Employee'], 'Employee', sourceFile),
      title: asText(row['Title']),
      expenditureQuantity: parseNumber(row['Expenditure quantity'], 'Expenditure quantity', sourceFile),
      dateToRegularise: parseDateTime(row['Date to regularise'], 'Date to regularise', sourceFile),
      validationStatus: asText(row['Validation status']),
      sourceFile,
    }));
}