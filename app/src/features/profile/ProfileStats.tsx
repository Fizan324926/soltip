import React from "react";
import { lamportsToSol } from "@/lib/solana/utils";
import styles from "./ProfileStats.module.css";

export default function ProfileStats({ profile, vault }: any) {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.val}>{lamportsToSol(profile.totalTipsReceived ?? 0n).toFixed(4)} SOL</div>
        <div className={styles.lbl}>Total Earned</div>
      </div>
      <div className={styles.card}>
        <div className={styles.val}>{(profile.totalTipCount ?? 0n).toString()}</div>
        <div className={styles.lbl}>Tips Received</div>
      </div>
      <div className={styles.card}>
        <div className={styles.val}>{vault ? `${lamportsToSol(vault.balance ?? 0n).toFixed(4)} SOL` : "—"}</div>
        <div className={styles.lbl}>Vault Balance</div>
      </div>
      <div className={styles.card}>
        <div className={styles.val}>{(profile.totalUniqueTippers ?? 0).toString()}</div>
        <div className={styles.lbl}>Unique Supporters</div>
      </div>
    </div>
  );
}
