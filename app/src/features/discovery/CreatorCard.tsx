import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Badge } from '@/components/ui';
import { lamportsToSol } from '@/lib/solana/utils';

interface Props {
  creator: any;
}

const CreatorCard = memo(function CreatorCard({ creator }: Props) {
  const a = creator.account ?? creator;

  return (
    <Link
      to={`/${a.owner ?? a.username}`}
      className="
        block p-6 bg-white rounded-2xl
        shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_1px_rgba(0,0,0,0.04)]
        transition-all duration-200
        hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        hover:-translate-y-0.5
        no-underline text-inherit
      "
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Avatar
          src={a.imageUrl || undefined}
          fallback={a.displayName?.[0]?.toUpperCase() ?? '?'}
          verified={a.isVerified}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-[17px] text-[#1d1d1f] truncate">
              {a.displayName}
            </span>
            {a.isVerified && <Badge variant="verified" className="text-[10px]" />}
          </div>
          <span className="text-[14px] text-[#86868b]">@{a.username}</span>
        </div>
      </div>

      {/* Description */}
      {a.description && (
        <p className="text-[15px] text-[#86868b] leading-relaxed mb-5 line-clamp-2">
          {a.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex gap-8 pt-4 border-t border-[rgba(0,0,0,0.06)]">
        <div>
          <div className="text-[17px] font-semibold text-[#14f195]">
            {lamportsToSol(a.totalAmountReceivedLamports ?? 0n)} SOL
          </div>
          <div className="text-[12px] text-[#86868b] uppercase tracking-wide">
            earned
          </div>
        </div>
        <div>
          <div className="text-[17px] font-semibold text-[#1d1d1f]">
            {(a.totalTipsReceived ?? 0n).toString()}
          </div>
          <div className="text-[12px] text-[#86868b] uppercase tracking-wide">
            tips
          </div>
        </div>
      </div>
    </Link>
  );
});

export default CreatorCard;
