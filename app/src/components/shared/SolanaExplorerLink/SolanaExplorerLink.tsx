import React from 'react';
import type { Network } from '@/types';
import clsx from 'clsx';

// ============================================================
// Inline external link icon
// ============================================================

function ExternalLinkIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block flex-shrink-0"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ============================================================
// Types
// ============================================================

interface SolanaExplorerLinkProps {
  /** Transaction signature — mutually exclusive with `address` */
  signature?: string;
  /** Account / mint address — mutually exclusive with `signature` */
  address?: string;
  /** Display label (defaults to shortened signature/address) */
  label?: string;
  /** Solana cluster */
  network?: Network;
  /** Tailwind className override */
  className?: string;
  /** Icon size in px (default 12) */
  iconSize?: number;
}

// ============================================================
// Helpers
// ============================================================

function getClusterParam(network: Network): string {
  switch (network) {
    case 'mainnet-beta':
      return '';
    case 'localnet':
      return '?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899';
    case 'devnet':
    default:
      return '?cluster=devnet';
  }
}

function shortenStr(str: string, chars = 6): string {
  if (str.length <= chars * 2 + 3) return str;
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

function buildExplorerUrl(
  type: 'tx' | 'address',
  value: string,
  network: Network
): string {
  const cluster = getClusterParam(network);
  return `https://explorer.solana.com/${type}/${value}${cluster}`;
}

// ============================================================
// SolanaExplorerLink Component
// ============================================================

export const SolanaExplorerLink: React.FC<SolanaExplorerLinkProps> = ({
  signature,
  address,
  label,
  network = (import.meta.env['VITE_NETWORK'] as Network) ?? 'devnet',
  className,
  iconSize = 12,
}) => {
  if (!signature && !address) return null;

  const isSignature = Boolean(signature);
  const value = (signature ?? address) as string;
  const type = isSignature ? 'tx' : 'address';
  const href = buildExplorerUrl(type, value, network);
  const displayLabel = label ?? shortenStr(value, 4);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'inline-flex items-center gap-1 text-[#14F195] hover:text-[#00C2FF] transition-colors underline-offset-2 hover:underline',
        className
      )}
      aria-label={`View ${type === 'tx' ? 'transaction' : 'account'} on Solana Explorer`}
    >
      {displayLabel}
      <ExternalLinkIcon size={iconSize} />
    </a>
  );
};

export default SolanaExplorerLink;
