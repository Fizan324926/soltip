import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { contributeGoal } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface ContributeGoalArgs {
  goalAddress: string;
  recipientAddress: string;
  amount: bigint;
  message?: string;
}

export function useContributeGoal() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalAddress, recipientAddress, amount, message }: ContributeGoalArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      return contributeGoal(client, publicKey, goalAddress, recipientAddress, amount, message);
    },
    onSuccess: (tx, { recipientAddress }) => {
      showTxToast(tx, "Contributed to goal! 🎯");
      qc.invalidateQueries({ queryKey: queryKeys.goals.byProfile(recipientAddress) });
    },
  });
}
