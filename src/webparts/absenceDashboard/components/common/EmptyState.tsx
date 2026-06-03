interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon = '📭', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-full bg-orangeBusiness px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orangeBusiness-dark"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function NoDataState({ message }: { message?: string }) {
  return (
    <EmptyState
      title={message || 'Sin datos'}
      description="No hay registros que mostrar con los filtros actuales."
      icon="📊"
    />
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      title="Error"
      description={message}
      icon="⚠️"
      action={onRetry ? { label: 'Reintentar', onClick: onRetry } : undefined}
    />
  );
}