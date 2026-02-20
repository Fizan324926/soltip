import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { analyticsApi, widgetApi } from '@/lib/api/client';
import { queryKeys } from '@/api/queryKeys';
import { findTipProfilePDA } from '@/lib/solana/pda';

export default function AnalyticsPage() {
  const { publicKey } = useWallet();
  const publicKeyString = publicKey?.toBase58() || null;
  let profilePda = '';
  try { if (publicKey) { const [pda] = findTipProfilePDA(publicKey); profilePda = pda.toBase58(); } } catch {}

  const [days, setDays] = useState(30);
  const [leaderboardWindow, setLeaderboardWindow] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const { data: analytics, isLoading } = useQuery({
    queryKey: queryKeys.analytics.byProfile(profilePda, days),
    queryFn: () => analyticsApi.getAnalytics(profilePda, days),
    enabled: !!profilePda,
  });

  const { data: leaderboard } = useQuery({
    queryKey: queryKeys.analytics.leaderboard(profilePda, leaderboardWindow),
    queryFn: () => analyticsApi.getWindowLeaderboard(profilePda, leaderboardWindow),
    enabled: !!profilePda,
  });

  const { data: priceData } = useQuery({
    queryKey: queryKeys.analytics.solPrice(),
    queryFn: () => analyticsApi.getSolPrice(),
    staleTime: 60_000,
  });

  if (!publicKeyString) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">Connect wallet to view analytics</div>;
  }

  const solPrice = priceData?.priceUsd || 0;
  const exportUrl = widgetApi.exportTips(profilePda);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Analytics</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            SOL Price: ${solPrice.toFixed(2)} USD
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={365}>365 days</option>
          </select>
          <a href={exportUrl} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-card)] transition"
          >
            Export CSV
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading analytics...</div>
      ) : analytics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Tips (Period)" value={analytics.summary?.totalTips || 0} />
            <StatCard label="Revenue (SOL)" value={`${(Number(analytics.summary?.totalAmountLamports || 0) / 1e9).toFixed(2)}`} />
            <StatCard label="Revenue (USD)" value={`$${(analytics.summary?.totalAmountUsd || 0).toFixed(2)}`} accent />
            <StatCard label="SPL Tokens" value={analytics.summary?.totalSpl || '0'} />
          </div>

          {/* Weekly vs Monthly */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">This Week</h3>
              <p className="text-2xl font-bold text-[var(--color-brand-green)]">{analytics.weekly?.tips || 0} tips</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {(Number(analytics.weekly?.amountLamports || 0) / 1e9).toFixed(2)} SOL
                (${(analytics.weekly?.amountUsd || 0).toFixed(2)})
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">{analytics.weekly?.uniqueTippers || 0} unique tippers</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">This Month</h3>
              <p className="text-2xl font-bold text-[var(--color-brand-purple)]">{analytics.monthly?.tips || 0} tips</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {(Number(analytics.monthly?.amountLamports || 0) / 1e9).toFixed(2)} SOL
                (${(analytics.monthly?.amountUsd || 0).toFixed(2)})
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">{analytics.monthly?.uniqueTippers || 0} unique tippers</p>
            </div>
          </div>

          {/* Daily Chart (simplified bar display) */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Daily Tips</h3>
            {analytics.daily?.length > 0 ? (
              <div className="flex items-end gap-1 h-32">
                {analytics.daily.map((d: any, i: number) => {
                  const maxAmount = Math.max(...analytics.daily.map((x: any) => Number(x.totalAmount || 0)), 1);
                  const height = (Number(d.totalAmount || 0) / maxAmount) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${d.date}: ${d.tipCount} tips`}>
                      <div
                        className="w-full bg-[var(--color-brand-purple)] rounded-t opacity-80 hover:opacity-100 transition min-h-[2px]"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">No data for this period</p>
            )}
          </div>

          {/* Time-Window Leaderboard */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Top Supporters</h3>
              <div className="flex gap-1">
                {(['weekly', 'monthly', 'yearly'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setLeaderboardWindow(w)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      leaderboardWindow === w
                        ? 'bg-[var(--color-brand-purple)] text-white'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {w.charAt(0).toUpperCase() + w.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {leaderboard?.leaderboard?.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.leaderboard.map((entry: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-[var(--color-text-secondary)] w-6">#{i + 1}</span>
                      <span className="font-mono text-sm text-[var(--color-text-primary)]">
                        {entry.tipper.slice(0, 4)}...{entry.tipper.slice(-4)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {(Number(entry.totalAmount || 0) / 1e9).toFixed(2)} SOL
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        ${(entry.totalAmountUsd || 0).toFixed(2)} | {entry.tipCount} tips
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">No supporters in this window</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 text-center">
      <p className={`text-2xl font-bold ${accent ? 'text-[var(--color-brand-green)]' : 'text-[var(--color-text-primary)]'}`}>{value}</p>
      <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
    </div>
  );
}
