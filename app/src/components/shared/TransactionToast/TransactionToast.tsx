import React from 'react';
import toast, { type Toast } from 'react-hot-toast';
import { SolanaExplorerLink } from '@/components/shared/SolanaExplorerLink/SolanaExplorerLink';
import type { Network } from '@/types';
import clsx from 'clsx';

// ============================================================
// Icons
// ============================================================

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ============================================================
// TransactionToast component (rendered inside react-hot-toast)
// ============================================================

type TxStatus = 'pending' | 'confirmed' | 'failed';

interface TransactionToastProps {
  t: Toast;
  status: TxStatus;
  title: string;
  signature?: string;
  error?: string;
  network?: Network;
}

export const TransactionToast: React.FC<TransactionToastProps> = ({
  t,
  status,
  title,
  signature,
  error,
  network = (import.meta.env['VITE_NETWORK'] as Network) ?? 'devnet',
}) => {
  const statusConfig = {
    pending: {
      icon: <SpinnerIcon />,
      iconClass: 'text-[#9945FF]',
      borderClass: 'border-[#9945FF]/30',
      bgClass: 'bg-[#9945FF]/10',
    },
    confirmed: {
      icon: <CheckIcon />,
      iconClass: 'text-[#14F195]',
      borderClass: 'border-[#14F195]/30',
      bgClass: 'bg-[#14F195]/10',
    },
    failed: {
      icon: <XIcon />,
      iconClass: 'text-accent-error',
      borderClass: 'border-accent-error/30',
      bgClass: 'bg-accent-error/10',
    },
  } satisfies Record<TxStatus, { icon: React.ReactNode; iconClass: string; borderClass: string; bgClass: string }>;

  const cfg = statusConfig[status];

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 rounded-xl border max-w-xs w-full pointer-events-auto',
        'bg-surface-elevated shadow-2xl',
        cfg.borderClass,
        t.visible ? 'animate-none' : 'opacity-0'
      )}
      role="status"
      aria-live="polite"
    >
      {/* Status icon */}
      <div className={clsx('flex-shrink-0 mt-0.5', cfg.iconClass)}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-[#1d1d1f] leading-snug">{title}</p>

        {status === 'pending' && (
          <p className="text-xs text-[#86868b]">Waiting for confirmation...</p>
        )}

        {status === 'confirmed' && signature && (
          <SolanaExplorerLink
            signature={signature}
            label="View transaction"
            network={network}
            className="text-xs"
          />
        )}

        {status === 'failed' && error && (
          <p className="text-xs text-accent-error/80 leading-snug">{error}</p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => toast.dismiss(t.id)}
        className="flex-shrink-0 mt-0.5 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

// ============================================================
// showTxToast — convenience helper
//
// Usage:
//   showTxToast(
//     program.methods.sendTip(...).rpc(),
//     { pendingTitle: 'Sending tip...', confirmedTitle: 'Tip sent!' }
//   );
// ============================================================

interface TxToastOptions {
  pendingTitle?: string;
  confirmedTitle?: string;
  failedTitle?: string;
  network?: Network;
}

export function showTxToast(
  txPromise: Promise<string>,
  options: TxToastOptions = {}
): Promise<string> {
  const {
    pendingTitle = 'Transaction pending...',
    confirmedTitle = 'Transaction confirmed!',
    failedTitle = 'Transaction failed',
    network = (import.meta.env['VITE_NETWORK'] as Network) ?? 'devnet',
  } = options;

  const toastId = toast.loading(pendingTitle);

  return txPromise
    .then((signature) => {
      toast.custom(
        (t) => (
          <TransactionToast
            t={t}
            status="confirmed"
            title={confirmedTitle}
            signature={signature}
            network={network}
          />
        ),
        { id: toastId, duration: 8000 }
      );
      return signature;
    })
    .catch((err: unknown) => {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      toast.custom(
        (t) => (
          <TransactionToast
            t={t}
            status="failed"
            title={failedTitle}
            error={errorMessage}
            network={network}
          />
        ),
        { id: toastId, duration: 10000 }
      );
      throw err;
    });
}

export default TransactionToast;
