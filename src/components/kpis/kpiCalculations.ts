import { type AbsenceRecord, AbsenceStatus } from '../../types';

const LABOR_DAYS_PER_YEAR = 248;

export interface AbsenteeismRateResult {
  rate: number;
  totalAbsenceDays: number;
  totalEmployees: number;
  laborDays: number;
}

export function calcAbsenteeismRate(
  records: AbsenceRecord[],
  year: number,
): AbsenteeismRateResult {
  const acceptedRecords = records.filter(
    (r) =>
      r.status === AbsenceStatus.ACCEPTED &&
      r.from.getFullYear() === year,
  );

  const uniqueEmployees = new Set(
    acceptedRecords.map((r) => r.employeeUsername),
  );

  const totalAbsenceDays = acceptedRecords.reduce(
    (sum, r) => sum + r.numberOfDays,
    0,
  );

  const totalEmployees = uniqueEmployees.size;
  const laborDays = totalEmployees * LABOR_DAYS_PER_YEAR;

  const rate = laborDays > 0 ? (totalAbsenceDays / laborDays) * 100 : 0;

  return {
    rate: Math.round(rate * 100) / 100,
    totalAbsenceDays: Math.round(totalAbsenceDays * 100) / 100,
    totalEmployees,
    laborDays,
  };
}

export function calcTotalAbsenceDays(
  records: AbsenceRecord[],
  year: number,
): number {
  return records
    .filter(
      (r) =>
        r.status === AbsenceStatus.ACCEPTED &&
        r.from.getFullYear() === year,
    )
    .reduce((sum, r) => sum + r.numberOfDays, 0);
}

export function calcEmployeesCurrentlyOut(records: AbsenceRecord[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return records.filter((r) => {
    const from = new Date(r.from);
    const till = new Date(r.till);
    from.setHours(0, 0, 0, 0);
    till.setHours(0, 0, 0, 0);
    return r.status === AbsenceStatus.ACCEPTED && from <= today && today <= till;
  }).length;
}

export function calcTopEmployee(records: AbsenceRecord[], year: number): {
  username: string;
  days: number;
} | null {
  const acceptedRecords = records.filter(
    (r) =>
      r.status === AbsenceStatus.ACCEPTED &&
      r.from.getFullYear() === year,
  );

  const employeeDays: Record<string, number> = {};
  for (const r of acceptedRecords) {
    employeeDays[r.employeeUsername] =
      (employeeDays[r.employeeUsername] || 0) + r.numberOfDays;
  }

  let topUsername: string | null = null;
  let maxDays = 0;

  for (const [username, days] of Object.entries(employeeDays)) {
    if (days > maxDays) {
      maxDays = days;
      topUsername = username;
    }
  }

  return topUsername ? { username: topUsername, days: maxDays } : null;
}

export function calcMostFrequentAbsenceType(
  records: AbsenceRecord[],
  year: number,
): string | null {
  const acceptedRecords = records.filter(
    (r) =>
      r.status === AbsenceStatus.ACCEPTED &&
      r.from.getFullYear() === year,
  );

  const typeCount: Record<string, number> = {};
  for (const r of acceptedRecords) {
    typeCount[r.type] = (typeCount[r.type] || 0) + 1;
  }

  let mostFrequent: string | null = null;
  let maxCount = 0;

  for (const [type, count] of Object.entries(typeCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = type;
    }
  }

  return mostFrequent;
}

export function calcAbsenteeismRateComparison(
  records: AbsenceRecord[],
  currentYear: number,
): { rate: number; delta: number; direction: 'up' | 'down' | 'neutral' } {
  const current = calcAbsenteeismRate(records, currentYear);
  const previous = calcAbsenteeismRate(records, currentYear - 1);

  const delta = current.rate - previous.rate;

  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (delta > 0.01) direction = 'up';
  else if (delta < -0.01) direction = 'down';

  return {
    rate: current.rate,
    delta: Math.round(delta * 100) / 100,
    direction,
  };
}