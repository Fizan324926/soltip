import React from 'react';
import { EmptyState } from '@/components/ui';

export default function TransactionsPage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold mb-8">Transaction History</h1>
      <EmptyState
        title="Transaction indexing coming soon"
        description="On-chain transaction history requires the Actix-web backend indexer. Events are emitted on-chain and will be displayed here once the backend is connected."
      />
    </div>
  );
}
