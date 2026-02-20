import React, { useId } from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from '@/lib/cn';

export interface SwitchProps {
  label?: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** 'left' (default) puts the toggle on the left; 'right' puts it on the right */
  align?: 'left' | 'right';
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  id: idProp,
  className,
  align = 'left',
}) => {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const toggle = (
    <RadixSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        // Track
        'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full',
        'border-2 border-transparent',
        'transition-colors duration-200 ease-smooth',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solana-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface-DEFAULT',
        'disabled:cursor-not-allowed disabled:opacity-45',
        // Color: off = dim, on = purple
        'data-[state=unchecked]:bg-white/15',
        'data-[state=checked]:bg-solana-purple data-[state=checked]:shadow-[0_0_10px_rgba(153,69,255,0.45)]',
      )}
      aria-describedby={description ? `${id}-desc` : undefined}
    >
      <RadixSwitch.Thumb
        className={cn(
          'pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm',
          'transform transition-transform duration-200 ease-smooth',
          'data-[state=unchecked]:translate-x-0.5',
          'data-[state=checked]:translate-x-[calc(100%+1px)]',
        )}
      />
    </RadixSwitch.Root>
  );

  if (!label && !description) {
    return (
      <div className={cn('inline-flex', className)}>
        {toggle}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3',
        align === 'right' && 'flex-row-reverse',
        disabled && 'opacity-45 cursor-not-allowed',
        className,
      )}
    >
      {/* Toggle on the left (or right when align='right') */}
      <div className="mt-0.5 flex-shrink-0">{toggle}</div>

      {/* Labels */}
      <div className="flex flex-col min-w-0">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'text-sm font-medium text-white leading-snug',
              !disabled && 'cursor-pointer',
            )}
          >
            {label}
          </label>
        )}
        {description && (
          <p id={`${id}-desc`} className="text-[0.75rem] text-white/50 mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default Switch;
