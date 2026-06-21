import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Modal, Button, Input, Textarea, Tabs, TabsContent } from '@/components/ui';
import { useSendTip } from '@/api/tips';
import { useSendTipSpl } from '@/api/tips';
import { WalletConnectButton } from '@/components/shared/WalletConnectButton/WalletConnectButton';
import { solToLamports } from '@/lib/solana/utils';
import { parseTokenAmount } from '@/lib/solana/tokens';
import { KNOWN_TOKENS } from '@/lib/solana/tokens';
import type { TabItem } from '@/components/ui';

const PRESETS = [0.1, 0.5, 1, 5];

const tipTabs: TabItem[] = [
  { value: 'sol', label: 'SOL' },
  { value: 'token', label: 'Token (USDC/USDT)' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientAddress: string;
  recipientName: string;
}

export default function TipModal({ open, onOpenChange, recipientAddress, recipientName }: Props) {
  const { connected } = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [tokenIndex, setTokenIndex] = useState(0);
  const [tokenAmount, setTokenAmount] = useState('');
  const sendSol = useSendTip();
  const sendSpl = useSendTipSpl();

  // Determine network from connection endpoint
  const isMainnet = connection.rpcEndpoint.includes('mainnet');
  const selectedToken = KNOWN_TOKENS[tokenIndex]!;
  const tokenMint = isMainnet ? selectedToken.mintMainnet : selectedToken.mintDevnet;

  const handleSendSol = async () => {
    const lamports = solToLamports(parseFloat(amount));
    await sendSol.mutateAsync({
      recipientAddress,
      amount: lamports,
      message: message || undefined,
    });
    onOpenChange(false);
    setAmount('');
    setMessage('');
  };

  const handleSendSpl = async () => {
    const rawAmount = parseTokenAmount(tokenAmount, selectedToken.decimals);
    await sendSpl.mutateAsync({
      recipientAddress,
      tokenMint,
      amount: rawAmount,
      message: message || undefined,
    });
    onOpenChange(false);
    setTokenAmount('');
    setMessage('');
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Tip @${recipientName}`}>
      <div className="min-w-[320px] pt-2">
        {!connected ? (
          <div className="text-center py-8 flex flex-col items-center gap-4">
            <p className="text-[#86868b]">Connect your wallet to send a tip</p>
            <WalletConnectButton />
          </div>
        ) : (
          <Tabs tabs={tipTabs} defaultValue="sol">
            <TabsContent value="sol" className="mt-4">
              <div className="flex gap-2 flex-wrap mb-3">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    className={`px-4 py-1.5 rounded-lg border text-sm transition-all ${
                      amount === String(p)
                        ? 'bg-solana-purple border-solana-purple text-white'
                        : 'border-black/[0.08] text-[#86868b] hover:border-solana-purple hover:text-solana-purple'
                    }`}
                    onClick={() => setAmount(String(p))}
                  >
                    {p} SOL
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom amount (SOL)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.001"
                className="mb-3"
              />
              <Textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={280}
                rows={3}
                className="mb-5"
              />
              <Button
                fullWidth
                onClick={handleSendSol}
                disabled={!amount || parseFloat(amount) <= 0 || sendSol.isPending}
                loading={sendSol.isPending}
              >
                Send {amount || '0'} SOL
              </Button>
            </TabsContent>

            <TabsContent value="token" className="mt-4">
              <p className="text-sm text-[#86868b] mb-3">
                Send USDC or USDT. You must have tokens in your wallet.
              </p>
              <div className="flex gap-2 mb-3">
                {KNOWN_TOKENS.map((t, i) => (
                  <button
                    key={t.symbol}
                    onClick={() => setTokenIndex(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      tokenIndex === i
                        ? 'bg-solana-purple border-solana-purple text-white'
                        : 'border-black/[0.08] text-[#86868b] hover:border-solana-purple hover:text-solana-purple'
                    }`}
                  >
                    <img src={t.logoUrl} alt={t.symbol} className="w-4 h-4 rounded-full" />
                    {t.symbol}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder={`Amount (${selectedToken.symbol})`}
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                min="0"
                step="0.01"
                className="mb-3"
              />
              <Textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={280}
                rows={3}
                className="mb-5"
              />
              <Button
                fullWidth
                onClick={handleSendSpl}
                disabled={!tokenAmount || parseFloat(tokenAmount) <= 0 || sendSpl.isPending}
                loading={sendSpl.isPending}
              >
                Send {tokenAmount || '0'} {selectedToken.symbol}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Modal>
  );
}
