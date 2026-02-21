import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletConnectButton } from '@/components/shared/WalletConnectButton/WalletConnectButton';
import { usePlatformStore } from '@/stores/platformStore';
import { useUiStore } from '@/stores/uiStore';
import styles from './Navbar.module.css';
import clsx from 'clsx';

// ============================================================
// Inline SVG Icons
// ============================================================

function SolTipLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SolTip Logo"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
      {/* SOL diamond shape */}
      <path
        d="M8 21.5h12.5a1 1 0 0 0 .71-.29l2.5-2.5a1 1 0 0 0 0-1.42L8 21.5z"
        fill="white"
        opacity="0.9"
      />
      <path
        d="M8 16h12.5a1 1 0 0 0 .71-.29l2.5-2.5a1 1 0 0 0 0-1.42L8 16z"
        fill="white"
        opacity="0.7"
      />
      <path
        d="M8 10.5h12.5a1 1 0 0 0 .71-.29l2.5-2.5a1 1 0 0 0 0-1.42L8 10.5z"
        fill="white"
        opacity="0.5"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ============================================================
// Nav links config
// ============================================================

const NAV_LINKS = [
  { label: 'Discover', to: '/discover' },
  { label: 'Dashboard', to: '/dashboard' },
] as const;

// ============================================================
// Navbar Component
// ============================================================

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isPaused = usePlatformStore((s) => s.isPaused);
  const { theme, toggleTheme } = useUiStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* Platform paused banner */}
      {isPaused && (
        <div className={clsx(styles.pausedBanner, 'w-full py-2 text-center text-sm font-semibold text-white tracking-wide')}>
          PLATFORM PAUSED — Tips and withdrawals are temporarily disabled
        </div>
      )}

      <nav className={styles.navbar}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Left: Logo + Nav Links */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center gap-2.5 group"
                aria-label="SolTip Home"
              >
                <SolTipLogo />
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                  SolTip
                </span>
              </Link>

              {/* Desktop nav links */}
              <div className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map(({ label, to }) => (
                  <Link
                    key={to}
                    to={to}
                    className={clsx(
                      styles.navLink,
                      'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive(to)
                        ? clsx(styles.active, 'text-[#1d1d1f] bg-black/5')
                        : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5'
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: Theme toggle + Wallet */}
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>

              {/* Wallet connect button */}
              <WalletConnectButton />

              {/* Hamburger for mobile */}
              <button
                className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                <div className={clsx(styles.hamburger, mobileOpen && styles.open)}>
                  <span />
                  <span />
                  <span />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className={clsx(styles.mobileMenu, 'md:hidden')}>
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'block px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    isActive(to)
                      ? 'text-[#1d1d1f] bg-[#9945FF]/10 border border-[#9945FF]/20'
                      : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5'
                  )}
                >
                  {label}
                </Link>
              ))}
              {/* Theme toggle in mobile menu */}
              <button
                onClick={() => { toggleTheme(); setMobileOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 rounded-lg transition-colors"
              >
                {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
