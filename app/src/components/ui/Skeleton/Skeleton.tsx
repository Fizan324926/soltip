import React from 'react';
import { cn } from '@/lib/cn';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  /** Makes the skeleton a circle (overrides border-radius) */
  circle?: boolean;
  /** Renders N stacked line skeletons (for paragraph/text blocks) */
  lines?: number;
}

const shimmerStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)',
  backgroundSize: '200% 100%',
  animation: 'skeletonShimmer 2s linear infinite',
};

const SingleSkeleton: React.FC<Omit<SkeletonProps, 'lines'>> = ({
  width,
  height,
  className,
  circle = false,
}) => {
  const style: React.CSSProperties = {
    ...shimmerStyle,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <>
      <style>{`
        @keyframes skeletonShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
      <span
        aria-hidden="true"
        className={cn(
          'block bg-black/5',
          circle ? 'rounded-full' : 'rounded-lg',
          !height && 'h-4',
          !width && 'w-full',
          className,
        )}
        style={style}
      />
    </>
  );
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  className,
  circle = false,
  lines,
}) => {
  if (lines && lines > 1) {
    return (
      <span className="flex flex-col gap-2 w-full" aria-busy="true" aria-label="Loading content">
        {Array.from({ length: lines }).map((_, i) => (
          <SingleSkeleton
            key={i}
            // Last line is shorter to mimic real text
            width={i === lines - 1 ? '65%' : width}
            height={height ?? 16}
            className={className}
          />
        ))}
      </span>
    );
  }

  return (
    <span aria-busy="true" aria-label="Loading">
      <SingleSkeleton
        width={width}
        height={height}
        className={className}
        circle={circle}
      />
    </span>
  );
};

export default Skeleton;
