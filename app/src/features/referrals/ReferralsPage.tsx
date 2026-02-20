import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { referralsApi } from '@/lib/api/client';
import { queryKeys } from '@/api/queryKeys';

export default function ReferralsPage() {
  const { publicKey } = useWallet();
  const publicKeyString = publicKey?.toBase58() || null;
  const queryClient = useQueryClient();

  const [showRegister, setShowRegister] = useState(false);
  const [refereePda, setRefereePda] = useState('');
  const [feeBps, setFeeBps] = useState('500');

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: queryKeys.referrals.byReferrer(publicKeyString || ''),
    queryFn: () => referralsApi.getByReferrer(publicKeyString!),
    enabled: !!publicKeyString,
  });

  const registerMutation = useMutation({
    mutationFn: () => referralsApi.register({
      referee_profile_pda: refereePda,
      fee_share_bps: parseInt(feeBps),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.referrals.byReferrer(publicKeyString || '') });
      setShowRegister(false);
      setRefereePda('');
      setFeeBps('500');
    },
  });

  if (!publicKeyString) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">Connect wallet to view referrals</div>;
  }

  const totalEarned = referrals.reduce((sum: number, r: any) => sum + Number(r.totalEarned || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Referrals</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Earn commission by referring creators to SolTip</p>
        </div>
        <button
          onClick={() => setShowRegister(!showRegister)}
          className="px-4 py-2 rounded-lg bg-[var(--color-brand-purple)] text-white hover:opacity-90 transition"
        >
          {showRegister ? 'Cancel' : 'Register Referral'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{referrals.length}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Active Referrals</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-brand-green)]">{(totalEarned / 1e9).toFixed(4)} SOL</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Total Earned</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {referrals.reduce((sum: number, r: any) => sum + (r.referralCount || 0), 0)}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">Total Tips Referred</p>
        </div>
      </div>

      {showRegister && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 space-y-4">
          <input
            value={refereePda}
            onChange={(e) => setRefereePda(e.target.value)}
            placeholder="Creator profile PDA"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)]"
          />
          <div>
            <label className="text-sm text-[var(--color-text-secondary)]">Fee share (basis points, max 2000 = 20%)</label>
            <input
              value={feeBps}
              onChange={(e) => setFeeBps(e.target.value)}
              type="number"
              min="0"
              max="2000"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
          <button
            onClick={() => registerMutation.mutate()}
            disabled={!refereePda || registerMutation.isPending}
            className="px-6 py-2 rounded-lg bg-[var(--color-brand-green)] text-black font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {registerMutation.isPending ? 'Registering...' : 'Register'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading referrals...</div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">No referrals yet.</div>
      ) : (
        <div className="space-y-3">
          {referrals.map((ref: any) => (
            <div key={ref.publicKey} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-[var(--color-text-primary)]">{ref.refereeProfile}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Fee: {ref.feeShareBps / 100}% | Earned: {(Number(ref.totalEarned || 0) / 1e9).toFixed(4)} SOL</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${ref.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {ref.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
