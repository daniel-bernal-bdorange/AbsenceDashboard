import { AbsenceStatus, AbsenceType } from '../types';
import type { AbsenceRecord, RegulRecord, VacationStats } from '../types';

const BASE_DAYS = 23;
const TRIENIO_DAYS = 1;
const TRIENIO_YEARS = 3;
const MAX_ENTITLEMENT_DAYS = 26;
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
 * - Employees who arrived after refYear get 0 (they were not employed that year).
 * - Employees who arrived during refYear get a prorated amount (full months worked / 12).
 */
export function computeEntitlement(arrivalDate: Date, refYear: number): number {
  // Not employed during this year at all
  if (arrivalDate.getFullYear() > refYear) return 0;

  // Use Dec 31 so that an anniversary reached during the year (e.g. Sep 4)
  // counts toward that calendar year's entitlement.
  const dec31 = new Date(refYear, 11, 31);
  const complete = yearsComplete(arrivalDate, dec31);
  const trienios = complete < 0 ? 0 : Math.floor(complete / TRIENIO_YEARS);
  const fullEntitlement = Math.min(BASE_DAYS + trienios * TRIENIO_DAYS, MAX_ENTITLEMENT_DAYS);

  // Prorate when the employee joined mid-year: count full months worked in refYear
  if (arrivalDate.getFullYear() === refYear) {
    // Months worked = from arrival month to December (inclusive), 0-indexed
    const monthsWorked = 12 - arrivalDate.getMonth();
    return Math.ceil(fullEntitlement * monthsWorked / 12);
  }

  return fullEntitlement;
}

/**
 * Computes vacation stats for each employee code.
 *
 * @param records - All absence records (may span multiple years).
 * @param arrivalDates - Map<employeeCode, arrivalDate> from FOCUS roster.
 * @param year - The current year (Y).
 * @param regulRecords - Regularization records.
 * @param today - Reference date for expiry check (defaults to now).
 * @param exceptions - Optional map keyed `${code}|${year}` overriding the default entitlement.
 */
export function computeVacationStats(
  records: AbsenceRecord[],
  arrivalDates: Map<string, Date>,
  year: number,
  regulRecords: RegulRecord[] = [],
  today: Date = new Date(),
  exceptions: Map<string, number> = new Map(),
): Map<string, VacationStats> {
  const prevYear = year - 1;
  const carryoverDeadline = new Date(year, CARRYOVER_DEADLINE_MONTH, CARRYOVER_DEADLINE_DAY, 23, 59, 0, 0);
  const pastDeadline = today > carryoverDeadline;

  // Active = any status except Refused / Cancelled.
  // Used for computing "remaining" (includes in-progress requests).
  const isActive = (s: AbsenceStatus) =>
    s !== AbsenceStatus.REFUSED &&
    s !== AbsenceStatus.CANCELED &&
    s !== AbsenceStatus.CANCELLATION;

  const vacationAccepted = records.filter(
    (r) =>
      (r.type === AbsenceType.VACATION || r.type === AbsenceType.VACATION_PREV_YEAR) &&
      r.status === AbsenceStatus.ACCEPTED,
  );

  const vacationActive = records.filter(
    (r) =>
      (r.type === AbsenceType.VACATION || r.type === AbsenceType.VACATION_PREV_YEAR) &&
      isActive(r.status),
  );

  // Collect all employee codes present in records
  const codes = new Set<string>(records.map((r) => r.employeeCode.toLowerCase()));

  const regularizationConsumption = (employeeCode: string, targetYear: number, rowType: AbsenceType): number =>
    regulRecords
      .filter(
        (r) =>
          r.employeeCode.toLowerCase() === employeeCode &&
          r.dateToRegularise.getFullYear() === targetYear &&
          r.rowType === rowType,
      )
      .reduce((sum, r) => sum - r.expenditureQuantity, 0);

  const result = new Map<string, VacationStats>();

  const codeArray = Array.from(codes);

  for (const code of codeArray) {
    const arrival = arrivalDates.get(code);
    const entitlementY = exceptions.get(`${code}|${year}`) ?? (arrival ? computeEntitlement(arrival, year) : BASE_DAYS);
    const entitlementPrev = exceptions.get(`${code}|${prevYear}`) ?? (arrival ? computeEntitlement(arrival, prevYear) : BASE_DAYS);

    // Current year: active requests (non-refused/cancelled) — shown as "solicitadas"
    const requestedY = vacationActive
      .filter((r) => r.employeeCode.toLowerCase() === code && r.type === AbsenceType.VACATION && r.from.getFullYear() === year)
      .reduce((sum, r) => sum + r.numberOfDays, 0);

    // Current year: active requests whose start date is already in the past — shown as "disfrutadas"
    const usedY = vacationActive
      .filter((r) => r.employeeCode.toLowerCase() === code && r.type === AbsenceType.VACATION && r.from.getFullYear() === year && r.from <= today)
      .reduce((sum, r) => sum + r.numberOfDays, 0);

    // Previous year: active vacation days consumed in year Y-1
    const usedPrev = vacationActive
      .filter((r) => r.employeeCode.toLowerCase() === code && r.type === AbsenceType.VACATION && r.from.getFullYear() === prevYear)
      .reduce((sum, r) => sum + r.numberOfDays, 0);

    // Carry-over: active "Vacaciones año anterior" days consumed in year Y.
    const usedCarryover = vacationActive
      .filter(
        (r) =>
          r.employeeCode.toLowerCase() === code &&
          r.type === AbsenceType.VACATION_PREV_YEAR &&
          r.from.getFullYear() === year,
      )
      .reduce((sum, r) => sum + r.numberOfDays, 0);

    const regularizationY = regularizationConsumption(code, year, AbsenceType.VACATION);
    const regularizationPrev = regularizationConsumption(code, prevYear, AbsenceType.VACATION);
    const regularizationCarryover = regularizationConsumption(code, year, AbsenceType.VACATION_PREV_YEAR);

    const remainingY = entitlementY - requestedY - regularizationY;
    const remainingPrev = entitlementPrev - usedPrev - usedCarryover - regularizationPrev - regularizationCarryover;
    const expiredPrev = pastDeadline && remainingPrev > 0;

    console.debug(`[VacStats] ${code}: entPrev=${entitlementPrev} usedPrev=${usedPrev} carryover=${usedCarryover} remainingPrev=${remainingPrev} | activeVacRows=${vacationActive.filter((r) => r.employeeCode.toLowerCase() === code).length}`);

    result.set(code, {
      entitlementY,
      requestedY,
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
