import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { closeGoal } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { findTipProfilePDA } from "@/lib/solana/pda";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

export function useCloseGoal() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalAddress, goalId }: { goalAddress: string; goalId: bigint }) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      const txPromise = closeGoal(client, publicKey, goalAddress, goalId);
      void showTxToast(txPromise, { confirmedTitle: "Goal closed!" });
      return txPromise;
    },
    onSuccess: () => {
      const [pda] = findTipProfilePDA(publicKey!);
      qc.invalidateQueries({ queryKey: queryKeys.goals.byProfile(pda.toBase58()) });
    },
  });
}
