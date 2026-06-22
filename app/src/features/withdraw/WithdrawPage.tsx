import React, { useState } from 'react';
import { useMyVault, useWithdraw, useWithdrawSpl } from '@/api/vault';
import { Button, Input, Card } from '@/components/ui';
import { lamportsToSol, solToLamports } from '@/lib/solana/utils';

// Common SPL tokens on Solana with their mints
const SPL_TOKENS = [
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
  { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
];

export default function WithdrawPage() {
  const { data: vault } = useMyVault();
  const withdraw = useWithdraw();
  const withdrawSpl = useWithdrawSpl();

  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<'SOL' | string>('SOL');
  const [splAmount, setSplAmount] = useState('');

  const va = vault?.account ?? vault;
  const balance = va?.balance ?? 0n;
  const balanceSolStr = lamportsToSol(balance);

  const handleWithdrawSol = async () => {
    const lamports = solToLamports(parseFloat(amount));
    await withdraw.mutateAsync(lamports);
    setAmount('');
  };

  const handleWithdrawSpl = async () => {
    if (selectedToken === 'SOL') return;
    const token = SPL_TOKENS.find(t => t.symbol === selectedToken);
    if (!token || !splAmount) return;

    const units = BigInt(Math.floor(parseFloat(splAmount) * Math.pow(10, token.decimals)));
    await withdrawSpl.mutateAsync({
      tokenMint: token.mint,
      amount: units,
    });
    setSplAmount('');
  };

  return (
    <div className="max-w-[480px] mx-auto py-8">
      <h1 className="text-2xl font-extrabold mb-6">Withdraw Funds</h1>

      <Card className="text-center mb-6 !p-8 bg-gradient-to-r from-solana-purple/10 to-solana-green/5 !border-solana-purple/25">
        <div className="text-sm text-[#86868b] mb-2">Available SOL Balance</div>
        <div className="text-3xl font-black text-solana-green">{balanceSolStr} SOL</div>
      </Card>

      {/* SOL Withdraw */}
      <Card className="!p-6 mb-6">
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
        <p className="text-xs text-[#86868b] mb-5">A 1% platform fee will be deducted from your withdrawal.</p>
        <Button
          fullWidth
          onClick={handleWithdrawSol}
          disabled={!amount || parseFloat(amount) <= 0 || balance === 0n || withdraw.isPending}
          loading={withdraw.isPending}
        >
          Withdraw SOL to Wallet
        </Button>
      </Card>

      {/* SPL Token Withdraw */}
      <Card className="!p-6">
        <h2 className="font-bold mb-5">Withdraw SPL Tokens</h2>

        <div className="mb-4">
          <label className="text-sm text-[#86868b] mb-2 block">Select Token</label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
          >
            <option value="SOL" disabled>Select a token...</option>
            {SPL_TOKENS.map(t => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 items-center mb-3">
          <Input
            type="number"
            placeholder={`Amount (${selectedToken !== 'SOL' ? selectedToken : 'Token'})`}
            value={splAmount}
            onChange={(e) => setSplAmount(e.target.value)}
            min="0"
            step="0.01"
            disabled={selectedToken === 'SOL'}
          />
        </div>

        <p className="text-xs text-[#86868b] mb-5">
          Withdraw SPL tokens (USDC, USDT, BONK, etc.) from your vault.
        </p>

        <Button
          fullWidth
          onClick={handleWithdrawSpl}
          disabled={selectedToken === 'SOL' || !splAmount || parseFloat(splAmount) <= 0 || withdrawSpl.isPending}
          loading={withdrawSpl.isPending}
        >
          Withdraw {selectedToken !== 'SOL' ? selectedToken : 'Tokens'} to Wallet
        </Button>
      </Card>
    </div>
  );
}
