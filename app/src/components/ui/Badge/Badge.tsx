import React from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant =
  | 'verified'
  | 'live'
  | 'new'
  | 'success'
  | 'warning'
  | 'error'
  | 'default';

export interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
  /** Show a dot indicator (always shown for 'live') */
  showDot?: boolean;
}

interface VariantConfig {
  base: string;
  dot?: string;
  icon?: React.ReactNode;
  label?: string;
}

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M2 5L4.2 7.5L8 2.5" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const variantConfig: Record<BadgeVariant, VariantConfig> = {
  verified: {
    base: 'bg-[rgba(0,194,255,0.12)] text-[#00C2FF] border-[rgba(0,194,255,0.25)]',
    icon: <CheckIcon />,
  },
  live: {
    base: 'bg-[rgba(20,241,149,0.12)] text-[#14F195] border-[rgba(20,241,149,0.25)]',
    dot: 'bg-[#14F195] animate-pulse',
  },
  new: {
    base: 'bg-[rgba(153,69,255,0.15)] text-[#9945FF] border-[rgba(153,69,255,0.3)]',
  },
  success: {
    base: 'bg-[rgba(20,241,149,0.12)] text-[#14F195] border-[rgba(20,241,149,0.25)]',
  },
  warning: {
    base: 'bg-[rgba(255,184,0,0.12)] text-[#FFB800] border-[rgba(255,184,0,0.25)]',
  },
  error: {
    base: 'bg-[rgba(255,68,68,0.12)] text-[#FF4444] border-[rgba(255,68,68,0.25)]',
  },
  default: {
    base: 'bg-white/8 text-white/60 border-white/12',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
  showDot = false,
}) => {
  const config = variantConfig[variant];
  const showDotIndicator = showDot || variant === 'live';

  const content =
    children ??
    (variant === 'live'
      ? 'Live'
      : variant === 'verified'
      ? 'Verified'
      : variant === 'new'
      ? 'New'
      : undefined);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5',
        'text-[0.6875rem] font-semibold leading-none',
        'rounded-full border',
        'whitespace-nowrap select-none',
        config.base,
        className,
      )}
    >
      {config.icon && !showDotIndicator && config.icon}

      {showDotIndicator && (
        <span
          className={cn('inline-block w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot ?? 'bg-current')}
        />
      )}

      {content}
    </span>
  );
};

export default Badge;
