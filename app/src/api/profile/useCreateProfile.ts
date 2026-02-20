import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { createProfile } from "@/lib/anchor/instructions";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

export interface CreateProfileArgs {
  username: string;
  displayName: string;
  description: string;
  imageUrl: string;
}

export function useCreateProfile() {
  const client = useAnchorClient();
  const wallet = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: CreateProfileArgs) => {
      if (!client || !wallet.publicKey) throw new Error("Wallet not connected");
      return createProfile(client, wallet, args);
    },
    onSuccess: (sig) => {
      showTxToast(sig, "Profile created!");
      qc.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}
