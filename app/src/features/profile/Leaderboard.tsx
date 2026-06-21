import React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPublicKey, lamportsToSolNumber } from "@/lib/solana/utils";
import styles from "./Leaderboard.module.css";

const MEDALS = ["🥇","🥈","🥉"];

export default function Leaderboard({ entries }: any) {
  if (!entries || entries.length === 0) {
    return <EmptyState icon="🏆" title="No supporters yet" description="Be the first to tip this creator!" />;
  }
  return (
    <div className={styles.list}>
      {entries.map((e: any, i: number) => {
        const addr = e.tipper?.toBase58?.() ?? e.tipper ?? "";
        return (
          <div key={addr} className={styles.row}>
            <span className={styles.rank}>{MEDALS[i] ?? `#${i+1}`}</span>
            <Avatar fallback={(addr[0] ?? "?").toUpperCase()} size="sm" />
            <div className={styles.info}>
              <span className={styles.addr}>{formatPublicKey(addr)}</span>
              <span className={styles.count}>{(e.tipCount ?? e.tip_count ?? 0).toString()} tips</span>
            </div>
            <span className={styles.amount}>{lamportsToSolNumber(e.totalAmount ?? e.total_amount ?? 0n).toFixed(3)} SOL</span>
          </div>
        );
      })}
    </div>
  );
}
