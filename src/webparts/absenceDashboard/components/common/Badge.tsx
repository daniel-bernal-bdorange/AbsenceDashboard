import { getAbsenceColor, getAbsenceBgColor, getStatusColor } from '../../utils/colorMap';

type BadgeVariant = 'type' | 'status' | 'regularized';

interface BadgeProps {
  label: string;
  colorKey?: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ label, colorKey, variant = 'type', className = '' }: BadgeProps) {
  let bg: string;
  let fg: string;

  if (variant === 'type') {
    bg = getAbsenceBgColor(colorKey ?? label);
    fg = getAbsenceColor(colorKey ?? label);
  } else if (variant === 'regularized') {
    bg = '#FFF4E5';
    fg = '#9A5B00';
  } else {
    const statusColors = getStatusColor(colorKey ?? label);
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