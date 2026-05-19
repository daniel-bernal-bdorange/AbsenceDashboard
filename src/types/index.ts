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

export type AbsenceCategory = 'Vacation' | 'SickLeave' | 'Maternity' | 'Special';

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