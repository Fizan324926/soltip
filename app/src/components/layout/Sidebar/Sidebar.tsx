import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatPublicKey } from '@/lib/solana/utils';
import clsx from 'clsx';
import styles from './Sidebar.module.css';

// ============================================================
// Inline SVG Icons
// ============================================================

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function GoalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function SubscriptionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16" y1="3" x2="21" y2="3" />
      <line x1="16" y1="21" x2="21" y2="21" />
      <line x1="4" y1="12" x2="21" y2="12" />
      <polyline points="16 8 21 3 16 3" />
      <polyline points="21 21 16 21 21 16" />
      <polyline points="4 3 9 8 4 12 9 16 4 21" />
    </svg>
  );
}

function TransactionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

// ============================================================
// Nav items config
// ============================================================

const NAV_ITEMS = [
  { label: 'Overview', to: '/dashboard', icon: <OverviewIcon />, exact: true },
  { label: 'Goals', to: '/dashboard/goals', icon: <GoalIcon />, exact: false },
  { label: 'Subscriptions', to: '/dashboard/subscriptions', icon: <SubscriptionIcon />, exact: false },
  { label: 'Splits', to: '/dashboard/splits', icon: <SplitIcon />, exact: false },
  { label: 'Transactions', to: '/dashboard/transactions', icon: <TransactionIcon />, exact: false },
] as const;

// ============================================================
// Sidebar Component
// ============================================================

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const { publicKey } = useWallet();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const shortAddress = publicKey ? formatPublicKey(publicKey, 4) : null;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          styles.sidebar,
          collapsed && styles.collapsed,
          'flex flex-col',
          className
        )}
      >
        {/* User profile section */}
        <div className={clsx(styles.avatarSection, 'flex items-center gap-3 px-4 py-5 border-b border-surface-border')}>
          {/* Avatar */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-white text-sm font-bold">
            {publicKey ? publicKey.toBase58().slice(0, 2).toUpperCase() : '??'}
          </div>
          {/* User info */}
          <div className={clsx('userInfo', 'min-w-0')}>
            <div className="text-sm font-semibold text-white truncate">
              My Profile
            </div>
            {shortAddress && (
              <div className="text-xs text-slate-500 font-mono truncate">
                {shortAddress}
              </div>
            )}
          </div>
        </div>

        {/* Navigation section */}
        <nav className="flex-1 px-2 py-4 space-y-0.5" aria-label="Dashboard navigation">
          <div className={clsx('sectionTitle', 'px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600')}>
            Navigation
          </div>
          {NAV_ITEMS.map(({ label, to, icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={clsx(
                  styles.navItem,
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  active
                    ? 'text-white bg-[#9945FF]/20 border border-[#9945FF]/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <span className={clsx('flex-shrink-0', active ? 'text-[#9945FF]' : '')}>
                  {icon}
                </span>
                <span className={clsx(styles.label)}>{label}</span>
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#9945FF]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-2 pb-4">
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-colors',
              collapsed && 'justify-center'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className={clsx(styles.collapseBtn, collapsed && styles.rotated)}>
              <ChevronLeftIcon />
            </span>
            {!collapsed && <span className={styles.label}>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className={clsx(styles.mobileBottomNav)} aria-label="Mobile bottom navigation">
        <div className="flex items-stretch justify-around h-16 px-2">
          {NAV_ITEMS.map(({ label, to, icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 flex-1 px-1 text-[10px] font-medium transition-colors',
                  active ? 'text-[#9945FF]' : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <span className={active ? 'text-[#9945FF]' : ''}>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
