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

function PollIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

function GateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ReferralIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

interface NavSection {
  title: string;
  items: readonly { label: string; to: string; icon: React.ReactNode; exact: boolean }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Overview', to: '/dashboard', icon: <OverviewIcon />, exact: true },
      { label: 'Goals', to: '/dashboard/goals', icon: <GoalIcon />, exact: false },
      { label: 'Subscriptions', to: '/dashboard/subscriptions', icon: <SubscriptionIcon />, exact: false },
      { label: 'Splits', to: '/dashboard/splits', icon: <SplitIcon />, exact: false },
      { label: 'Transactions', to: '/dashboard/transactions', icon: <TransactionIcon />, exact: false },
    ],
  },
  {
    title: 'Engage',
    items: [
      { label: 'Polls', to: '/dashboard/polls', icon: <PollIcon />, exact: false },
      { label: 'Content Gates', to: '/dashboard/content-gates', icon: <GateIcon />, exact: false },
      { label: 'Referrals', to: '/dashboard/referrals', icon: <ReferralIcon />, exact: false },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics', to: '/dashboard/analytics', icon: <AnalyticsIcon />, exact: false },
      { label: 'Settings', to: '/dashboard/settings', icon: <SettingsIcon />, exact: false },
    ],
  },
];

// Flat list for mobile bottom nav (top 5 most important)
const MOBILE_NAV_ITEMS = [
  { label: 'Overview', to: '/dashboard', icon: <OverviewIcon />, exact: true },
  { label: 'Goals', to: '/dashboard/goals', icon: <GoalIcon />, exact: false },
  { label: 'Polls', to: '/dashboard/polls', icon: <PollIcon />, exact: false },
  { label: 'Analytics', to: '/dashboard/analytics', icon: <AnalyticsIcon />, exact: false },
  { label: 'Settings', to: '/dashboard/settings', icon: <SettingsIcon />, exact: false },
];

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
        <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto" aria-label="Dashboard navigation">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <div className={clsx('sectionTitle', 'px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600')}>
                {collapsed ? '' : section.title}
              </div>
              {section.items.map(({ label, to, icon, exact }) => {
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
            </div>
          ))}
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
          {MOBILE_NAV_ITEMS.map(({ label, to, icon, exact }) => {
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
