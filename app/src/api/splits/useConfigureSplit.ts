import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { configureSplit } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { findTipProfilePDA } from "@/lib/solana/pda";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface SplitRecipient {
  wallet: string;
  shareBps: number;
  label: string;
}

export function useConfigureSplit() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (recipients: SplitRecipient[]) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      return configureSplit(client, publicKey, recipients);
    },
    onSuccess: (tx) => {
      showTxToast(tx, "Split configured! ✂️");
      const [pda] = findTipProfilePDA(publicKey!);
      qc.invalidateQueries({ queryKey: queryKeys.tipSplit.byProfile(pda.toBase58()) });
    },
  });
}
