import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { createGoal } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { findTipProfilePDA } from "@/lib/solana/pda";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface CreateGoalArgs {
  goalId: bigint;
  title: string;
  description: string;
  targetAmount: bigint;
  tokenMint: string;
  deadline?: bigint;
}

export function useCreateGoal() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: CreateGoalArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      return createGoal(client, publicKey, args);
    },
    onSuccess: (tx) => {
      showTxToast(tx, "Goal created! 🎯");
      const [pda] = findTipProfilePDA(publicKey!);
      qc.invalidateQueries({ queryKey: queryKeys.goals.byProfile(pda.toBase58()) });
    },
  });
}
