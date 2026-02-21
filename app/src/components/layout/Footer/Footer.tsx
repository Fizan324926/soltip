import React from 'react';
import { NetworkBadge } from '@/components/shared/NetworkBadge/NetworkBadge';
import type { Network } from '@/types';

// ============================================================
// Footer Component
// ============================================================

function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block ml-1"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

interface FooterProps {
  network?: Network;
}

export const Footer: React.FC<FooterProps> = ({
  network = (import.meta.env['VITE_NETWORK'] as Network) ?? 'devnet',
}) => {
  const explorerBaseUrl =
    network === 'mainnet-beta'
      ? 'https://explorer.solana.com'
      : network === 'localnet'
      ? 'https://explorer.solana.com?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899'
      : 'https://explorer.solana.com?cluster=devnet';

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-black/[0.08] bg-white/80 backdrop-blur-sm mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: copyright */}
          <div className="flex items-center gap-4 text-sm text-[#86868b]">
            <span>
              &copy; {currentYear} SolTip. Built on{' '}
              <span className="text-[#9945FF] font-medium">Solana</span>.
            </span>
          </div>

          {/* Center: links */}
          <div className="flex items-center gap-5 text-sm">
            <a
              href={explorerBaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#86868b] hover:text-[#14F195] transition-colors"
            >
              Solana Explorer
              <ExternalLinkIcon />
            </a>
            <a
              href="https://github.com/your-org/soltip"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              <GitHubIcon />
              GitHub
              <ExternalLinkIcon />
            </a>
          </div>

          {/* Right: network badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#86868b]">Network:</span>
            <NetworkBadge network={network} />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
