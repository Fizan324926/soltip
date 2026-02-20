import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { sendTip } from "@/lib/anchor/instructions";
import { tipsApi } from "@/lib/api";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface SendTipArgs {
  recipientAddress: string;
  amount: bigint;
  message?: string;
}

export function useSendTip() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipientAddress, amount, message }: SendTipArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      const tx = await sendTip(client, publicKey, recipientAddress, amount, message);

      // Index in backend
      try {
        await tipsApi.recordTip({
          tx_signature: tx,
          tipper_address: publicKey.toBase58(),
          recipient_address: recipientAddress,
          amount_lamports: Number(amount),
          message,
        });
      } catch (e) {
        console.warn("Failed to index tip in backend:", e);
      }

      return tx;
    },
    onSuccess: (tx, { recipientAddress }) => {
      showTxToast(tx, "Tip sent!");
      qc.invalidateQueries({ queryKey: queryKeys.profile.byOwner(recipientAddress) });
    },
  });
}
