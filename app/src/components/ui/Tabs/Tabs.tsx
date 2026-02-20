import React, { useRef, useState, useLayoutEffect } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultValue,
  value,
  onChange,
  className,
  listClassName,
  contentClassName,
  children,
}) => {
  const firstTab = tabs[0]?.value ?? '';
  const [activeTab, setActiveTab] = useState(value ?? defaultValue ?? firstTab);

  const handleChange = (val: string) => {
    setActiveTab(val);
    onChange?.(val);
  };

  // Keep internal state in sync with controlled `value` prop
  React.useEffect(() => {
    if (value !== undefined) setActiveTab(value);
  }, [value]);

  return (
    <RadixTabs.Root
      value={activeTab}
      onValueChange={handleChange}
      className={cn('w-full', className)}
    >
      <RadixTabs.List
        className={cn(
          'relative flex items-center gap-1',
          'bg-surface-card border border-surface-border',
          'rounded-xl p-1',
          listClassName,
        )}
        aria-label="Tabs"
      >
        {tabs.map((tab) => (
          <TabTrigger key={tab.value} tab={tab} isActive={activeTab === tab.value} />
        ))}
      </RadixTabs.List>

      {children && (
        <div className={cn('mt-4', contentClassName)}>{children}</div>
      )}
    </RadixTabs.Root>
  );
};

// ---------------------------------------------------------------------------
// TabTrigger — individual tab button with animated underline via layoutId
// ---------------------------------------------------------------------------
interface TabTriggerProps {
  tab: TabItem;
  isActive: boolean;
}

const TabTrigger: React.FC<TabTriggerProps> = ({ tab, isActive }) => {
  return (
    <RadixTabs.Trigger
      value={tab.value}
      disabled={tab.disabled}
      className={cn(
        'relative flex-1 flex items-center justify-center gap-1.5',
        'px-3 py-1.5 rounded-lg',
        'text-[0.8125rem] font-semibold leading-none',
        'transition-colors duration-150',
        'outline-none focus-visible:ring-2 focus-visible:ring-solana-purple',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isActive ? 'text-white' : 'text-white/45 hover:text-white/75',
      )}
    >
      {/* Active background pill — animated via framer-motion layoutId */}
      {isActive && (
        <motion.span
          layoutId="tab-active-bg"
          className="absolute inset-0 rounded-lg bg-surface-elevated"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          style={{ zIndex: 0 }}
        />
      )}

      {/* Content above the animated background */}
      <span className="relative z-10 flex items-center gap-1.5">
        {tab.icon && (
          <span className={cn('inline-flex', isActive ? 'text-solana-purple' : 'text-current')}>
            {tab.icon}
          </span>
        )}
        {tab.label}
        {tab.badge !== undefined && (
          <span
            className={cn(
              'inline-flex items-center justify-center',
              'min-w-[1.1rem] h-[1.1rem] px-1',
              'text-[0.625rem] font-bold rounded-full',
              isActive
                ? 'bg-solana-purple text-white'
                : 'bg-white/12 text-white/60',
            )}
          >
            {tab.badge}
          </span>
        )}
      </span>

      {/* Animated underline */}
      {isActive && (
        <motion.span
          layoutId="tab-active-underline"
          className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-solana-purple"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          style={{ zIndex: 1 }}
        />
      )}
    </RadixTabs.Trigger>
  );
};

// Re-export Radix TabsContent for convenience
export const TabsContent = RadixTabs.Content;

export default Tabs;
