import React, { useState } from 'react';
import { useCreatorList } from '@/api/profile';
import { Input, Skeleton, EmptyState } from '@/components/ui';
import CreatorCard from './CreatorCard';

const CATEGORIES = ['All', 'Gaming', 'Music', 'Art', 'Dev', 'Education', 'Crypto'];

// Helper to safely get string from a value that might be a PublicKey or string
const toStr = (v: any): string => (typeof v === 'string' ? v : v?.toBase58?.() ?? String(v ?? ''));

export default function DiscoveryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { data: creatorsData, isLoading } = useCreatorList();

  // useCreatorList returns paginated { items, ... } or flat array
  const creators: any[] = Array.isArray(creatorsData)
    ? creatorsData
    : creatorsData?.items ?? [];

  const filtered = creators.filter((c: any) => {
    if (!search) return true;
    const a = c.account ?? c;
    const s = search.toLowerCase();
    return (
      a.username?.toLowerCase().includes(s) ||
      a.displayName?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 pb-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Discover Creators</h1>
        <p className="text-[#86868b] text-lg">Find and support creators building on Solana</p>
      </div>

      <div className="flex flex-col gap-4 mb-10">
        <Input
          placeholder="Search by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-[480px] mx-auto"
        />
        <div className="flex gap-2 justify-center flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full border text-sm transition-all ${
                category === cat
                  ? 'bg-solana-purple border-solana-purple text-white'
                  : 'border-black/[0.08] text-[#86868b] hover:border-solana-purple hover:text-solana-purple'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[240px] rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No creators found"
          description={search ? `No results for "${search}"` : 'No creators yet. Be the first!'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((creator: any) => (
            <CreatorCard key={toStr(creator.publicKey)} creator={creator} />
          ))}
        </div>
      )}
    </div>
  );
}
