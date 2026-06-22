import React from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'danger'
  | 'verified'
  | 'live'
  | 'new'
  | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
  showDot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#f5f5f7] text-[#86868b]',
  accent: 'bg-[rgba(153,69,255,0.1)] text-[#9945ff]',
  success: 'bg-[rgba(20,241,149,0.1)] text-[#0a7b4a]',
  warning: 'bg-[rgba(255,149,0,0.1)] text-[#cc7a00]',
  error: 'bg-[rgba(255,59,48,0.1)] text-[#ff3b30]',
  danger: 'bg-[rgba(255,59,48,0.1)] text-[#ff3b30]',
  verified: 'bg-[rgba(0,122,255,0.1)] text-[#007aff]',
  live: 'bg-[rgba(20,241,149,0.1)] text-[#0a7b4a]',
  new: 'bg-[rgba(153,69,255,0.1)] text-[#9945ff]',
  outline: 'bg-transparent text-[#86868b] ring-1 ring-inset ring-[rgba(0,0,0,0.1)]',
};

const defaultLabels: Partial<Record<BadgeVariant, string>> = {
  verified: 'Verified',
  live: 'Live',
  new: 'New',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
  showDot = false,
}) => {
  const shouldShowDot = showDot || variant === 'live';
  const content = children ?? defaultLabels[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2.5 py-1',
        'text-[12px] font-medium leading-none',
        'rounded-full',
        'whitespace-nowrap select-none',
        variantStyles[variant],
        className,
      )}
    >
      {shouldShowDot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            variant === 'live' ? 'bg-[#14f195] animate-pulse' : 'bg-current',
          )}
        />
      )}
      {variant === 'verified' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {content}
    </span>
  );
};

export default Badge;
