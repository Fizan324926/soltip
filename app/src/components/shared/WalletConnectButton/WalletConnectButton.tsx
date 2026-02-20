import React, { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { formatPublicKey } from '@/lib/solana/utils';
import styles from './WalletConnectButton.module.css';

// ============================================================
// Icons
// ============================================================

function WalletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" stroke="none" />
      <path d="M22 11V9a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function ExplorerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DisconnectIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ============================================================
// WalletConnectButton
// ============================================================

export const WalletConnectButton: React.FC = () => {
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const network = (import.meta.env['VITE_NETWORK'] as string) ?? 'devnet';
  const explorerCluster =
    network === 'mainnet-beta'
      ? ''
      : network === 'localnet'
      ? '?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899'
      : '?cluster=devnet';

  const explorerUrl = publicKey
    ? `https://explorer.solana.com/address/${publicKey.toBase58()}${explorerCluster}`
    : '#';

  const handleCopyAddress = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58()).catch(() => {});
    }
  }, [publicKey]);

  const handleDisconnect = useCallback(() => {
    disconnect().catch(() => {});
  }, [disconnect]);

  // Connecting state
  if (connecting) {
    return (
      <button className={styles.connectBtn} disabled aria-busy="true">
        <span className={styles.spinner} aria-hidden="true" />
        Connecting...
      </button>
    );
  }

  // Connected state: show address chip with dropdown
  if (connected && publicKey) {
    const shortAddr = formatPublicKey(publicKey, 4);

    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className={styles.addressChip} aria-label="Wallet options">
            <span className={styles.dot} aria-hidden="true" />
            <WalletIcon />
            <span>{shortAddr}</span>
            <ChevronDownIcon />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={styles.dropdownContent}
            sideOffset={8}
            align="end"
          >
            {/* Address display */}
            <div className="px-3 py-2 text-[11px] text-slate-500 font-mono break-all select-all leading-relaxed">
              {publicKey.toBase58()}
            </div>

            <div className={styles.dropdownSeparator} />

            {/* View on Explorer */}
            <DropdownMenu.Item asChild>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.dropdownItem}
              >
                <ExplorerIcon />
                View on Explorer
              </a>
            </DropdownMenu.Item>

            {/* Copy address */}
            <DropdownMenu.Item asChild>
              <button className={styles.dropdownItem} onClick={handleCopyAddress}>
                <CopyIcon />
                Copy Address
              </button>
            </DropdownMenu.Item>

            <div className={styles.dropdownSeparator} />

            {/* Disconnect */}
            <DropdownMenu.Item asChild>
              <button
                className={`${styles.dropdownItem} ${styles.danger}`}
                onClick={handleDisconnect}
              >
                <DisconnectIcon />
                Disconnect
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }

  // Disconnected state: show connect button
  return (
    <button
      className={styles.connectBtn}
      onClick={() => setVisible(true)}
      aria-label="Connect Solana wallet"
    >
      <WalletIcon />
      Connect Wallet
    </button>
  );
};

export default WalletConnectButton;
