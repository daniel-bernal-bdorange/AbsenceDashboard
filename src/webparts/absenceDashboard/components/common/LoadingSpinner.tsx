interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full border-orangeBusiness/20 border-t-orangeBusiness ${sizeClasses[size]}`}
      />
      {message && (
        <p className="text-sm font-medium text-ink-muted">{message}</p>
      )}
    </div>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="rounded-2xl bg-white px-8 py-6 shadow-lg">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
}