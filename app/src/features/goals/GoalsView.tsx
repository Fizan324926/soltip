import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGoals, useCloseGoal } from "@/api/goals";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { lamportsToSol } from "@/lib/solana/utils";
import { findTipProfilePDA } from "@/lib/solana/pda";
import CreateGoalModal from "./CreateGoalModal";
import styles from "./GoalsView.module.css";

export default function GoalsView() {
  const { publicKey } = useWallet();
  const [open, setOpen] = useState(false);

  let profilePda = "";
  try { if (publicKey) { const [p] = findTipProfilePDA(publicKey); profilePda = p.toBase58(); } } catch {}

  const { data: goals, isLoading } = useGoals(profilePda || null);
  const closeGoal = useCloseGoal();

  return (
    <div className={styles.root}>
      <div className={styles.hdr}>
        <h1 className={styles.title}>Fundraising Goals</h1>
        <Button onClick={() => setOpen(true)}>+ New Goal</Button>
      </div>
      {isLoading ? (
        <div className={styles.list}>{[1,2].map(i=><Skeleton key={i} className={styles.sk}/>)}</div>
      ) : !goals?.length ? (
        <EmptyState icon="🎯" title="No goals yet" description="Create a fundraising goal to rally your community!" action={<Button onClick={() => setOpen(true)}>Create First Goal</Button>} />
      ) : (
        <div className={styles.list}>
          {goals.map((g: any) => {
            const pct = g.account.targetAmount > 0n ? Number((g.account.currentAmount * 100n) / g.account.targetAmount) : 0;
            return (
              <div key={g.publicKey.toBase58()} className={styles.card}>
                <div className={styles.cardTop}>
                  <h3 className={styles.goalTitle}>{g.account.title}</h3>
                  {g.account.completed ? <Badge variant="success">Completed ✓</Badge> : <Badge variant="outline">{pct}%</Badge>}
                </div>
                {g.account.description && <p className={styles.desc}>{g.account.description}</p>}
                <Progress value={pct} className={styles.bar} />
                <div className={styles.amts}>
                  <span className={styles.cur}>{lamportsToSol(g.account.currentAmount??0n).toFixed(3)} SOL</span>
                  <span className={styles.tgt}>/ {lamportsToSol(g.account.targetAmount??0n).toFixed(3)} SOL</span>
                </div>
                {g.account.completed && (
                  <Button variant="ghost" size="sm" onClick={() => closeGoal.mutateAsync({ goalAddress: g.publicKey.toBase58(), goalId: g.account.goalId })} loading={closeGoal.isPending}>
                    Close & Reclaim Rent
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <CreateGoalModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
