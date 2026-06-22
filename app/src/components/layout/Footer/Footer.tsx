import React from 'react';
import { NetworkBadge } from '@/components/shared/NetworkBadge/NetworkBadge';
import type { Network } from '@/types';

interface FooterProps {
  network?: Network;
}

export const Footer: React.FC<FooterProps> = ({
  network = (import.meta.env['VITE_NETWORK'] as Network) ?? 'devnet',
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[rgba(0,0,0,0.06)] bg-[#fbfbfd] mt-auto">
      <div className="max-w-[980px] mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Copyright */}
          <p className="text-[12px] text-[#86868b]">
            Copyright &copy; {currentYear} SolTip. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex items-center gap-6 text-[12px]">
            <a
              href="https://github.com/Fizan324926/soltip"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              Solana
            </a>
            <NetworkBadge network={network} />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
