interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
}

export function KPICard({ title, value, subtitle, trend, icon }: KPICardProps) {
  const trendColors = {
    up: 'text-error',
    down: 'text-success',
    neutral: 'text-ink-muted',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className="rounded-2xl border border-orangeBusiness-pale bg-white p-4 shadow-[0_2px_8px_rgba(26,26,26,0.08)]">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-muted">{title}</p>
        {icon && <div className="text-orangeBusiness">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold text-ink">{value}</span>
        {trend && (
          <span className={`text-sm font-semibold ${trendColors[trend.direction]}`}>
            {trendIcons[trend.direction]} {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>
      )}
    </div>
  );
}