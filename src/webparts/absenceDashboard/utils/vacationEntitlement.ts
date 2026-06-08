import { AbsenceStatus, AbsenceType } from '../types';
import type { AbsenceRecord, VacationStats } from '../types';

const BASE_DAYS = 23;
const TRIENIO_DAYS = 1;
const TRIENIO_YEARS = 3;
// Carry-over deadline: January 31 of the current year
const CARRYOVER_DEADLINE_MONTH = 0; // January (0-indexed)
const CARRYOVER_DEADLINE_DAY = 31;

/**
 * Returns the number of complete years between arrivalDate and refDate.
 */
const yearsComplete = (arrivalDate: Date, refDate: Date): number => {
  const years = refDate.getFullYear() - arrivalDate.getFullYear();
  const hasBirthdayPassed =
    refDate.getMonth() > arrivalDate.getMonth() ||
    (refDate.getMonth() === arrivalDate.getMonth() && refDate.getDate() >= arrivalDate.getDate());
  return hasBirthdayPassed ? years : years - 1;
};

/**
 * Computes vacation entitlement for a given year.
 * Base: 23 days + 1 per complete trienio at 01/01/Y.
 */
export function computeEntitlement(arrivalDate: Date, refYear: number): number {
  const jan1 = new Date(refYear, 0, 1);
  const complete = yearsComplete(arrivalDate, jan1);
  const trienios = complete < 0 ? 0 : Math.floor(complete / TRIENIO_YEARS);
  return BASE_DAYS + trienios * TRIENIO_DAYS;
}

/**
 * Computes vacation stats for each employee code.
 *
 * @param records - All absence records (may span multiple years).
 * @param arrivalDates - Map<employeeCode, arrivalDate> from FOCUS roster.
 * @param year - The current year (Y).
 * @param today - Reference date for expiry check (defaults to now).
 */
export function computeVacationStats(
  records: AbsenceRecord[],
  arrivalDates: Map<string, Date>,
  year: number,
  today: Date = new Date(),
): Map<string, VacationStats> {
  const prevYear = year - 1;
  const carryoverDeadline = new Date(year, CARRYOVER_DEADLINE_MONTH, CARRYOVER_DEADLINE_DAY, 23, 59, 0, 0);
  const pastDeadline = today > carryoverDeadline;

  const vacationAccepted = records.filter(
    (r) =>
      (r.type === AbsenceType.VACATION || r.type === AbsenceType.VACATION_PREV_YEAR) &&
      r.status === AbsenceStatus.ACCEPTED,
  );

  // Collect all employee codes present in records
  const codes = new Set<string>(records.map((r) => r.employeeCode.toLowerCase()));

  const result = new Map<string, VacationStats>();

  const codeArray = Array.from(codes);

  for (const code of codeArray) {
    const arrival = arrivalDates.get(code);
    const entitlementY = arrival ? computeEntitlement(arrival, year) : BASE_DAYS;
    const entitlementPrev = arrival ? computeEntitlement(arrival, prevYear) : BASE_DAYS;

    // Current year: Vacaciones accepted in year Y
    const usedY = vacationAccepted
      .filter((r) => r.employeeCode.toLowerCase() === code && r.type === AbsenceType.VACATION && r.from.getFullYear() === year)
      .reduce((sum, r) => sum + r.numberOfDays, 0);

    // Previous year: Vacaciones accepted in year Y-1
    const usedPrev = vacationAccepted
      .filter((r) => r.employeeCode.toLowerCase() === code && r.type === AbsenceType.VACATION && r.from.getFullYear() === prevYear)
      .reduce((sum, r) => sum + r.numberOfDays, 0);

    // Carry-over: "Vacaciones año anterior" accepted in year Y (enjoyed before 31/01/Y)
    const usedCarryover = vacationAccepted
      .filter(
        (r) =>
          r.employeeCode.toLowerCase() === code &&
          r.type === AbsenceType.VACATION_PREV_YEAR &&
          r.from.getFullYear() === year &&
          r.from <= carryoverDeadline,
      )
      .reduce((sum, r) => sum + r.numberOfDays, 0);

    const remainingY = entitlementY - usedY;
    const remainingPrev = entitlementPrev - usedPrev - usedCarryover;
    const expiredPrev = pastDeadline && remainingPrev > 0;

    result.set(code, {
      entitlementY,
      usedY,
      remainingY,
      entitlementPrev,
      usedPrev,
      usedCarryover,
      remainingPrev,
      expiredPrev,
    });
  }

  return result;
}
