import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Modal, Button, Input, Textarea, Tabs, TabsContent } from '@/components/ui';
import { useSendTip } from '@/api/tips';
import { WalletConnectButton } from '@/components/shared/WalletConnectButton/WalletConnectButton';
import { solToLamports } from '@/lib/solana/utils';
import type { TabItem } from '@/components/ui';

const PRESETS = [0.1, 0.5, 1, 5];

const tipTabs: TabItem[] = [
  { value: 'sol', label: 'SOL' },
  { value: 'token', label: 'Token' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientAddress: string;
  recipientName: string;
}

export default function TipModal({ open, onOpenChange, recipientAddress, recipientName }: Props) {
  const { connected } = useWallet();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const sendSol = useSendTip();

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
              <p className="text-sm text-[#86868b] mb-4">
                SPL token tipping (USDC, USDT) - select token and enter amount.
              </p>
              <Input type="number" placeholder="Amount (USDC)" className="mb-3" />
              <Button fullWidth disabled>Send Token Tip</Button>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Modal>
  );
}
