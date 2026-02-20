import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { initializeVault } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { findTipProfilePDA } from "@/lib/solana/pda";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

export function useInitializeVault() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      const tx = await initializeVault(client, publicKey);
      return tx;
    },
    onSuccess: (tx) => {
      showTxToast(tx, "Vault initialized!");
      const [pda] = findTipProfilePDA(publicKey!);
      qc.invalidateQueries({ queryKey: queryKeys.vault.byProfile(pda.toBase58()) });
    },
  });
}
