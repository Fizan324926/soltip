import React, { useState, memo } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { useGoals } from '@/api/goals';
import { Avatar, Badge, Button, Skeleton, Tabs, TabsContent, EmptyState, Progress } from '@/components/ui';
import { SolanaExplorerLink } from '@/components/shared/SolanaExplorerLink/SolanaExplorerLink';
import { lamportsToSol } from '@/lib/solana/utils';
import { findTipProfilePDA } from '@/lib/solana/pda';
import { profileApi } from '@/lib/api';
import { PublicKey } from '@solana/web3.js';
import TipModal from '@/features/tip/TipModal';
import type { TabItem } from '@/components/ui';

// ============================================================
// Memoized Sub-Components
// ============================================================

interface StatCardProps {
  value: string;
  label: string;
  accent?: boolean;
}

const StatCard = memo(function StatCard({ value, label, accent }: StatCardProps) {
  return (
    <div className="text-center py-6">
      <div className={`text-[28px] font-semibold tracking-tight ${accent ? 'text-[#14f195]' : 'text-[#1d1d1f]'}`}>
        {value}
      </div>
      <div className="text-[12px] text-[#86868b] mt-1 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
});

interface GoalCardProps {
  goal: any;
  toStr: (v: any) => string;
}

const GoalCard = memo(function GoalCard({ goal, toStr }: GoalCardProps) {
  const ga = goal.account ?? goal;
  const target = ga.targetAmount ?? 0n;
  const current = ga.currentAmount ?? 0n;
  const pct = target > 0n ? Number((current * 100n) / target) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[17px] font-semibold text-[#1d1d1f]">{ga.title}</h3>
        {ga.completed ? (
          <Badge variant="success">Completed</Badge>
        ) : (
          <Badge variant="default">{pct}%</Badge>
        )}
      </div>
      {ga.description && (
        <p className="text-[15px] text-[#86868b] mb-4 leading-relaxed">{ga.description}</p>
      )}
      <Progress value={pct} className="mb-4" />
      <div className="flex items-baseline gap-2">
        <span className="text-[17px] font-semibold text-[#14f195]">
          {lamportsToSol(current)} SOL
        </span>
        <span className="text-[14px] text-[#86868b]">
          of {lamportsToSol(target)} SOL
        </span>
      </div>
    </div>
  );
});

interface LeaderboardEntryProps {
  entry: any;
  rank: number;
  shortAddr: (v: any) => string;
}

const LeaderboardEntry = memo(function LeaderboardEntry({ entry, rank, shortAddr }: LeaderboardEntryProps) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="flex items-center gap-4 py-4 border-b border-[rgba(0,0,0,0.06)] last:border-0">
      <span className="text-[20px] w-8 text-center">
        {medals[rank] ?? `#${rank + 1}`}
      </span>
      <div className="flex-1 min-w-0">
        <span className="font-mono text-[14px] text-[#1d1d1f]">
          {shortAddr(entry.tipper)}
        </span>
        <span className="text-[12px] text-[#86868b] ml-2">
          {(entry.tipCount ?? 0).toString()} tips
        </span>
      </div>
      <span className="text-[17px] font-semibold text-[#14f195]">
        {lamportsToSol(entry.totalAmount ?? 0n)} SOL
      </span>
    </div>
  );
});

