import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { withdraw } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { findTipProfilePDA } from "@/lib/solana/pda";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

export function useWithdraw() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      return withdraw(client, publicKey, amount);
    },
    onSuccess: (tx) => {
      showTxToast(tx, "Withdrawal successful!");
      const [pda] = findTipProfilePDA(publicKey!);
      qc.invalidateQueries({ queryKey: queryKeys.vault.byProfile(pda.toBase58()) });
    },
  });
}
