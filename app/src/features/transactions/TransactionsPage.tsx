import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { tipsApi } from '@/lib/api';
import { EmptyState, Skeleton, Badge } from '@/components/ui';
import { SolanaExplorerLink } from '@/components/shared/SolanaExplorerLink/SolanaExplorerLink';

import { lamportsToSol } from '@/lib/solana/utils';

function formatDate(ts: string | number) {
  return new Date(typeof ts === 'number' ? ts * 1000 : ts).toLocaleString();
}

export default function TransactionsPage() {
  const { publicKey } = useWallet();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['tips-history', publicKey?.toBase58(), page],
    queryFn: () => tipsApi.getHistory(publicKey!.toBase58(), { page, page_size: PAGE_SIZE }),
    enabled: !!publicKey,
    staleTime: 30_000,
  });

  const items: any[] = Array.isArray(data)
    ? data
    : data?.items ?? data?.tips ?? [];

  const hasMore = items.length === PAGE_SIZE;

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold mb-8">Transaction History</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Tips you send or receive will appear here."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((tip: any, i: number) => {
              const isSent = tip.tipperAddress === publicKey?.toBase58();
              return (
                <div
                  key={tip.txSignature ?? i}
                  className="flex items-center gap-4 p-4 bg-[#f5f5f7] border border-black/[0.08] rounded-xl"
                >
                  <div className="text-xl">{isSent ? '📤' : '📥'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {isSent ? 'Sent to' : 'Received from'}
                      </span>
                      <span className="font-mono text-xs text-[#86868b] truncate">
                        {isSent
                          ? `${String(tip.recipientAddress ?? '').slice(0, 6)}…${String(tip.recipientAddress ?? '').slice(-4)}`
                          : `${String(tip.tipperAddress ?? '').slice(0, 6)}…${String(tip.tipperAddress ?? '').slice(-4)}`}
                      </span>
                    </div>
                    {tip.message && (
                      <p className="text-xs text-[#86868b] mt-0.5 truncate">"{tip.message}"</p>
                    )}
                    <p className="text-xs text-[#86868b] mt-0.5">{formatDate(tip.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`font-bold ${isSent ? 'text-red-500' : 'text-solana-green'}`}>
                      {isSent ? '−' : '+'}{lamportsToSol(BigInt(tip.amountLamports ?? 0))} SOL
                    </span>
                    {tip.txSignature && (
                      <SolanaExplorerLink
                        signature={tip.txSignature}
                        label="Explorer ↗"
                        className="text-xs"
                      />
                    )}
                    {tip.tokenMint && (
                      <Badge variant="default" className="text-xs">SPL</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center mt-6">
            {page > 1 && (
              <button
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg border border-black/[0.08] text-sm hover:border-solana-purple transition-colors"
              >
                ← Previous
              </button>
            )}
            {hasMore && (
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg border border-black/[0.08] text-sm hover:border-solana-purple transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
