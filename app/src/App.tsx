import React, { Suspense, lazy, type FC } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useWalletAuth } from './hooks/useWalletAuth';

// ============================================================
// Lazy page imports
// Each page is a separate code-split chunk for fast initial load.
// ============================================================
const LandingPage            = lazy(() => import('./pages/LandingPage'));
const DiscoveryPage          = lazy(() => import('./pages/DiscoveryPage'));
const OnboardingPage         = lazy(() => import('./pages/OnboardingPage'));
const AdminPage              = lazy(() => import('./pages/AdminPage'));
const ProfilePage            = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage           = lazy(() => import('./pages/NotFoundPage'));

// Dashboard layout + nested pages
const DashboardLayout        = lazy(() => import('./pages/dashboard/DashboardLayout'));
const DashboardOverview      = lazy(() => import('./pages/dashboard/DashboardOverview'));
const DashboardGoals         = lazy(() => import('./pages/dashboard/DashboardGoals'));
const DashboardSubscriptions = lazy(() => import('./pages/dashboard/DashboardSubscriptions'));
const DashboardSplits        = lazy(() => import('./pages/dashboard/DashboardSplits'));
const DashboardTransactions  = lazy(() => import('./pages/dashboard/DashboardTransactions'));

// ============================================================
// Loading fallback – shown while any lazy page chunk is loading
// ============================================================
const PageLoader: FC = () => (
  <div
    className="flex min-h-screen items-center justify-center"
    style={{ background: 'var(--surface-base)' }}
  >
    <div className="flex flex-col items-center gap-4">
      {/* Spinning gradient ring */}
      <div
        className="h-12 w-12 rounded-full animate-spin-medium"
        style={{
          background: 'conic-gradient(from 0deg, #9945ff, #14f195, #9945ff)',
          padding: '2px',
        }}
      >
        <div
          className="h-full w-full rounded-full"
          style={{ background: 'var(--surface-base)' }}
        />
      </div>
      <p
        className="text-sm animate-pulse"
        style={{ color: 'var(--text-secondary)' }}
      >
        Loading…
      </p>
    </div>
  </div>
);

// ============================================================
// App
// ============================================================
const App: FC = () => {
  useWalletAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public pages ──────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/discover" element={<DiscoveryPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/admin" element={<AdminPage />} />

        {/* ── Dashboard (nested layout) ──────────────────── */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Index redirects to the overview sub-route */}
          <Route index element={<DashboardOverview />} />
          <Route path="goals"         element={<DashboardGoals />} />
          <Route path="subscriptions" element={<DashboardSubscriptions />} />
          <Route path="splits"        element={<DashboardSplits />} />
          <Route path="transactions"  element={<DashboardTransactions />} />
          {/* Fallback for unknown dashboard sub-routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* ── Creator profile – MUST come after all named paths ── */}
        <Route path="/:username" element={<ProfilePage />} />

        {/* ── 404 catch-all ──────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default App;
