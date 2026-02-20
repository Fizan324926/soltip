import React from 'react';
import BN from 'bn.js';
import { SOL_TOKEN, KNOWN_TOKENS } from '@/lib/solana/tokens';
import { formatTokenAmount } from '@/lib/solana/tokens';
import clsx from 'clsx';

// ============================================================
// Types
// ============================================================

type AmountInput = bigint | number | BN;

type TokenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface TokenAmountProps {
  /** Raw amount in base units (lamports for SOL, micro-units for USDC, etc.) */
  amount: AmountInput;
  /** Token symbol or mint address */
  token: 'SOL' | 'USDC' | 'USDT' | string;
  /** Override decimals (auto-detected from known tokens if omitted) */
  decimals?: number;
  /** Whether to show the token symbol/name after the number (default: true) */
  showSymbol?: boolean;
  /** Whether to show the token icon (default: true for known tokens) */
  showIcon?: boolean;
  /** Max fractional digits to display */
  maxFrac?: number;
  /** Size variant */
  size?: TokenSize;
  className?: string;
}

// ============================================================
// Helpers
// ============================================================

function toBigInt(amount: AmountInput): bigint {
  if (typeof amount === 'bigint') return amount;
  if (typeof amount === 'number') return BigInt(Math.round(amount));
  // BN
  return BigInt(amount.toString());
}

function getTokenInfo(token: string) {
  if (token === 'SOL') return SOL_TOKEN;
  const found = KNOWN_TOKENS.find((t) => t.symbol === token);
  if (found) return found;
  return null;
}

function getDecimals(token: string, override?: number): number {
  if (override !== undefined) return override;
  if (token === 'SOL') return 9;
  const info = getTokenInfo(token);
  return info?.decimals ?? 6;
}

const SIZE_CLASSES: Record<TokenSize, { amount: string; symbol: string; icon: string }> = {
  xs: { amount: 'text-xs', symbol: 'text-xs', icon: 'w-3 h-3' },
  sm: { amount: 'text-sm', symbol: 'text-xs', icon: 'w-3.5 h-3.5' },
  md: { amount: 'text-base', symbol: 'text-sm', icon: 'w-4 h-4' },
  lg: { amount: 'text-lg font-semibold', symbol: 'text-sm', icon: 'w-5 h-5' },
  xl: { amount: 'text-2xl font-bold', symbol: 'text-base', icon: 'w-6 h-6' },
};

// ============================================================
// Inline token icon (SVG) for SOL
// ============================================================

function SolIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill="#9945FF" />
      <path d="M9 21.5h11a1 1 0 0 0 .71-.29l2.5-2.5H9v2.79z" fill="white" opacity="0.9" />
      <path d="M9 16h11a1 1 0 0 0 .71-.29l2.5-2.5H9V16z" fill="white" opacity="0.7" />
      <path d="M9 10.5h11a1 1 0 0 0 .71-.29l2.5-2.5H9v2.79z" fill="white" opacity="0.5" />
    </svg>
  );
}

function TokenLogoImage({
  logoUrl,
  symbol,
  className,
}: {
  logoUrl: string;
  symbol: string;
  className?: string;
}) {
  return (
    <img
      src={logoUrl}
      alt={symbol}
      className={clsx('rounded-full', className)}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

// ============================================================
// TokenAmount Component
// ============================================================

export const TokenAmount: React.FC<TokenAmountProps> = ({
  amount,
  token,
  decimals: decimalsOverride,
  showSymbol = true,
  showIcon = true,
  maxFrac,
  size = 'md',
  className,
}) => {
  const decimals = getDecimals(token, decimalsOverride);
  const raw = toBigInt(amount);
  const formatted = formatTokenAmount(raw, decimals, maxFrac);
  const tokenInfo = getTokenInfo(token);
  const sizeClasses = SIZE_CLASSES[size];

  const isSol = token === 'SOL';

  return (
    <span className={clsx('inline-flex items-center gap-1.5', className)}>
      {/* Token icon */}
      {showIcon && (
        <span className="flex-shrink-0">
          {isSol ? (
            <SolIcon className={sizeClasses.icon} />
          ) : tokenInfo?.logoUrl ? (
            <TokenLogoImage
              logoUrl={tokenInfo.logoUrl}
              symbol={tokenInfo.symbol}
              className={sizeClasses.icon}
            />
          ) : (
            /* Fallback: colored circle with first letter */
            <span
              className={clsx(
                sizeClasses.icon,
                'rounded-full bg-[#9945FF]/30 flex items-center justify-center text-[8px] font-bold text-[#9945FF]'
              )}
              aria-hidden="true"
            >
              {token.charAt(0)}
            </span>
          )}
        </span>
      )}

      {/* Amount */}
      <span className={clsx(sizeClasses.amount, 'tabular-nums font-mono')}>
        {formatted}
      </span>

      {/* Symbol */}
      {showSymbol && (
        <span className={clsx(sizeClasses.symbol, 'text-slate-400 font-sans')}>
          {token}
        </span>
      )}
    </span>
  );
};

export default TokenAmount;
