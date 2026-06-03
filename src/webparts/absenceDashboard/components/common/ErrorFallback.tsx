import { useTranslation } from '../../i18n/useTranslation';

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const { t } = useTranslation('errors');

  return (
    <div className="flex min-h-[200px] items-center justify-center p-8">
      <div className="max-w-md rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h2 className="mb-2 font-display text-xl font-bold text-error">
          {t('errorTitle')}
        </h2>
        <p className="mb-4 text-sm text-ink-muted">
          {error?.message || t('errorMessage')}
        </p>
        <button
          onClick={onReset}
          className="rounded-lg bg-orangeBusiness px-4 py-2 text-sm font-semibold text-white transition hover:bg-orangeBusiness-dark"
        >
          {t('retryButton')}
        </button>
      </div>
    </div>
  );
}