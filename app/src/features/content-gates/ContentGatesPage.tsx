import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { contentGatesApi } from '@/lib/api/client';
import { queryKeys } from '@/api/queryKeys';
import { findTipProfilePDA } from '@/lib/solana/pda';

export default function ContentGatesPage() {
  const { publicKey } = useWallet();
  const publicKeyString = publicKey?.toBase58() || null;
  let profilePda = '';
  try { if (publicKey) { const [pda] = findTipProfilePDA(publicKey); profilePda = pda.toBase58(); } } catch {}
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [requiredAmount, setRequiredAmount] = useState('');

  const { data: gates = [], isLoading } = useQuery({
    queryKey: queryKeys.contentGates.byProfile(profilePda),
    queryFn: () => contentGatesApi.list(profilePda, false),
    enabled: !!profilePda,
  });

  const createMutation = useMutation({
    mutationFn: () => contentGatesApi.create({
      gate_id: Date.now(),
      title,
      content_url: contentUrl,
      required_amount: Math.floor(parseFloat(requiredAmount) * 1e9),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentGates.byProfile(profilePda) });
      setShowCreate(false);
      setTitle('');
      setContentUrl('');
      setRequiredAmount('');
    },
  });

  const closeMutation = useMutation({
    mutationFn: (gatePda: string) => contentGatesApi.close(gatePda),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentGates.byProfile(profilePda) });
    },
  });

  if (!publicKeyString) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">Connect wallet to manage content gates</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Content Gates</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Gate exclusive content behind tip thresholds</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg bg-[var(--color-brand-purple)] text-white hover:opacity-90 transition"
        >
          {showCreate ? 'Cancel' : 'Create Gate'}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Content title (e.g., 'Exclusive Tutorial')"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)]"
            maxLength={64}
          />
          <input
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            placeholder="Content URL (revealed after access granted)"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)]"
            maxLength={200}
          />
          <div>
            <label className="text-sm text-[var(--color-text-secondary)]">Required tip amount (SOL)</label>
            <input
              value={requiredAmount}
              onChange={(e) => setRequiredAmount(e.target.value)}
              placeholder="0.5"
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!title || !contentUrl || !requiredAmount || createMutation.isPending}
            className="px-6 py-2 rounded-lg bg-[var(--color-brand-green)] text-black font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Gate'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading gates...</div>
      ) : gates.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">No content gates yet.</div>
      ) : (
        <div className="grid gap-4">
          {gates.map((gate: any) => (
            <div key={gate.publicKey} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{gate.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Required: {(Number(gate.requiredAmount || 0) / 1e9).toFixed(2)} SOL
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {gate.accessCount} users granted access
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${gate.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {gate.isActive ? 'Active' : 'Closed'}
                  </span>
                  {gate.isActive && (
                    <button
                      onClick={() => closeMutation.mutate(gate.publicKey)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
