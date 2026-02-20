import React from 'react';
import { cn } from '@/lib/cn';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  color?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 36,
};

const strokeWidthMap: Record<SpinnerSize, number> = {
  xs: 2.5,
  sm: 2.5,
  md: 2,
  lg: 2,
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  color = '#9945FF',
}) => {
  const px = sizeMap[size];
  const sw = strokeWidthMap[size];
  const r = (px - sw * 2) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('animate-spin', className)}
      aria-label="Loading"
      role="status"
    >
      {/* Track circle */}
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={sw}
      />
      {/* Spinning arc — roughly 75% of circumference */}
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.25}
        transform={`rotate(-90 ${px / 2} ${px / 2})`}
      />
    </svg>
  );
};

export default Spinner;
