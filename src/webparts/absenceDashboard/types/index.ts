export enum AbsenceType {
  VACATION = 'Vacaciones',
  VACATION_PREV_YEAR = 'Vacaciones año anterior',
  SICK_LEAVE = 'Baja por enfermedad',
  MATERNITY_PATERNITY = 'Permiso maternidad/paternidad',
  SPECIAL_FAMILY_ILLNESS = 'Permisos especiales/ Enfermedad u operación de un familiar',
  SPECIAL_BEREAVEMENT = 'Permisos especiales/ Fallecimiento familiar',
  SPECIAL_MARRIAGE = 'Permisos especiales/ Matrimonio',
  SPECIAL_MOVING = 'Permisos especiales/ Mudanza',
}

export enum AbsenceStatus {
  ACCEPTED = 'Accepted',
  REFUSED = 'Refused',
  CANCELED = 'Canceled',
  CANCELLATION = 'Cancellation',
  RUNNING = 'Running',
  EMPLOYEE_VALIDATION = 'Employee validation',
  HR_VALIDATION = 'HR validation',
}

export type Department = 'Prod' | 'BackOffice' | 'Unknown';

export type AbsenceCategory = 'Vacation' | 'VacationPreviousYear' | 'SickLeave' | 'Maternity' | 'Special';

export interface EverwinAbsenceRow {
  Code: string;
  Employee: string;
  Type: AbsenceType;
  From: string | Date;
  Till: string | Date;
  'Request date': string | Date;
  'Number of days': number;
  Status: AbsenceStatus;
  'Validation status': string;
}

export interface EmployeeRosterRow {
  Code: string;
  Name: string;
  'First name': string;
  'Primary entity': string;
  'Resource type': string;
  Check: string;
  'HC/FTE': number;
}

export interface DepartmentSummaryRow {
  'Row Labels': string;
  'Sum of HC/FTE': number;
}

export interface Employee {
  code: string;
  username: string;
  displayName: string;
  department: Department;
}

export interface AbsenceRecord {
  id: string;
  employeeCode: string;
  employeeUsername: string;
  department: Department | undefined;
  type: AbsenceType;
  category: AbsenceCategory;
  from: Date;
  till: Date;
  requestDate: Date;
  numberOfDays: number;
  status: AbsenceStatus;
  validationStatus: string;
  sourceFile: string;
}

export interface AbsenceDayRecord {
  id: string;
  originalAbsenceId: string;
  date: Date;
  isFullDay: boolean;
  employeeCode: string;
  employeeUsername: string;
  department: Department | undefined;
  type: AbsenceType;
  category: AbsenceCategory;
  status: AbsenceStatus;
  validationStatus: string;
  sourceFile: string;
}

export const DAY_RECORD_FULL = 1;
export const DAY_RECORD_HALF = 0.5;

export function getDayValue(isFullDay: boolean): number {
  return isFullDay ? DAY_RECORD_FULL : DAY_RECORD_HALF;
}