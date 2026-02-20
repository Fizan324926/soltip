import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Sidebar } from './Sidebar/Sidebar';
import { WalletConnectButton } from '@/components/shared/WalletConnectButton/WalletConnectButton';

// ============================================================
// DashboardLayout
//
// Auth guard: if wallet not connected, shows a "Connect wallet" prompt.
// Shows Sidebar + <Outlet /> side by side.
// Sidebar is hidden on mobile (a bottom nav is rendered instead by Sidebar).
// ============================================================

export const DashboardLayout: React.FC = () => {
  const { connected, connecting } = useWallet();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auth guard — wallet must be connected to view dashboard pages
  if (!connected && !connecting) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/10 border border-[#9945FF]/30 flex items-center justify-center">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#walletGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <defs>
                  <linearGradient id="walletGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#9945FF" />
                    <stop offset="100%" stopColor="#14F195" />
                  </linearGradient>
                </defs>
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" />
                <path d="M22 11V9a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              Connect Your Wallet
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connect your Solana wallet to access your dashboard, manage your
              profile, set up goals, and track your tip history.
            </p>
          </div>

          {/* Connect button */}
          <div className="flex justify-center">
            <WalletConnectButton />
          </div>

          {/* Supported wallets hint */}
          <p className="text-xs text-slate-600">
            Supports Phantom, Solflare, and other Solana wallets
          </p>
        </div>
      </div>
    );
  }

  // Connecting state — show a minimal spinner
  if (connecting) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg
            className="animate-spin"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-sm">Connecting wallet...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] relative">
      {/* Mobile overlay for sidebar (currently sidebar handles its own mobile bottom nav) */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header with hamburger (extra context above outlet) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-card/50">
          <button
            onClick={() => setMobileSidebarOpen((o) => !o)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white">Dashboard</span>
          <div className="w-9" aria-hidden="true" />
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
