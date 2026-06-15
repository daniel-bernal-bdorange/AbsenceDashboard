import { getAbsenceColor, getAbsenceBgColor, getStatusColor } from '../../utils/colorMap';

type BadgeVariant = 'type' | 'status' | 'regularized';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ label, variant = 'type', className = '' }: BadgeProps) {
  let bg: string;
  let fg: string;

  if (variant === 'type') {
    bg = getAbsenceBgColor(label);
    fg = getAbsenceColor(label);
  } else if (variant === 'regularized') {
    bg = '#FFF4E5';
    fg = '#9A5B00';
  } else {
    const statusColors = getStatusColor(label);
    bg = statusColors.bg;
    fg = statusColors.text;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  );
}