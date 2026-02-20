import { useMutation } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { sendTipSplit } from "@/lib/anchor/instructions";
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
      return sendTipSplit(client, publicKey, recipientAddress, amount, message, recipientWallets);
    },
    onSuccess: (tx) => {
      showTxToast(tx, "Split tip sent! ✂️");
    },
  });
}
