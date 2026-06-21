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
      const txPromise = contributeGoal(client, publicKey, goalAddress, recipientAddress, amount, message);
      void showTxToast(txPromise, { confirmedTitle: "Contributed to goal! 🎯" });
      return txPromise;
    },
    onSuccess: (_sig, { recipientAddress }) => {
      qc.invalidateQueries({ queryKey: queryKeys.goals.byProfile(recipientAddress) });
    },
  });
}
