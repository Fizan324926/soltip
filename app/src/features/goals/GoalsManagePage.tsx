import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGoals } from '@/api/goals';
import { useCloseGoal } from '@/api/goals';
import { Button, Badge, Progress, EmptyState, Skeleton } from '@/components/ui';
import { lamportsToSol } from '@/lib/solana/utils';
import { findTipProfilePDA } from '@/lib/solana/pda';
import CreateGoalModal from './CreateGoalModal';

// Helper to safely get string from a value that might be a PublicKey or string
const toStr = (v: any): string => (typeof v === 'string' ? v : v?.toBase58?.() ?? String(v ?? ''));

export default function GoalsManagePage() {
  const { publicKey } = useWallet();
  const [createOpen, setCreateOpen] = useState(false);

  let profilePda = '';
  try {
    if (publicKey) {
      const [pda] = findTipProfilePDA(publicKey);
      profilePda = pda.toBase58();
    }
  } catch {}

  const { data: goals, isLoading } = useGoals(profilePda || null);
  const closeGoal = useCloseGoal();

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-extrabold">Fundraising Goals</h1>
        <Button onClick={() => setCreateOpen(true)}>+ New Goal</Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-[160px] rounded-2xl" />)}
        </div>
      ) : !goals || goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Create a fundraising goal to rally your community around a target!"
          action={<Button onClick={() => setCreateOpen(true)}>Create First Goal</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {goals.map((goal: any) => {
            const ga = goal.account ?? goal;
            const target = ga.targetAmount ?? 0n;
            const current = ga.currentAmount ?? 0n;
            const pct = target > 0n ? Number((current * 100n) / target) : 0;
            return (
              <div key={toStr(goal.publicKey)} className="p-6 bg-surface-card border border-surface-border rounded-2xl">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold">{ga.title}</h3>
                  {ga.completed ? <Badge variant="success">Completed</Badge> : <Badge variant="default">{pct}%</Badge>}
                </div>
                {ga.description && (
                  <p className="text-sm text-white/45 mb-4 leading-relaxed">{ga.description}</p>
                )}
                <Progress value={pct} className="mb-3" />
                <div className="flex gap-2 items-baseline mb-4">
                  <span className="font-bold text-solana-green">{lamportsToSol(current)} SOL</span>
                  <span className="text-xs text-white/40">/ {lamportsToSol(target)} SOL</span>
                </div>
                {ga.completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={closeGoal.isPending}
                    onClick={() => closeGoal.mutateAsync({ goalAddress: toStr(goal.publicKey), goalId: ga.goalId })}
                  >
                    Close & Reclaim Rent
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateGoalModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
