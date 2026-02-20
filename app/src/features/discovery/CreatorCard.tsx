import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Badge } from '@/components/ui';
import { lamportsToSol } from '@/lib/solana/utils';

interface Props {
  creator: any;
}

export default function CreatorCard({ creator }: Props) {
  const a = creator.account ?? creator;
  return (
    <Link
      to={`/${a.owner ?? a.username}`}
      className="block p-6 bg-surface-card border border-surface-border rounded-2xl no-underline text-inherit transition-all hover:border-solana-purple hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(153,69,255,0.15)]"
    >
      <div className="flex items-center gap-4 mb-4">
        <Avatar
          src={a.imageUrl || undefined}
          fallback={a.displayName?.[0]?.toUpperCase() ?? '?'}
          verified={a.isVerified}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold truncate">{a.displayName}</span>
            {a.isVerified && <Badge variant="success" className="text-xs">Verified</Badge>}
          </div>
          <span className="text-xs text-white/40">@{a.username}</span>
        </div>
      </div>

      {a.description && (
        <p className="text-sm text-white/45 leading-relaxed mb-4 line-clamp-2">
          {a.description}
        </p>
      )}

      <div className="flex gap-8 border-t border-surface-border pt-4">
        <div className="flex flex-col">
          <span className="font-bold text-solana-green">{lamportsToSol(a.totalAmountReceivedLamports ?? 0n)} SOL</span>
          <span className="text-xs text-white/40">earned</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold">{(a.totalTipsReceived ?? 0n).toString()}</span>
          <span className="text-xs text-white/40">tips</span>
        </div>
      </div>
    </Link>
  );
}
