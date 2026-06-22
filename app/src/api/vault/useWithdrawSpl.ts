import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { withdrawSpl } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { findTipProfilePDA } from "@/lib/solana/pda";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface WithdrawSplParams {
  tokenMint: string;
  amount: bigint;
}

export function useWithdrawSpl() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ tokenMint, amount }: WithdrawSplParams) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      const txPromise = withdrawSpl(client, publicKey, tokenMint, amount);
      void showTxToast(txPromise, { confirmedTitle: "SPL withdrawal successful!" });
      return txPromise;
    },
    onSuccess: () => {
      const [pda] = findTipProfilePDA(publicKey!);
      qc.invalidateQueries({ queryKey: queryKeys.vault.byProfile(pda.toBase58()) });
    },
  });
}
