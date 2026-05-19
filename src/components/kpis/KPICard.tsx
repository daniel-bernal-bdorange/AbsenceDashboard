import type { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
}

export function KPICard({ title, value, subtitle, trend, icon }: KPICardProps) {
  const trendColors = {
    up: 'text-error',
    down: 'text-success',
    neutral: 'text-gray-400',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className="flex flex-col gap-1 py-6 border-t border-gray-200">
      <span className="text-xs uppercase tracking-widest text-gray-400">{title}</span>
      <div className="flex items-baseline gap-3">
        <span className="text-5xl font-bold text-gray-900 tabular-nums">{value}</span>
        {trend && (
          <span className={`text-sm font-medium ${trendColors[trend.direction]}`}>
            {trendIcons[trend.direction]} {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}