import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { findTipProfilePDA, findReferralPDA } from "@/lib/solana/pda";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface RegisterReferralArgs {
  refereeAddress: string;
  feeShareBps: number;
}

type MethodsNamespace = Record<string, ((feeShareBps: number) => {
  accounts: (a: Record<string, PublicKey>) => { transaction: () => Promise<Transaction> };
}) | undefined>;

export function useRegisterReferral() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ refereeAddress, feeShareBps }: RegisterReferralArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      if (feeShareBps > 2000) {
        throw new Error("Fee share cannot exceed 20% (2000 bps)");
      }

      const program = client.getProgram();
      const refereeOwner = new PublicKey(refereeAddress);
      const [refereeProfile] = findTipProfilePDA(refereeOwner);
      const [referral] = findReferralPDA(publicKey, refereeProfile);

      const methodsNamespace = program.methods as MethodsNamespace;
      const registerMethod = methodsNamespace['registerReferral'];
      if (!registerMethod) throw new Error('registerReferral method not found in program');

      const tx = await registerMethod(feeShareBps)
        .accounts({
          referrer: publicKey,
          refereeProfile,
          refereeOwner,
          referral,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const txPromise = client.provider.sendAndConfirm(tx);
      void showTxToast(txPromise, { confirmedTitle: "Referral registered!" });
      return txPromise;
    },
    onSuccess: () => {
      if (publicKey) {
        qc.invalidateQueries({ queryKey: queryKeys.referrals.byReferrer(publicKey.toBase58()) });
      }
    },
  });
}
