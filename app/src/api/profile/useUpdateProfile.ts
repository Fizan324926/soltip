import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { updateProfile } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

export interface UpdateProfileArgs {
  displayName?: string;
  description?: string;
  imageUrl?: string;
  minTipAmount?: bigint;
  withdrawalFeeBps?: number;
  acceptAnonymous?: boolean;
}

export function useUpdateProfile() {
  const client = useAnchorClient();
  const wallet = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: UpdateProfileArgs) => {
      if (!client || !wallet.publicKey) throw new Error("Wallet not connected");
      const txPromise = updateProfile(client, wallet, args);
      void showTxToast(txPromise, { confirmedTitle: "Profile updated!" });
      return txPromise;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.byOwner(wallet.publicKey?.toBase58() ?? "") });
    },
  });
}
