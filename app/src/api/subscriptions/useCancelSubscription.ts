import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { cancelSubscription } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

export function useCancelSubscription() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionAddress: string) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      return cancelSubscription(client, publicKey, subscriptionAddress);
    },
    onSuccess: (tx) => {
      showTxToast(tx, "Subscription cancelled.");
      qc.invalidateQueries({ queryKey: queryKeys.subscription.all });
    },
  });
}
