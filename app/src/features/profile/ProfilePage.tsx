import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProfile } from '@/api/profile';
import { useGoals } from '@/api/goals';
import { Avatar, Badge, Button, Skeleton, Tabs, TabsContent, EmptyState, Progress } from '@/components/ui';
import { SolanaExplorerLink } from '@/components/shared/SolanaExplorerLink/SolanaExplorerLink';
import { lamportsToSol } from '@/lib/solana/utils';
import { findTipProfilePDA } from '@/lib/solana/pda';
import { PublicKey } from '@solana/web3.js';
import TipModal from '@/features/tip/TipModal';
import type { TabItem } from '@/components/ui';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { publicKey } = useWallet();
  const [tipOpen, setTipOpen] = useState(false);

  // username is the wallet address in the route /:username
  const { data: profile, isLoading } = useProfile(username ?? null);

  let profilePda: string | undefined;
  try {
    if (username) {
      const [pda] = findTipProfilePDA(new PublicKey(username));
      profilePda = pda.toBase58();
    }
  } catch {}

  const { data: goals } = useGoals(profilePda ?? null);

  const isOwner = publicKey?.toBase58() === username;

  if (isLoading) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <Skeleton className="h-[160px] rounded-2xl mb-6" />
        <Skeleton className="h-[100px] rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-extrabold mb-2">Creator not found</h2>
        <p className="text-white/45">This wallet does not have a SolTip profile yet.</p>
      </div>
    );
  }

  // Backend returns { publicKey, account: { ... } } after camelCase transform
  const a = profile.account ?? profile;
  const leaderboard: any[] = a.leaderboard ?? [];
  const goalsList: any[] = goals ?? [];

  const tabItems: TabItem[] = [
    { value: 'goals', label: `Goals (${goalsList.length})` },
    { value: 'leaderboard', label: 'Top Supporters' },
  ];

  // Helper to safely get string from a value that might be a PublicKey or string
  const toStr = (v: any): string => (typeof v === 'string' ? v : v?.toBase58?.() ?? String(v ?? ''));
  // Helper to safely shorten an address string
  const shortAddr = (v: any): string => {
    const s = toStr(v);
    return s.length > 11 ? `${s.slice(0, 4)}...${s.slice(-4)}` : s;
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8 pb-16">
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
            <h1 className="text-3xl font-extrabold">{a.displayName}</h1>
            {a.isVerified && <Badge variant="success">Verified</Badge>}
          </div>
          <p className="text-white/45 mb-2">@{a.username}</p>
          {username && (
            <SolanaExplorerLink address={username} className="text-xs text-solana-blue mb-3 inline-block">
              {shortAddr(username)}
            </SolanaExplorerLink>
          )}
          {a.description && <p className="text-white/45 leading-relaxed max-w-[480px]">{a.description}</p>}
        </div>
        <div className="flex flex-col gap-3 items-end">
          {!isOwner && (
            <Button
              size="lg"
              onClick={() => setTipOpen(true)}
              className="shadow-[0_0_24px_rgba(153,69,255,0.35)] min-w-[140px]"
            >
              Send Tip
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="p-5 bg-surface-card border border-surface-border rounded-2xl text-center">
          <div className="text-xl font-extrabold text-solana-green">{lamportsToSol(a.totalAmountReceivedLamports ?? 0n)} SOL</div>
          <div className="text-xs text-white/40 mt-1">Total Earned</div>
        </div>
        <div className="p-5 bg-surface-card border border-surface-border rounded-2xl text-center">
          <div className="text-xl font-extrabold">{(a.totalTipsReceived ?? 0n).toString()}</div>
          <div className="text-xs text-white/40 mt-1">Tips Received</div>
        </div>
        <div className="p-5 bg-surface-card border border-surface-border rounded-2xl text-center">
          <div className="text-xl font-extrabold">{a.totalUniqueTippers ?? leaderboard.length}</div>
          <div className="text-xs text-white/40 mt-1">Supporters</div>
        </div>
        <div className="p-5 bg-surface-card border border-surface-border rounded-2xl text-center">
          <div className="text-xl font-extrabold">{goalsList.filter((g: any) => !(g.account ?? g).completed).length}</div>
          <div className="text-xs text-white/40 mt-1">Active Goals</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabItems} defaultValue="goals">
        <TabsContent value="goals" className="mt-4">
          {goalsList.length === 0 ? (
            <EmptyState title="No goals yet" description={isOwner ? 'Create a fundraising goal to get started!' : 'This creator has no active goals.'} />
          ) : (
            <div className="flex flex-col gap-4">
              {goalsList.map((goal: any) => {
                const ga = goal.account ?? goal;
                const target = ga.targetAmount ?? 0n;
                const current = ga.currentAmount ?? 0n;
                const pct = target > 0n ? Number((current * 100n) / target) : 0;
                return (
                  <div key={toStr(goal.publicKey)} className="p-6 bg-surface-card border border-surface-border rounded-2xl">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold">{ga.title}</h3>
                      {ga.completed ? (
                        <Badge variant="success">Completed</Badge>
                      ) : (
                        <Badge variant="default">{pct}%</Badge>
                      )}
                    </div>
                    {ga.description && (
                      <p className="text-sm text-white/45 mb-3 leading-relaxed">{ga.description}</p>
                    )}
                    <Progress value={pct} className="mb-3" />
                    <div className="flex gap-2 items-baseline">
                      <span className="font-bold text-solana-green">{lamportsToSol(current)} SOL</span>
                      <span className="text-xs text-white/40">of {lamportsToSol(target)} SOL</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          {leaderboard.length === 0 ? (
            <EmptyState title="No supporters yet" description="Be the first to tip this creator!" />
          ) : (
            <div className="flex flex-col gap-3">
              {leaderboard.map((entry: any, i: number) => {
                const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
                return (
                  <div key={i} className="flex items-center gap-4 p-4 bg-surface-card border border-surface-border rounded-xl">
                    <span className="text-xl w-8 text-center">{medals[i] ?? `#${i + 1}`}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-sm">{shortAddr(entry.tipper)}</span>
                      <span className="text-xs text-white/40 ml-2">{(entry.tipCount ?? 0).toString()} tips</span>
                    </div>
                    <span className="font-bold text-solana-green">{lamportsToSol(entry.totalAmount ?? 0n)} SOL</span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tip Modal */}
      <TipModal
        open={tipOpen}
        onOpenChange={setTipOpen}
        recipientAddress={username ?? ''}
        recipientName={a.username ?? ''}
      />
    </div>
  );
}
