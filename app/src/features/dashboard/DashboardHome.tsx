import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navigate, Link } from "react-router-dom";
import { useMyProfile } from "@/api/profile";
import { useMyVault } from "@/api/vault";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { lamportsToSol } from "@/lib/solana/utils";
import styles from "./DashboardHome.module.css";

export default function DashboardHome() {
  const { connected } = useWallet();
  const { data: profile, isLoading } = useMyProfile();
  const { data: vault } = useMyVault();

  if (!connected) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <div className={styles.root}>
        <Skeleton className={styles.skH} />
        <div className={styles.grid}>{Array.from({length:4}).map((_,i)=><Skeleton key={i} className={styles.skCard}/>)}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.noProfile}>
        <h2>Set up your creator profile</h2>
        <p>You do not have a SolTip profile yet. Create one to start accepting tips!</p>
        <Link to="/onboarding"><Button size="lg">Create Profile →</Button></Link>
      </div>
    );
  }

  const acc = profile.account;
  const vaultBal = vault?.account?.balance ?? 0n;

  return (
    <div className={styles.root}>
      <div className={styles.welcome}>
        <h1 className={styles.greeting}>Welcome back, <span className={styles.hi}>{acc.displayName}</span> 👋</h1>
        <p className={styles.sub}>@{acc.username}</p>
      </div>

      <div className={styles.grid}>
        {[
          { icon:"💰", val:`${lamportsToSol(acc.totalTipsReceived??0n).toFixed(4)} SOL`, lbl:"Total Earned" },
          { icon:"🏦", val:`${lamportsToSol(vaultBal).toFixed(4)} SOL`, lbl:"Vault Balance" },
          { icon:"🎁", val:(acc.totalTipCount??0n).toString(), lbl:"Tips Received" },
          { icon:"👥", val:(acc.totalUniqueTippers??0).toString(), lbl:"Unique Supporters" },
        ].map((s)=>(
          <div key={s.lbl} className={styles.card}>
            <div className={styles.icon}>{s.icon}</div>
            <div className={styles.val}>{s.val}</div>
            <div className={styles.lbl}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className={styles.quick}>
        <h2 className={styles.qTitle}>Quick Actions</h2>
        <div className={styles.qGrid}>
          {[
            { to:"/dashboard/goals", icon:"🎯", label:"Manage Goals" },
            { to:"/dashboard/subscriptions", icon:"🔄", label:"Subscriptions" },
            { to:"/dashboard/splits", icon:"✂️", label:"Tip Splits" },
            { to:"/dashboard/transactions", icon:"📊", label:"Transactions" },
          ].map((a)=>(
            <Link key={a.to} to={a.to} className={styles.qCard}>
              <span className={styles.qIcon}>{a.icon}</span>
              <span className={styles.qLabel}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {vaultBal > 0n && (
        <div className={styles.vault}>
          <div>
            <h3>Your Vault</h3>
            <p className={styles.vaultBal}>{lamportsToSol(vaultBal).toFixed(4)} SOL available</p>
          </div>
          <Link to="/dashboard/withdraw"><Button variant="outline">Withdraw →</Button></Link>
        </div>
      )}
    </div>
  );
}
