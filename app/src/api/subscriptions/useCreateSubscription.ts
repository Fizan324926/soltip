import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { createSubscription } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface CreateSubArgs {
  recipientAddress: string;
  amountPerInterval: bigint;
  intervalSeconds: bigint;
  isSpl: boolean;
  tokenMint: string;
}

export function useCreateSubscription() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: CreateSubArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      return createSubscription(client, publicKey, args);
    },
    onSuccess: (tx) => {
      showTxToast(tx, "Subscription created! 🔄");
      qc.invalidateQueries({ queryKey: queryKeys.subscription.all });
    },
  });
}
