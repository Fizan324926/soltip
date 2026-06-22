import React, { useState, useCallback, memo } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
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

  const handleChange = useCallback((val: string) => {
    setActiveTab(val);
    onChange?.(val);
  }, [onChange]);

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
          'flex items-center gap-8 border-b border-[rgba(0,0,0,0.06)]',
          listClassName,
        )}
        aria-label="Tabs"
      >
        {tabs.map((tab) => (
          <TabTrigger key={tab.value} tab={tab} isActive={activeTab === tab.value} />
        ))}
      </RadixTabs.List>

      {children && (
        <div className={cn(contentClassName)}>{children}</div>
      )}
    </RadixTabs.Root>
  );
};

interface TabTriggerProps {
  tab: TabItem;
  isActive: boolean;
}

const TabTrigger = memo(function TabTrigger({ tab, isActive }: TabTriggerProps) {
  return (
    <RadixTabs.Trigger
      value={tab.value}
      disabled={tab.disabled}
      className={cn(
        'relative flex items-center gap-2',
        'pb-3 -mb-px',
        'text-[14px] font-medium',
        'transition-colors duration-150',
        'outline-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isActive
          ? 'text-[#1d1d1f] border-b-2 border-[#1d1d1f]'
          : 'text-[#86868b] hover:text-[#1d1d1f] border-b-2 border-transparent',
      )}
    >
      {tab.icon && (
        <span className="inline-flex">{tab.icon}</span>
      )}
      {tab.label}
      {tab.badge !== undefined && (
        <span
          className={cn(
            'inline-flex items-center justify-center',
            'min-w-[18px] h-[18px] px-1.5',
            'text-[11px] font-medium rounded-full',
            isActive
              ? 'bg-[#1d1d1f] text-white'
              : 'bg-[#f5f5f7] text-[#86868b]',
          )}
        >
          {tab.badge}
        </span>
      )}
    </RadixTabs.Trigger>
  );
});

export const TabsContent = RadixTabs.Content;
export const TabsList = RadixTabs.List;
export const TabsTrigger = RadixTabs.Trigger;
export const TabsRoot = RadixTabs.Root;

export default Tabs;
