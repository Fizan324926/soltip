import React from 'react';
import * as RadixSeparator from '@radix-ui/react-separator';
import { cn } from '@/lib/cn';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  /** Optional centered label text */
  label?: string;
  className?: string;
  /** Extra class for the line itself */
  lineClassName?: string;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  label,
  className,
  lineClassName,
}) => {
  const lineClass = cn('bg-surface-border', lineClassName);

  if (orientation === 'vertical') {
    return (
      <RadixSeparator.Root
        orientation="vertical"
        decorative
        className={cn('w-px self-stretch bg-surface-border', lineClassName, className)}
      />
    );
  }

  if (label) {
    return (
      <div
        className={cn('flex items-center gap-3 w-full', className)}
        role="separator"
        aria-orientation="horizontal"
        aria-label={label}
      >
        <RadixSeparator.Root
          decorative
          orientation="horizontal"
          className={cn('flex-1 h-px', lineClass)}
        />
        <span className="text-[0.75rem] font-medium text-white/35 whitespace-nowrap flex-shrink-0">
          {label}
        </span>
        <RadixSeparator.Root
          decorative
          orientation="horizontal"
          className={cn('flex-1 h-px', lineClass)}
        />
      </div>
    );
  }

  return (
    <RadixSeparator.Root
      decorative
      orientation="horizontal"
      className={cn('h-px w-full', lineClass, className)}
    />
  );
};

export default Separator;
