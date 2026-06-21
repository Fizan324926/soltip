import { useMutation } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { sendTipSplit } from "@/lib/anchor/instructions";
import { tipsApi } from "@/lib/api";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface SendTipSplitArgs {
  recipientAddress: string;
  amount: bigint;
  message?: string;
  recipientWallets: string[];
}

export function useSendTipSplit() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();

  return useMutation({
    mutationFn: async ({ recipientAddress, amount, message, recipientWallets }: SendTipSplitArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      const txPromise = sendTipSplit(client, publicKey, recipientAddress, amount, message, recipientWallets);
      void showTxToast(txPromise, { confirmedTitle: "Split tip sent! ✂️" });
      const sig = await txPromise;

      try {
        await tipsApi.recordTipSplit({
          tx_signature: sig,
          tipper_address: publicKey.toBase58(),
          recipient_address: recipientAddress,
          amount_lamports: Number(amount),
          message,
        });
      } catch (e) {
        console.warn("Failed to index split tip in backend:", e);
      }

      return sig;
    },
  });
}
