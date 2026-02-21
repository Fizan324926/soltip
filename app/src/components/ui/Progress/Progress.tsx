import React from 'react';
import * as RadixProgress from '@radix-ui/react-progress';
import { cn } from '@/lib/cn';

export type ProgressColor = 'purple' | 'green' | 'blue';
export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps {
  /** 0–100 */
  value: number;
  showLabel?: boolean;
  label?: string;
  color?: ProgressColor;
  size?: ProgressSize;
  className?: string;
}

const trackHeightMap: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const gradientMap: Record<ProgressColor, string> = {
  purple: 'linear-gradient(90deg, #7B2FBE 0%, #9945FF 100%)',
  green:  'linear-gradient(90deg, #0BBF74 0%, #14F195 100%)',
  blue:   'linear-gradient(90deg, #0099CC 0%, #00C2FF 100%)',
};

const glowMap: Record<ProgressColor, string> = {
  purple: 'rgba(153,69,255,0.45)',
  green:  'rgba(20,241,149,0.45)',
  blue:   'rgba(0,194,255,0.45)',
};

const shimmerStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)',
  backgroundSize: '200% 100%',
  animation: 'progressShimmer 1.8s linear infinite',
  position: 'absolute',
  inset: 0,
  borderRadius: 'inherit',
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  showLabel = false,
  label,
  color = 'purple',
  size = 'md',
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  const displayLabel = label ?? `${Math.round(clamped)}%`;
  const isActive = clamped > 0 && clamped < 100;

  return (
    <div className={cn('w-full', className)}>
      <style>{`
        @keyframes progressShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.75rem] text-[#6e6e73] font-medium">{displayLabel}</span>
          <span className="text-[0.75rem] text-[#86868b] tabular-nums font-mono">
            {Math.round(clamped)}%
          </span>
        </div>
      )}

      <RadixProgress.Root
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-black/5',
          trackHeightMap[size],
        )}
        value={clamped}
        max={100}
        aria-label={displayLabel}
      >
        <RadixProgress.Indicator
          className="h-full rounded-full transition-[width] duration-500 ease-out relative overflow-hidden"
          style={{
            width: `${clamped}%`,
            background: gradientMap[color],
            boxShadow: clamped > 0 ? `0 0 8px ${glowMap[color]}` : undefined,
          }}
        >
          {/* Shimmer animation on active progress */}
          {isActive && <span style={shimmerStyle} />}
        </RadixProgress.Indicator>
      </RadixProgress.Root>
    </div>
  );
};

export default Progress;
