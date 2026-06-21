import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { findTipProfilePDA } from "@/lib/solana/pda";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface ClosePollArgs {
  pollAddress: string;
}

type MethodsNamespace = Record<string, (() => {
  accounts: (a: Record<string, PublicKey>) => { transaction: () => Promise<Transaction> };
}) | undefined>;

export function useClosePoll() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ pollAddress }: ClosePollArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");

      const program = client.getProgram();
      const [tipProfile] = findTipProfilePDA(publicKey);
      const tipPoll = new PublicKey(pollAddress);

      const methodsNamespace = program.methods as MethodsNamespace;
      const closeMethod = methodsNamespace['closePoll'];
      if (!closeMethod) throw new Error('closePoll method not found in program');

      const tx = await closeMethod()
        .accounts({
          owner: publicKey,
          tipProfile,
          tipPoll,
        })
        .transaction();

      const txPromise = client.provider.sendAndConfirm(tx);
      void showTxToast(txPromise, { confirmedTitle: "Poll closed" });
      return txPromise;
    },
    onSuccess: () => {
      if (publicKey) {
        qc.invalidateQueries({ queryKey: queryKeys.polls.byOwner(publicKey.toBase58()) });
      }
    },
  });
}
