import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { findTipProfilePDA, findTipPollPDA } from "@/lib/solana/pda";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface CreatePollArgs {
  pollId: bigint;
  title: string;
  description: string;
  options: string[];
  deadline?: bigint;
}

type MethodsNamespace = Record<string, ((pollId: BN, title: string, desc: string, opts: string[], deadline: BN | null) => {
  accounts: (a: Record<string, PublicKey>) => { transaction: () => Promise<Transaction> };
}) | undefined>;

export function useCreatePoll() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ pollId, title, description, options, deadline }: CreatePollArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      if (options.length < 2 || options.length > 4) {
        throw new Error("Poll must have 2-4 options");
      }

      const program = client.getProgram();
      const [tipProfile] = findTipProfilePDA(publicKey);
      const [tipPoll] = findTipPollPDA(tipProfile, pollId);

      const methodsNamespace = program.methods as MethodsNamespace;
      const createMethod = methodsNamespace['createPoll'];
      if (!createMethod) throw new Error('createPoll method not found in program');

      const tx = await createMethod(
          new BN(pollId.toString()),
          title,
          description,
          options,
          deadline ? new BN(deadline.toString()) : null
        )
        .accounts({
          owner: publicKey,
          tipProfile,
          tipPoll,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const txPromise = client.provider.sendAndConfirm(tx);
      void showTxToast(txPromise, { confirmedTitle: "Poll created!" });
      return txPromise;
    },
    onSuccess: () => {
      if (publicKey) {
        qc.invalidateQueries({ queryKey: queryKeys.polls.byOwner(publicKey.toBase58()) });
      }
    },
  });
}
