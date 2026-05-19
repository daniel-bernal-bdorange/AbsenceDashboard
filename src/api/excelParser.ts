import * as XLSX from 'xlsx';

import { AbsenceStatus, AbsenceType, type AbsenceCategory, type AbsenceRecord } from '../types';

import type { WorkBook } from 'xlsx';

const SHEET_NAME = 'Export ASA';

type RawAbsenceRow = {
  Code?: string | number;
  Employee?: string | number;
  Type?: string | number;
  From?: string | number | Date;
  Till?: string | number | Date;
  'Request date'?: string | number | Date;
  'Number of days'?: string | number;
  Status?: string | number;
  'Validation status'?: string | number;
};

const typeToCategory: Record<AbsenceType, AbsenceCategory> = {
  [AbsenceType.VACATION]: 'Vacation',
  [AbsenceType.VACATION_PREV_YEAR]: 'Vacation',
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
  const text = parseRequiredText(value, fieldName, sourceFile);
  const match = text.match(/^([0-3]\d)\/([0-1]\d)\/(\d{4})\s+(Morning|End of the day)$/);

  if (!match) {
    throw new Error(`Campo ${fieldName} invalido en ${sourceFile}`);
  }

  const [, day, month, year, boundary] = match;
  const hours = boundary === 'Morning' ? 0 : 23;
  const minutes = boundary === 'Morning' ? 0 : 59;
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

const parseAbsenceStatus = (value: unknown, sourceFile: string) => {
  const text = parseRequiredText(value, 'Status', sourceFile);

  if (!absenceStatusValues.has(text)) {
    throw new Error(`Estado desconocido en ${sourceFile}: ${text}`);
  }

  return text as AbsenceStatus;
};

export function getAbsenceCategory(type: AbsenceType) {
  return typeToCategory[type];
}

export function parseExcelFile(workbook: WorkBook, sourceFile: string): AbsenceRecord[] {
  const worksheet = workbook.Sheets[SHEET_NAME];

  if (!worksheet) {
    throw new Error(`No existe hoja ${SHEET_NAME} en ${sourceFile}`);
  }

  const rows = XLSX.utils.sheet_to_json<RawAbsenceRow>(worksheet, { defval: '' });

  return rows.map((row) => {
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
    } satisfies AbsenceRecord;
  });
}