// ============================================================
// Main Component
// ============================================================

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { publicKey } = useWallet();
  const [tipOpen, setTipOpen] = useState(false);

  const looksLikeAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(username ?? '');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      if (!username) throw new Error('No username');
      if (looksLikeAddress) {
        return profileApi.getProfile(username);
      }
      const list = await profileApi.listProfiles({ search: username, page_size: 10 });
      const items: any[] = Array.isArray(list) ? list : list?.items ?? [];
      const match = items.find((p: any) => {
        const a = p.account ?? p;
        return a.username?.toLowerCase() === username.toLowerCase();
      });
      if (!match) throw new Error('Profile not found');
      return match;
    },
    enabled: !!username,
    staleTime: 300_000, // 5 minutes
  });

  const ownerAddress: string | undefined = (() => {
    if (!profile) return undefined;
    const p: any = profile;
    if (looksLikeAddress && username) return username;
    return p.ownerAddress ?? p.owner_address ?? (typeof p.publicKey === 'string' ? p.publicKey : p.publicKey?.toBase58?.());
  })();

  let profilePda: string | undefined;
  try {
    if (ownerAddress) {
      const [pda] = findTipProfilePDA(new PublicKey(ownerAddress));
      profilePda = pda.toBase58();
    }
  } catch {
    // ignore invalid address
  }

  const { data: goals } = useGoals(profilePda ?? null);

  const isOwner = publicKey?.toBase58() === ownerAddress;

  const toStr = (v: any): string => (typeof v === 'string' ? v : v?.toBase58?.() ?? String(v ?? ''));
  const shortAddr = (v: any): string => {
    const s = toStr(v);
    return s.length > 11 ? `${s.slice(0, 4)}...${s.slice(-4)}` : s;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-12">
        <div className="flex gap-6 items-start mb-10">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-4 w-full max-w-[300px]" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Not found state
  if (!profile) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-24 text-center">
        <h2 className="text-[28px] font-semibold text-[#1d1d1f] mb-2">
          Creator not found
        </h2>
        <p className="text-[17px] text-[#86868b]">
          No SolTip profile found for "{username}".
        </p>
      </div>
    );
  }

  const a = (profile as any).account ?? profile;
  const leaderboard: any[] = a.leaderboard ?? [];
  const goalsList: any[] = goals ?? [];

  const tabItems: TabItem[] = [
    { value: 'goals', label: `Goals (${goalsList.length})` },
    { value: 'supporters', label: 'Top Supporters' },
  ];

  return (
    <div className="max-w-[680px] mx-auto px-6 py-12 pb-24">
      {/* Header */}
      <div className="flex gap-6 items-start mb-10 flex-wrap">
        <Avatar
          src={a.imageUrl || undefined}
          fallback={a.displayName?.[0]?.toUpperCase() ?? '?'}
          verified={a.isVerified}
          size="xl"
        />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-[32px] font-semibold text-[#1d1d1f] tracking-tight">
              {a.displayName}
            </h1>
            {a.isVerified && <Badge variant="verified" />}
          </div>
          <p className="text-[15px] text-[#86868b] mb-3">@{a.username}</p>
          {ownerAddress && (
            <SolanaExplorerLink
              address={ownerAddress}
              label={shortAddr(ownerAddress)}
              className="text-[12px] text-[#9945ff] font-mono mb-3 inline-block hover:underline"
            />
          )}
          {a.description && (
            <p className="text-[15px] text-[#86868b] leading-relaxed max-w-[420px]">
              {a.description}
            </p>
          )}
        </div>
        {!isOwner && (
          <Button
            size="lg"
            onClick={() => setTipOpen(true)}
            className="min-w-[140px]"
          >
            Send Tip
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(0,0,0,0.06)] rounded-2xl overflow-hidden mb-10">
        <div className="bg-white">
          <StatCard
            value={`${lamportsToSol(a.totalAmountReceivedLamports ?? 0n)} SOL`}
            label="Total Earned"
            accent
          />
        </div>
        <div className="bg-white">
          <StatCard
            value={(a.totalTipsReceived ?? 0n).toString()}
            label="Tips"
          />
        </div>
        <div className="bg-white">
          <StatCard
            value={(a.totalUniqueTippers ?? leaderboard.length).toString()}
            label="Supporters"
          />
        </div>
        <div className="bg-white">
          <StatCard
            value={goalsList.filter((g: any) => !(g.account ?? g).completed).length.toString()}
            label="Active Goals"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabItems} defaultValue="goals">
        <TabsContent value="goals" className="mt-6">
          {goalsList.length === 0 ? (
            <EmptyState
              title="No goals yet"
              description={isOwner ? 'Create a fundraising goal to get started!' : 'This creator has no active goals.'}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {goalsList.map((goal: any) => (
                <GoalCard key={toStr(goal.publicKey)} goal={goal} toStr={toStr} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="supporters" className="mt-6">
          {leaderboard.length === 0 ? (
            <EmptyState
              title="No supporters yet"
              description="Be the first to tip this creator!"
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-card px-6">
              {leaderboard.map((entry: any, i: number) => (
                <LeaderboardEntry
                  key={toStr(entry.tipper) || i}
                  entry={entry}
                  rank={i}
                  shortAddr={shortAddr}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tip Modal */}
      {ownerAddress && (
        <TipModal
          open={tipOpen}
          onOpenChange={setTipOpen}
          recipientAddress={ownerAddress}
          recipientName={a.username ?? ''}
        />
      )}
    </div>
  );
}
