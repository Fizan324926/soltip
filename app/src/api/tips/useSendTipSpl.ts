import { useMutation } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { sendTipSpl } from "@/lib/anchor/instructions";
import { tipsApi } from "@/lib/api";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface SendTipSplArgs {
  recipientAddress: string;
  tokenMint: string;
  amount: bigint;
  message?: string;
}

export function useSendTipSpl() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();

  return useMutation({
    mutationFn: async ({ recipientAddress, tokenMint, amount, message }: SendTipSplArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      const tx = await sendTipSpl(client, publicKey, recipientAddress, tokenMint, amount, message);

      try {
        await tipsApi.recordTipSpl({
          tx_signature: tx,
          tipper_address: publicKey.toBase58(),
          recipient_address: recipientAddress,
          token_mint: tokenMint,
          amount: Number(amount),
          message,
        });
      } catch (e) {
        console.warn("Failed to index SPL tip in backend:", e);
      }

      return tx;
    },
    onSuccess: (tx) => {
      showTxToast(tx, "Token tip sent!");
    },
  });
}
