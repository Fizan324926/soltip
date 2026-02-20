import React from "react";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { lamportsToSol } from "@/lib/solana/utils";
import styles from "./GoalsList.module.css";

export default function GoalsList({ goals, isOwner }: any) {
  if (!goals || goals.length === 0) {
    return <EmptyState icon="🎯" title="No goals yet" description={isOwner ? "Create a fundraising goal to get started!" : "No active goals."} />;
  }
  return (
    <div className={styles.list}>
      {goals.map((g: any) => {
        const pct = g.account.targetAmount > 0n ? Number((g.account.currentAmount * 100n) / g.account.targetAmount) : 0;
        return (
          <div key={g.publicKey.toBase58()} className={styles.card}>
            <div className={styles.top}>
              <h3 className={styles.title}>{g.account.title}</h3>
              {g.account.completed ? <Badge variant="success">Completed ✓</Badge> : <Badge variant="outline">{pct}%</Badge>}
            </div>
            {g.account.description && <p className={styles.desc}>{g.account.description}</p>}
            <Progress value={pct} className={styles.bar} />
            <div className={styles.amounts}>
              <span className={styles.current}>{lamportsToSol(g.account.currentAmount ?? 0n).toFixed(3)} SOL</span>
              <span className={styles.target}>of {lamportsToSol(g.account.targetAmount ?? 0n).toFixed(3)} SOL</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
