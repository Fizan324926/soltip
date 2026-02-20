import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { ErrorFallback } from './ErrorFallback';

// ============================================================
// Types
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback UI; if omitted, <ErrorFallback> is rendered */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================
// ErrorBoundary
//
// Class component — React requires a class component for error boundaries.
// Catches errors during render, in lifecycle methods, and in constructors
// of child components.
// ============================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.resetError = this.resetError.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console in development; in production this would go to a
    // monitoring service (e.g. Sentry).
    console.error('[ErrorBoundary] Render error caught:', error, info);
    this.props.onError?.(error, info);
  }

  resetError(): void {
    this.setState({ hasError: false, error: null });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback
          error={this.state.error ?? undefined}
          resetErrorBoundary={this.resetError}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
