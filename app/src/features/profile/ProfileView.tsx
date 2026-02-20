import React, { useState, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProfile } from "@/api/profile";
import { useVault } from "@/api/vault";
import { useGoals } from "@/api/goals";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { SolanaExplorerLink } from "@/components/shared/SolanaExplorerLink/SolanaExplorerLink";
import { lamportsToSol, formatPublicKey } from "@/lib/solana/utils";
import { findTipProfilePDA } from "@/lib/solana/pda";
import { PublicKey } from "@solana/web3.js";
import ProfileStats from "./ProfileStats";
import GoalsList from "./GoalsList";
import Leaderboard from "./Leaderboard";
import TipPanel from "./TipPanel";
import styles from "./ProfileView.module.css";

export default function ProfileView() {
  const { username } = useParams<{ username: string }>();
  const { publicKey } = useWallet();
  const [tipOpen, setTipOpen] = useState(false);

  const { data: profile, isLoading } = useProfile(username ?? null);

  const ownerAddr = profile?.account?.owner?.toBase58?.() ?? username ?? "";
  let profilePda = "";
  try {
    if (ownerAddr) {
      const [pda] = findTipProfilePDA(new PublicKey(ownerAddr));
      profilePda = pda.toBase58();
    }
  } catch {}

  const { data: vault } = useVault(profilePda || null);
  const { data: goals } = useGoals(profilePda || null);
  const isOwner = publicKey?.toBase58() === ownerAddr;

  if (isLoading) {
    return (
      <div className={styles.root}>
        <Skeleton className={styles.skHdr} />
        <Skeleton className={styles.skStats} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.notFound}>
        <h2>Creator not found</h2>
        <p>This wallet does not have a SolTip profile yet.</p>
      </div>
    );
  }

  const acc = profile.account;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Avatar src={acc.imageUrl || undefined} fallback={(acc.displayName?.[0] ?? "?").toUpperCase()} verified={acc.isVerified} size="xl" />
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{acc.displayName}</h1>
            {acc.isVerified && <Badge variant="success">✓ Verified</Badge>}
          </div>
          <p className={styles.username}>@{acc.username}</p>
          {ownerAddr && (
            <SolanaExplorerLink address={ownerAddr} className={styles.explorer}>
              {formatPublicKey(ownerAddr)}
            </SolanaExplorerLink>
          )}
          {acc.description && <p className={styles.desc}>{acc.description}</p>}
        </div>
        <div className={styles.actions}>
          {!isOwner && (
            <Button onClick={() => setTipOpen(true)} size="lg" className={styles.tipBtn}>
              💜 Send Tip
            </Button>
          )}
        </div>
      </div>

      <ProfileStats profile={acc} vault={vault?.account} />

      <Tabs defaultValue="goals" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="goals">Goals ({goals?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="leaderboard">Top Supporters</TabsTrigger>
        </TabsList>
        <TabsContent value="goals">
          <GoalsList goals={goals ?? []} isOwner={isOwner} />
        </TabsContent>
        <TabsContent value="leaderboard">
          <Leaderboard entries={acc.topTippers ?? []} />
        </TabsContent>
      </Tabs>

      {tipOpen && (
        <TipPanel
          open={tipOpen}
          onClose={() => setTipOpen(false)}
          recipientAddress={ownerAddr}
          recipientName={acc.username}
        />
      )}
    </div>
  );
}
