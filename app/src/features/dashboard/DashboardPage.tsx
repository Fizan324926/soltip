import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Navigate, Link } from 'react-router-dom';
import { useMyProfile } from '@/api/profile';
import { useMyVault } from '@/api/vault';
import { Skeleton, Button } from '@/components/ui';
import { lamportsToSol } from '@/lib/solana/utils';

export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
  const { data: profile, isLoading } = useMyProfile();
  const { data: vault } = useMyVault();

  if (!connected) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <div className="py-8">
        <Skeleton className="h-20 rounded-xl mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[120px] rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16 max-w-[480px] mx-auto">
        <h2 className="text-2xl font-extrabold mb-3">Set up your creator profile</h2>
        <p className="text-white/45 mb-8 leading-relaxed">You don't have a SolTip profile yet. Create one to start accepting tips!</p>
        <Link to="/onboarding"><Button size="lg">Create Profile</Button></Link>
      </div>
    );
  }

  // Backend returns { publicKey, account: { ... } } after camelCase transform
  const a = profile.account ?? profile;
  const va = vault?.account ?? vault;
  const vaultBalance = va?.balance ?? 0n;

  const statCards = [
    { icon: '\uD83D\uDCB0', value: `${lamportsToSol(a.totalAmountReceivedLamports ?? 0n)} SOL`, label: 'Total Earned' },
    { icon: '\uD83C\uDFE6', value: `${lamportsToSol(vaultBalance)} SOL`, label: 'Vault Balance' },
    { icon: '\uD83C\uDF81', value: (a.totalTipsReceived ?? 0n).toString(), label: 'Tips Received' },
    { icon: '\uD83C\uDFC6', value: (a.totalUniqueTippers ?? 0).toString(), label: 'Supporters' },
  ];

  const actions = [
    { icon: '\uD83C\uDFAF', label: 'Manage Goals', to: '/dashboard/goals' },
    { icon: '\uD83D\uDD04', label: 'Subscriptions', to: '/dashboard/subscriptions' },
    { icon: '\u2702\uFE0F', label: 'Tip Splits', to: '/dashboard/splits' },
    { icon: '\uD83D\uDCCA', label: 'Transactions', to: '/dashboard/transactions' },
  ];

  return (
    <div className="py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold mb-1">
          Welcome back,{' '}
          <span className="bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
            {a.displayName}
          </span>
        </h1>
        <p className="text-white/45">@{a.username}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className="p-6 bg-surface-card border border-surface-border rounded-2xl text-center hover:border-solana-purple transition-colors">
            <div className="text-3xl mb-3">{s.icon}</div>
            <div className="text-xl font-extrabold text-solana-green mb-1">{s.value}</div>
            <div className="text-xs text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {actions.map((act) => (
          <Link
            key={act.to}
            to={act.to}
            className="flex flex-col items-center gap-3 p-6 bg-surface-card border border-surface-border rounded-2xl no-underline text-white/45 font-semibold text-sm hover:border-solana-purple hover:text-solana-purple hover:-translate-y-0.5 transition-all"
          >
            <span className="text-2xl">{act.icon}</span>
            <span>{act.label}</span>
          </Link>
        ))}
      </div>

      {/* Vault Widget */}
      {vault && vaultBalance > 0n && (
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-solana-purple/10 to-solana-green/5 border border-solana-purple/30 rounded-2xl">
          <div>
            <h3 className="font-bold mb-1">Your Vault</h3>
            <p className="text-lg font-extrabold text-solana-green">{lamportsToSol(vaultBalance)} SOL available</p>
          </div>
          <Link to="/dashboard/withdraw"><Button variant="secondary">Withdraw</Button></Link>
        </div>
      )}
    </div>
  );
}
