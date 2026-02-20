import React from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';
import { cn } from '@/lib/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  fallback?: string;
  size?: AvatarSize;
  verified?: boolean;
  alt?: string;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[0.5rem]',
  sm: 'w-8 h-8 text-[0.625rem]',
  md: 'w-10 h-10 text-[0.75rem]',
  lg: 'w-14 h-14 text-[1rem]',
  xl: 'w-20 h-20 text-[1.375rem]',
};

const ringClasses: Record<AvatarSize, string> = {
  xs: 'p-[1.5px]',
  sm: 'p-[2px]',
  md: 'p-[2px]',
  lg: 'p-[2.5px]',
  xl: 'p-[3px]',
};

/** Derive up to 2 initials from a fallback string (name or wallet address). */
function getInitials(text: string): string {
  if (!text) return '?';
  // Wallet addresses get truncated
  if (text.length > 20) return text.slice(0, 2).toUpperCase();
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  fallback,
  size = 'md',
  verified = false,
  alt,
  className,
}) => {
  const initials = fallback ? getInitials(fallback) : '?';

  const inner = (
    <RadixAvatar.Root
      className={cn(
        'relative inline-flex items-center justify-center rounded-full select-none overflow-hidden flex-shrink-0',
        sizeClasses[size],
        !verified && className,
      )}
    >
      <RadixAvatar.Image
        src={src}
        alt={alt ?? fallback ?? 'Avatar'}
        className="w-full h-full object-cover"
      />
      <RadixAvatar.Fallback
        delayMs={200}
        className={cn(
          'flex items-center justify-center w-full h-full rounded-full font-bold',
          'bg-gradient-to-br from-[#9945FF] to-[#14F195] text-white',
        )}
      >
        {initials}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );

  if (!verified) return inner;

  // Verified: animated gradient border ring
  return (
    <div
      className={cn(
        'relative inline-flex flex-shrink-0 rounded-full',
        ringClasses[size],
        // Animated gradient via background-image + spin
        'bg-gradient-solana animate-spin-slow',
        className,
      )}
      style={{
        // Override animate-spin-slow to use a slow rotation on the ring wrapper only
        animation: 'verifiedRingSpin 4s linear infinite',
      }}
      aria-label={`${alt ?? fallback ?? 'Avatar'} (verified)`}
    >
      <style>{`
        @keyframes verifiedRingSpin {
          from { filter: hue-rotate(0deg); }
          to   { filter: hue-rotate(360deg); }
        }
      `}</style>
      {/* Inner mask to make ring appear */}
      <div className={cn('rounded-full overflow-hidden', sizeClasses[size])}>
        <RadixAvatar.Root
          className="relative inline-flex items-center justify-center rounded-full w-full h-full overflow-hidden"
        >
          <RadixAvatar.Image
            src={src}
            alt={alt ?? fallback ?? 'Avatar'}
            className="w-full h-full object-cover"
          />
          <RadixAvatar.Fallback
            delayMs={200}
            className="flex items-center justify-center w-full h-full rounded-full font-bold bg-gradient-to-br from-[#9945FF] to-[#14F195] text-white"
            style={{ fontSize: 'inherit' }}
          >
            {initials}
          </RadixAvatar.Fallback>
        </RadixAvatar.Root>
      </div>
    </div>
  );
};

export default Avatar;
