export const ABSENCE_COLORS: Record<string, string> = {
  'Vacaciones': '#FF6600',
  'Vacaciones año anterior': '#FF8533',
  'Baja por enfermedad': '#C62828',
  'Permiso maternity/paternidad': '#0277BD',
  'Permisos especiales/ Enfermedad u operación de un familiar': '#2E7D32',
  'Permisos especiales/ Fallecimiento familiar': '#6B4E71',
  'Permisos especiales/ Matrimonio': '#8B5CF6',
  'Permisos especiales/ Mudanza': '#0891B2',
};

export const ABSENCE_BG_COLORS: Record<string, string> = {
  'Vacaciones': '#FFF0E6',
  'Vacaciones año anterior': '#FFF4E6',
  'Baja por enfermedad': '#FFEBEE',
  'Permiso maternity/paternidad': '#E3F2FD',
  'Permisos especiales/ Enfermedad u operación de un familiar': '#E8F5E9',
  'Permisos especiales/ Fallecimiento familiar': '#F3E5F5',
  'Permisos especiales/ Matrimonio': '#EDE7F6',
  'Permisos especiales/ Mudanza': '#E0F7FA',
};

export function getAbsenceColor(type: string): string {
  return ABSENCE_COLORS[type] || '#666666';
}

export function getAbsenceBgColor(type: string): string {
  return ABSENCE_BG_COLORS[type] || '#F5F5F5';
}

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Accepted': { bg: '#E8F5E9', text: '#2E7D32' },
  'Refused': { bg: '#FFEBEE', text: '#C62828' },
  'Canceled': { bg: '#ECEFF1', text: '#546E7A' },
  'Cancellation': { bg: '#FFF3E0', text: '#F57C00' },
  'Running': { bg: '#E3F2FD', text: '#0277BD' },
  'Employee validation': { bg: '#FFF8E1', text: '#F57C00' },
  'HR validation': { bg: '#F3E5F5', text: '#7B1FA2' },
};

export function getStatusColor(status: string): { bg: string; text: string } {
  return STATUS_COLORS[status] || { bg: '#F5F5F5', text: '#666666' };
}