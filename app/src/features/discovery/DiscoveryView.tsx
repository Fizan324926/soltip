import React, { useState } from "react";
import { useCreatorList } from "@/api/profile";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import CreatorCard from "./CreatorCard";
import styles from "./DiscoveryView.module.css";

const CATS = ["All", "Gaming", "Music", "Art", "Dev", "Education", "Crypto"];

export default function DiscoveryView() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const { data: creators, isLoading } = useCreatorList();

  const filtered = (creators ?? []).filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.account.username?.toLowerCase().includes(q) ||
      c.account.displayName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Discover Creators</h1>
        <p className={styles.sub}>Find and support creators building on Solana</p>
      </div>
      <div className={styles.controls}>
        <Input
          placeholder="Search by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
        <div className={styles.cats}>
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`${styles.cat} ${cat === c ? styles.catActive : ""}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className={styles.skeletonCard} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No creators found" description={search ? `No results for "${search}"` : "No creators yet. Be the first!"} />
      ) : (
        <div className={styles.grid}>
          {filtered.map((c: any) => <CreatorCard key={c.publicKey.toBase58()} creator={c} />)}
        </div>
      )}
    </div>
  );
}
