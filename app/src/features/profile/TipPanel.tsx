import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { WalletConnectButton } from "@/components/shared/WalletConnectButton/WalletConnectButton";
import { useSendTip } from "@/api/tips/useSendTip";
import { useSendTipSpl } from "@/api/tips/useSendTipSpl";
import { solToLamports } from "@/lib/solana/utils";
import styles from "./TipPanel.module.css";

const PRESETS = [0.1, 0.5, 1, 5, 10];

interface Props {
  open: boolean;
  onClose: () => void;
  recipientAddress: string;
  recipientName: string;
}

export default function TipPanel({ open, onClose, recipientAddress, recipientName }: Props) {
  const { connected } = useWallet();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const sendTip = useSendTip();
  const sendSpl = useSendTipSpl();

  const handleSend = async () => {
    const lamports = solToLamports(parseFloat(amount));
    await sendTip.mutateAsync({ recipientAddress, amount: lamports, message: message || undefined });
    onClose();
    setAmount(""); setMessage("");
  };

  return (
    <Modal open={open} onClose={onClose} title={`Tip @${recipientName}`}>
      <div className={styles.root}>
        {!connected ? (
          <div className={styles.connect}>
            <p>Connect your wallet to send a tip</p>
            <WalletConnectButton />
          </div>
        ) : (
          <Tabs defaultValue="sol">
            <TabsList>
              <TabsTrigger value="sol">◎ SOL</TabsTrigger>
              <TabsTrigger value="token">🪙 USDC</TabsTrigger>
            </TabsList>
            <TabsContent value="sol">
              <div className={styles.presets}>
                {PRESETS.map((p) => (
                  <button key={p} className={`${styles.preset} ${amount === String(p) ? styles.presetActive : ""}`} onClick={() => setAmount(String(p))}>
                    {p} SOL
                  </button>
                ))}
              </div>
              <Input type="number" placeholder="Custom amount (SOL)" value={amount} onChange={(e) => setAmount(e.target.value)} className={styles.inp} />
              <Textarea placeholder="Add a message (optional, 280 chars max)" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={280} rows={3} className={styles.msg} />
              <Button fullWidth onClick={handleSend} disabled={!amount || parseFloat(amount) <= 0 || sendTip.isPending} loading={sendTip.isPending} className={styles.sendBtn}>
                Send {amount || "0"} SOL 💜
              </Button>
            </TabsContent>
            <TabsContent value="token">
              <p className={styles.note}>USDC tipping — enter amount in USDC.</p>
              <Input type="number" placeholder="Amount (USDC)" className={styles.inp} />
              <Textarea placeholder="Add a message (optional)" rows={3} className={styles.msg} />
              <Button fullWidth disabled className={styles.sendBtn}>Send USDC Tip</Button>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Modal>
  );
}
