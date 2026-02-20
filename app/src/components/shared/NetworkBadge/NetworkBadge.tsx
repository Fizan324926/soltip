import React from 'react';
import type { Network } from '@/types';
import clsx from 'clsx';

// ============================================================
// NetworkBadge
//
// Displays a colored badge indicating the current Solana network.
// ============================================================

interface NetworkBadgeProps {
  network: Network;
  className?: string;
}

const NETWORK_CONFIG: Record<
  Network,
  { label: string; dotClass: string; badgeClass: string }
> = {
  localnet: {
    label: 'Localnet',
    dotClass: 'bg-slate-400',
    badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  },
  devnet: {
    label: 'Devnet',
    dotClass: 'bg-accent-warning',
    badgeClass: 'bg-accent-warning/10 text-accent-warning border-accent-warning/30',
  },
  'mainnet-beta': {
    label: 'Mainnet',
    dotClass: 'bg-accent-success',
    badgeClass: 'bg-accent-success/10 text-accent-success border-accent-success/30',
  },
};

export const NetworkBadge: React.FC<NetworkBadgeProps> = ({ network, className }) => {
  const cfg = NETWORK_CONFIG[network] ?? NETWORK_CONFIG.devnet;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        cfg.badgeClass,
        className
      )}
      aria-label={`Connected to ${cfg.label}`}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span
          className={clsx(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-60',
            cfg.dotClass
          )}
        />
        <span
          className={clsx(
            'relative inline-flex rounded-full h-2 w-2',
            cfg.dotClass
          )}
        />
      </span>
      {cfg.label}
    </span>
  );
};

export default NetworkBadge;
