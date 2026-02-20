import React from 'react';
import { Link } from 'react-router-dom';

// ============================================================
// ErrorFallback
//
// Rendered by ErrorBoundary when a render error is caught.
// ============================================================

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

function WarningIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent-warning"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div
      role="alert"
      className="flex min-h-[40vh] items-center justify-center px-4"
    >
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-accent-warning/10 border border-accent-warning/30 flex items-center justify-center">
            <WarningIcon />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            An unexpected error occurred while rendering this page. The error
            has been logged.
          </p>
        </div>

        {/* Error detail (collapsed) */}
        {error && (
          <details className="text-left bg-surface-elevated border border-surface-border rounded-lg overflow-hidden">
            <summary className="px-4 py-3 text-xs font-medium text-slate-400 cursor-pointer hover:text-white hover:bg-white/5 transition-colors select-none">
              Error details
            </summary>
            <div className="px-4 pb-4">
              <pre className="text-xs text-accent-error font-mono mt-2 overflow-auto max-h-40 leading-relaxed whitespace-pre-wrap break-words">
                {error.message}
                {error.stack ? `\n\n${error.stack}` : ''}
              </pre>
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#9945FF] hover:bg-[#8833EE] text-white text-sm font-semibold transition-colors"
            >
              <RefreshIcon />
              Try Again
            </button>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-surface-border text-slate-300 hover:text-white hover:border-slate-500 text-sm font-medium transition-colors"
          >
            <HomeIcon />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
