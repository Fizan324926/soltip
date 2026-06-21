import React, { useState } from 'react';
import { useMySubscriptions } from '@/api/subscriptions';
import { useCancelSubscription } from '@/api/subscriptions';
import { useCreateSubscription } from '@/api/subscriptions';
import { Button, Card, Skeleton, EmptyState, Badge, Modal, Input } from '@/components/ui';
import { lamportsToSol, solToLamports } from '@/lib/solana/utils';
import { NATIVE_MINT } from '@/lib/solana/constants';

const toStr = (v: any): string => (typeof v === 'string' ? v : v?.toBase58?.() ?? String(v ?? ''));

const INTERVAL_OPTIONS = [
  { label: 'Weekly', seconds: BigInt(7 * 24 * 3600) },
  { label: 'Monthly', seconds: BigInt(30 * 24 * 3600) },
];

export default function SubscriptionsPage() {
  const { data: subs, isLoading } = useMySubscriptions();
  const cancel = useCancelSubscription();
  const create = useCreateSubscription();

  const [createOpen, setCreateOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amountSol, setAmountSol] = useState('');
  const [intervalIdx, setIntervalIdx] = useState(1);

  const handleCreate = async () => {
    if (!recipientAddress || !amountSol) return;
    await create.mutateAsync({
      recipientAddress,
      amountPerInterval: solToLamports(parseFloat(amountSol)),
      intervalSeconds: INTERVAL_OPTIONS[intervalIdx]!.seconds,
      isSpl: false,
      tokenMint: NATIVE_MINT.toBase58(),
    });
    setCreateOpen(false);
    setRecipientAddress('');
    setAmountSol('');
  };

  const subList = Array.isArray(subs) ? subs : subs ? [subs] : [];

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-extrabold">Subscriptions</h1>
        <Button onClick={() => setCreateOpen(true)}>+ New Subscription</Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-[100px] rounded-2xl" />)}
        </div>
      ) : subList.length === 0 ? (
        <EmptyState
          title="No subscriptions"
          description="Support creators with monthly recurring tips. Click 'New Subscription' to get started."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {subList.map((sub: any) => {
            const sa = sub.account ?? sub;
            return (
              <Card key={toStr(sub.publicKey)} className="!p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold mb-1">{lamportsToSol(sa.amountPerInterval ?? 0n)} SOL / interval</div>
                    <div className="text-xs text-[#86868b]">
                      {sa.isActive ? 'Active' : 'Inactive'} · Payments: {(sa.paymentCount ?? 0).toString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={sa.isActive ? 'success' : 'default'}>
                      {sa.isActive ? 'Active' : 'Cancelled'}
                    </Badge>
                    {sa.isActive && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={cancel.isPending}
                        onClick={() => cancel.mutateAsync(toStr(sub.publicKey))}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="New Subscription">
        <div className="min-w-[320px] flex flex-col gap-4 pt-2">
          <div>
            <label className="text-sm font-medium text-[#86868b] block mb-1">Creator Wallet Address</label>
            <Input
              placeholder="Recipient wallet address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#86868b] block mb-1">Amount per interval (SOL)</label>
            <Input
              type="number"
              placeholder="e.g. 0.1"
              value={amountSol}
              onChange={(e) => setAmountSol(e.target.value)}
              min="0"
              step="0.001"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#86868b] block mb-2">Interval</label>
            <div className="flex gap-2">
              {INTERVAL_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  onClick={() => setIntervalIdx(i)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    intervalIdx === i
                      ? 'bg-solana-purple border-solana-purple text-white'
                      : 'border-black/[0.08] text-[#86868b] hover:border-solana-purple hover:text-solana-purple'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            fullWidth
            onClick={handleCreate}
            disabled={!recipientAddress || !amountSol || parseFloat(amountSol) <= 0 || create.isPending}
            loading={create.isPending}
          >
            Subscribe
          </Button>
        </div>
      </Modal>
    </div>
  );
}
