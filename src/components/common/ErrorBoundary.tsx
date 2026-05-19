import { Component, type ReactNode, type ErrorInfo } from 'react';

import { useTranslation } from '../../i18n/useTranslation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { t } = useTranslation('errors');

      return (
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <div className="max-w-md rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h2 className="mb-2 font-display text-xl font-bold text-error">
              {t('errorTitle')}
            </h2>
            <p className="mb-4 text-sm text-ink-muted">
              {this.state.error?.message || t('errorMessage')}
            </p>
            <button
              onClick={this.handleReset}
              className="rounded-lg bg-orangeBusiness px-4 py-2 text-sm font-semibold text-white transition hover:bg-orangeBusiness-dark"
            >
              {t('retryButton')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}