import React from 'react';
import { useMySubscriptions } from '@/api/subscriptions';
import { useCancelSubscription } from '@/api/subscriptions';
import { Button, Card, Skeleton, EmptyState, Badge } from '@/components/ui';
import { lamportsToSol } from '@/lib/solana/utils';

// Helper to safely get string from a value that might be a PublicKey or string
const toStr = (v: any): string => (typeof v === 'string' ? v : v?.toBase58?.() ?? String(v ?? ''));

export default function SubscriptionsPage() {
  const { data: subs, isLoading } = useMySubscriptions();
  const cancel = useCancelSubscription();

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold mb-8">Subscriptions</h1>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-[100px] rounded-2xl" />)}
        </div>
      ) : !subs || (Array.isArray(subs) ? subs.length === 0 : true) ? (
        <EmptyState
          title="No subscriptions"
          description="You don't have any recurring subscriptions yet. Support creators with monthly recurring tips from their profile page."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {(Array.isArray(subs) ? subs : [subs]).map((sub: any) => {
            const sa = sub.account ?? sub;
            return (
              <Card key={toStr(sub.publicKey)} className="!p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold mb-1">{lamportsToSol(sa.amountPerInterval ?? 0n)} SOL / interval</div>
                    <div className="text-xs text-white/40">
                      {sa.isActive ? 'Active' : 'Inactive'} &middot; Payments: {(sa.paymentCount ?? 0).toString()}
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
    </div>
  );
}
