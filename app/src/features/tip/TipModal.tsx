import React, { useState, useCallback, memo } from 'react';
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

const PRESETS = [0.1, 0.5, 1, 5] as const;

const tipTabs: TabItem[] = [
  { value: 'sol', label: 'SOL' },
  { value: 'token', label: 'Token' },
];

interface PresetButtonProps {
  value: number;
  selected: boolean;
  onClick: () => void;
}

const PresetButton = memo(function PresetButton({ value, selected, onClick }: PresetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-5 py-2.5 rounded-full text-[15px] font-medium
        transition-all duration-150
        ${selected
          ? 'bg-[#9945ff] text-white'
          : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[rgba(0,0,0,0.08)]'
        }
      `}
    >
      {value} SOL
    </button>
  );
});

interface TokenButtonProps {
  token: typeof KNOWN_TOKENS[number];
  selected: boolean;
  onClick: () => void;
}

const TokenButton = memo(function TokenButton({ token, selected, onClick }: TokenButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-full text-[15px] font-medium
        transition-all duration-150
        ${selected
          ? 'bg-[#9945ff] text-white'
          : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[rgba(0,0,0,0.08)]'
        }
      `}
    >
      <img src={token.logoUrl} alt={token.symbol} className="w-5 h-5 rounded-full" />
      {token.symbol}
    </button>
  );
});

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

  const isMainnet = connection.rpcEndpoint.includes('mainnet');
  const selectedToken = KNOWN_TOKENS[tokenIndex]!;
  const tokenMint = isMainnet ? selectedToken.mintMainnet : selectedToken.mintDevnet;

  const handleSendSol = useCallback(async () => {
    const lamports = solToLamports(parseFloat(amount));
    await sendSol.mutateAsync({
      recipientAddress,
      amount: lamports,
      message: message || undefined,
    });
    onOpenChange(false);
    setAmount('');
    setMessage('');
  }, [amount, message, recipientAddress, sendSol, onOpenChange]);

  const handleSendSpl = useCallback(async () => {
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
  }, [tokenAmount, selectedToken.decimals, recipientAddress, tokenMint, message, sendSpl, onOpenChange]);

  const resetForm = useCallback(() => {
    setAmount('');
    setMessage('');
    setTokenAmount('');
  }, []);

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
      title={`Tip @${recipientName}`}
      size="sm"
    >
      <div className="pt-2">
        {!connected ? (
          <div className="text-center py-10 flex flex-col items-center gap-5">
            <p className="text-[17px] text-[#86868b]">
              Connect your wallet to send a tip
            </p>
            <WalletConnectButton />
          </div>
        ) : (
          <Tabs tabs={tipTabs} defaultValue="sol">
            {/* SOL Tab */}
            <TabsContent value="sol" className="mt-5">
              <div className="flex gap-2 flex-wrap mb-4">
                {PRESETS.map((p) => (
                  <PresetButton
                    key={p}
                    value={p}
                    selected={amount === String(p)}
                    onClick={() => setAmount(String(p))}
                  />
                ))}
              </div>

              <Input
                type="number"
                placeholder="Or enter custom amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.001"
                suffix="SOL"
                containerClassName="mb-4"
              />

              <Textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={280}
                rows={3}
                containerClassName="mb-6"
              />

              <Button
                fullWidth
                size="lg"
                onClick={handleSendSol}
                disabled={!amount || parseFloat(amount) <= 0 || sendSol.isPending}
                loading={sendSol.isPending}
              >
                Send {amount || '0'} SOL
              </Button>
            </TabsContent>

            {/* Token Tab */}
            <TabsContent value="token" className="mt-5">
              <p className="text-[14px] text-[#86868b] mb-4">
                Select a token to send
              </p>

              <div className="flex gap-2 flex-wrap mb-4">
                {KNOWN_TOKENS.map((t, i) => (
                  <TokenButton
                    key={t.symbol}
                    token={t}
                    selected={tokenIndex === i}
                    onClick={() => setTokenIndex(i)}
                  />
                ))}
              </div>

              <Input
                type="number"
                placeholder="Amount"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                min="0"
                step="0.01"
                suffix={selectedToken.symbol}
                containerClassName="mb-4"
              />

              <Textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={280}
                rows={3}
                containerClassName="mb-6"
              />

              <Button
                fullWidth
                size="lg"
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
