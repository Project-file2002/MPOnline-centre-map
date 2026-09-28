import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
              Something went wrong
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.resetError}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = <T extends React.ComponentType<any>>(
  WrappedComponent: T,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) => {
  return (props: React.ComponentProps<T>) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
};