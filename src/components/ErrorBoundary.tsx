import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-cream">
          <div className="text-center max-w-md px-8">
            <h1 className="font-serif text-2xl text-navy mb-4">Something went wrong</h1>
            <p className="font-sans text-sm text-text-muted mb-6 leading-relaxed">
              An unexpected error occurred. Please reload the application to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-navy text-white font-sans text-sm rounded hover:bg-navy/90 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
