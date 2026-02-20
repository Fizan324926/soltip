import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTipSplit } from '@/api/splits';
import { useConfigureSplit } from '@/api/splits';
import { Button, Input, Card, EmptyState } from '@/components/ui';
import { findTipProfilePDA } from '@/lib/solana/pda';

// Helper to safely get string from a value that might be a PublicKey or string
const toStr = (v: any): string => (typeof v === 'string' ? v : v?.toBase58?.() ?? String(v ?? ''));

export default function SplitsPage() {
  const { publicKey } = useWallet();
  const [recipients, setRecipients] = useState([
    { wallet: '', shareBps: 5000, label: 'Collaborator 1' },
    { wallet: '', shareBps: 5000, label: 'Collaborator 2' },
  ]);

  let profilePda = '';
  try {
    if (publicKey) {
      const [pda] = findTipProfilePDA(publicKey);
      profilePda = pda.toBase58();
    }
  } catch {}

  const { data: split } = useTipSplit(profilePda || null);
  const configure = useConfigureSplit();
  const totalBps = recipients.reduce((sum, r) => sum + r.shareBps, 0);

  // Backend returns { publicKey, account: { profile, numRecipients, recipients, isActive } }
  const sa = split?.account ?? split;

  return (
    <div className="py-8 max-w-[600px]">
      <h1 className="text-2xl font-extrabold mb-3">Tip Splits</h1>
      <p className="text-white/45 text-sm mb-8 leading-relaxed">
        Automatically distribute tips across multiple wallets on-chain. 2-5 recipients, shares must total 100%.
      </p>

      {sa && (
        <Card className="mb-6 !p-6">
          <h3 className="font-bold mb-4">Current Configuration</h3>
          {(sa.recipients ?? []).map((r: any, i: number) => (
            <div key={i} className="flex gap-4 items-center py-2 border-b border-surface-border last:border-0">
              <span className="font-semibold text-sm min-w-[120px]">{r.label}</span>
              <span className="flex-1 font-mono text-xs text-white/40 truncate">{toStr(r.wallet)}</span>
              <span className="font-bold text-solana-green min-w-[50px] text-right">{(r.shareBps / 100).toFixed(1)}%</span>
            </div>
          ))}
        </Card>
      )}

      <Card className="!p-6">
        <h3 className="font-bold mb-5">Configure Recipients</h3>
        {recipients.map((r, i) => (
          <div key={i} className="flex gap-3 mb-3">
            <Input
              placeholder="Wallet address"
              value={r.wallet}
              onChange={(e) => {
                const next = [...recipients];
                next[i] = { ...next[i], wallet: e.target.value };
                setRecipients(next);
              }}
            />
            <Input
              type="number"
              placeholder="%"
              value={(r.shareBps / 100).toString()}
              onChange={(e) => {
                const next = [...recipients];
                next[i] = { ...next[i], shareBps: Math.round(parseFloat(e.target.value || '0') * 100) };
                setRecipients(next);
              }}
              min="1" max="99"
              className="!w-[90px]"
            />
          </div>
        ))}
        <div className="flex justify-between items-center my-4 text-sm text-white/45">
          <span>Total:</span>
          <span className={totalBps === 10000 ? 'text-solana-green font-bold' : 'text-red-500 font-bold'}>
            {(totalBps / 100).toFixed(1)}%
          </span>
        </div>
        <Button
          fullWidth
          onClick={() => configure.mutateAsync(recipients)}
          disabled={totalBps !== 10000 || recipients.some(r => !r.wallet) || configure.isPending}
          loading={configure.isPending}
        >
          Save Split Configuration
        </Button>
      </Card>
    </div>
  );
}
