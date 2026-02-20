import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// ── Providers ────────────────────────────────────────────────
import { ThemeProvider }  from './providers/ThemeProvider';
import { WalletProvider } from './providers/WalletProvider';
import { QueryProvider }  from './providers/QueryProvider';
import { ToastProvider }  from './providers/ToastProvider';

// ── Root component ───────────────────────────────────────────
import App from './App';

// ── Global styles (order matters: base → theme → fonts → animations) ─
import './styles/fonts.css';
import './styles/theme.css';
import './styles/globals.css';
import './styles/animations.css';

// ============================================================
// Error Boundary – catches React render errors
// ============================================================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SolTip] React Error Boundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
          color: '#e2e8f0',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ff6b6b' }}>
            Something went wrong
          </h1>
          <p style={{
            background: '#131325',
            padding: '1rem',
            borderRadius: '8px',
            maxWidth: '600px',
            overflow: 'auto',
            fontSize: '0.875rem',
            color: '#f5a623',
            textAlign: 'left',
          }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 2rem',
              background: '#9945ff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// Bootstrap
// ============================================================
const container = document.getElementById('root');

if (!container) {
  throw new Error(
    '[SolTip] Root element #root not found. ' +
    'Make sure index.html has <div id="root"></div>.'
  );
}

const root = createRoot(container);

// Remove the HTML initial loader as soon as React mounts
const initialLoader = document.getElementById('initial-loader');
if (initialLoader) initialLoader.remove();

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <WalletProvider>
          <QueryProvider>
            <ToastProvider />
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </QueryProvider>
        </WalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
