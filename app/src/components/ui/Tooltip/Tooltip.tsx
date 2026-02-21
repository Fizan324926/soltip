import React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/cn';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  /** Extra class applied to the tooltip content box */
  className?: string;
  /** Disable the tooltip */
  disabled?: boolean;
  sideOffset?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  className,
  disabled = false,
  sideOffset = 6,
}) => {
  if (disabled) return children;

  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>

        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={sideOffset}
            className={cn(
              // Base
              'z-[100] max-w-[220px]',
              'px-2.5 py-1.5 rounded-lg',
              'text-[0.75rem] font-medium leading-snug text-[#1d1d1f]',
              // Glass background
              'bg-[rgba(26,26,48,0.95)] backdrop-blur-sm',
              'border border-[rgba(153,69,255,0.25)]',
              'shadow-[0_4px_16px_rgba(0,0,0,0.5)]',
              // Animation
              'data-[state=delayed-open]:animate-fade-in',
              'data-[state=closed]:animate-[fade-out_0.15s_ease-in]',
              'will-change-[transform,opacity]',
              // Slide by side
              'data-[side=top]:animate-[slide-up_0.2s_ease-out]',
              'data-[side=bottom]:animate-[slide-down_0.2s_ease-out]',
              className,
            )}
          >
            {content}
            <RadixTooltip.Arrow
              className="fill-[rgba(153,69,255,0.25)]"
              width={10}
              height={5}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

export default Tooltip;
