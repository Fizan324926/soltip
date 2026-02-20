import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { pollsApi } from '@/lib/api/client';
import { queryKeys } from '@/api/queryKeys';
import { findTipProfilePDA } from '@/lib/solana/pda';

export default function PollsPage() {
  const { publicKey } = useWallet();
  const publicKeyString = publicKey?.toBase58() || null;
  let profilePda = '';
  try { if (publicKey) { const [pda] = findTipProfilePDA(publicKey); profilePda = pda.toBase58(); } } catch {}
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);

  const { data: polls = [], isLoading } = useQuery({
    queryKey: queryKeys.polls.byProfile(profilePda),
    queryFn: () => pollsApi.list(profilePda, false),
    enabled: !!profilePda,
  });

  const createMutation = useMutation({
    mutationFn: () => pollsApi.create({
      poll_id: Date.now(),
      title,
      description,
      options: options.filter(o => o.trim()),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.byProfile(profilePda) });
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setOptions(['', '']);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (pollPda: string) => pollsApi.close(pollPda),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.byProfile(profilePda) });
    },
  });

  if (!publicKeyString) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">Connect wallet to manage polls</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Polls</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Create tip-funded polls for your community</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg bg-[var(--color-brand-purple)] text-white hover:opacity-90 transition"
        >
          {showCreate ? 'Cancel' : 'Create Poll'}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Poll title (e.g., 'What game next?')"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)]"
            maxLength={64}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)]"
            maxLength={256}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Options (2-4)</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)]"
                  maxLength={32}
                />
                {options.length > 2 && (
                  <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 px-2">Remove</button>
                )}
              </div>
            ))}
            {options.length < 4 && (
              <button onClick={() => setOptions([...options, ''])} className="text-sm text-[var(--color-brand-purple)] hover:underline">+ Add option</button>
            )}
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!title || options.filter(o => o.trim()).length < 2 || createMutation.isPending}
            className="px-6 py-2 rounded-lg bg-[var(--color-brand-green)] text-black font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading polls...</div>
      ) : polls.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">No polls yet. Create your first poll!</div>
      ) : (
        <div className="grid gap-4">
          {polls.map((poll: any) => (
            <div key={poll.publicKey} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{poll.title}</h3>
                  {poll.description && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{poll.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${poll.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {poll.isActive ? 'Active' : 'Closed'}
                  </span>
                  {poll.isActive && (
                    <button
                      onClick={() => closeMutation.mutate(poll.publicKey)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {(Array.isArray(poll.options) ? poll.options : []).map((opt: any, i: number) => {
                  const votes = opt.votes || 0;
                  const total = poll.totalVotes || 1;
                  const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                  return (
                    <div key={i} className="relative">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[var(--color-text-primary)]">{opt.label}</span>
                        <span className="text-[var(--color-text-secondary)]">{votes} votes ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--color-surface-base)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--color-brand-purple)] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-[var(--color-text-secondary)]">
                {poll.totalVotes} total votes | {(Number(poll.totalAmount || 0) / 1e9).toFixed(2)} SOL tipped
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
