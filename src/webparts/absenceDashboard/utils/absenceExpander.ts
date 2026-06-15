import { isWeekend } from 'date-fns';
import type { AbsenceRecord, AbsenceDayRecord } from '../types';

function normalizeDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function expandToDailyRecords(record: AbsenceRecord): AbsenceDayRecord[] {
  const from = normalizeDate(record.from);
  const till = normalizeDate(record.till);
  const results: AbsenceDayRecord[] = [];

  if (record.numberOfDays < 1) {
    if (!isWeekend(from)) {
      results.push(makeDayRecord(record, from, false));
    }
    return results;
  }

  const current = new Date(from);
  while (current <= till) {
    if (!isWeekend(current)) {
      results.push(makeDayRecord(record, current, true));
    }
    current.setDate(current.getDate() + 1);
  }

  return results;
}

function makeDayRecord(
  record: AbsenceRecord,
  date: Date,
  isFullDay: boolean,
): AbsenceDayRecord {
  return {
    id: crypto.randomUUID(),
    originalAbsenceId: record.id,
    date: new Date(date),
    isFullDay,
    employeeCode: record.employeeCode,
    employeeUsername: record.employeeUsername,
    department: record.department,
    type: record.type,
    category: record.category,
    status: record.status,
    validationStatus: record.validationStatus,
    sourceFile: record.sourceFile,
    regularized: record.regularized,
    regularizedDelta: record.regularizedDelta,
  };
}
