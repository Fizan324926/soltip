import React from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Default icon shown when no icon is provided */
const DefaultIcon: React.FC = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="20" cy="20" r="20" fill="rgba(153,69,255,0.1)" />
    <path
      d="M13 27V15a2 2 0 012-2h10a2 2 0 012 2v12l-5-3-5 3-4 0z"
      stroke="rgba(153,69,255,0.5)"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="20" cy="19" r="2.5" stroke="rgba(153,69,255,0.5)" strokeWidth="1.5" fill="none" />
  </svg>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-12 px-6 w-full',
        className,
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon */}
      <div className="mb-4 opacity-80">
        {icon ?? <DefaultIcon />}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-[#1d1d1f] mb-2 leading-snug">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-[0.875rem] text-[#86868b] max-w-xs leading-relaxed mb-5">
          {description}
        </p>
      )}

      {/* Action (e.g. a Button) */}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};

export default EmptyState;
