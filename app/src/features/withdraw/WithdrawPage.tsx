import React, { useState } from 'react';
import { useMyVault } from '@/api/vault';
import { useWithdraw } from '@/api/vault';
import { Button, Input, Card } from '@/components/ui';
import { lamportsToSol, solToLamports } from '@/lib/solana/utils';

export default function WithdrawPage() {
  const { data: vault } = useMyVault();
  const withdraw = useWithdraw();
  const [amount, setAmount] = useState('');

  const va = vault?.account ?? vault;
  const balance = va?.balance ?? 0n;
  const balanceSolStr = lamportsToSol(balance);

  const handleWithdraw = async () => {
    const lamports = solToLamports(parseFloat(amount));
    await withdraw.mutateAsync(lamports);
    setAmount('');
  };

  return (
    <div className="max-w-[480px] mx-auto py-8">
      <h1 className="text-2xl font-extrabold mb-6">Withdraw Funds</h1>

      <Card className="text-center mb-6 !p-8 bg-gradient-to-r from-solana-purple/10 to-solana-green/5 !border-solana-purple/25">
        <div className="text-sm text-white/45 mb-2">Available Balance</div>
        <div className="text-3xl font-black text-solana-green">{balanceSolStr} SOL</div>
      </Card>

      <Card className="!p-6">
        <h2 className="font-bold mb-5">Withdraw SOL</h2>
        <div className="flex gap-2 items-center mb-3">
          <Input
            type="number"
            placeholder="Amount (SOL)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.001"
          />
          <Button variant="ghost" size="sm" onClick={() => setAmount(balanceSolStr)}>
            Max
          </Button>
        </div>
        <p className="text-xs text-white/40 mb-5">A 1% platform fee will be deducted from your withdrawal.</p>
        <Button
          fullWidth
          onClick={handleWithdraw}
          disabled={!amount || parseFloat(amount) <= 0 || balance === 0n || withdraw.isPending}
          loading={withdraw.isPending}
        >
          Withdraw to Wallet
        </Button>
      </Card>
    </div>
  );
}
