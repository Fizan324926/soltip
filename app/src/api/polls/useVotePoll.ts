import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { findTipProfilePDA, findTipperRecordPDA, findRateLimitPDA, findVaultPDA, findPlatformConfigPDA, findPlatformTreasuryPDA } from "@/lib/solana/pda";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface VotePollArgs {
  pollAddress: string;
  recipientAddress: string;
  optionIndex: number;
  amount: bigint;
  message?: string;
}

type MethodsNamespace = Record<string, ((optionIdx: number, amount: BN, msg: string | null) => {
  accounts: (a: Record<string, PublicKey>) => { transaction: () => Promise<Transaction> };
}) | undefined>;

export function useVotePoll() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ pollAddress, recipientAddress, optionIndex, amount, message }: VotePollArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");

      const program = client.getProgram();
      const recipientOwner = new PublicKey(recipientAddress);
      const tipPoll = new PublicKey(pollAddress);
      const [recipientProfile] = findTipProfilePDA(recipientOwner);
      const [vault] = findVaultPDA(recipientProfile);
      const [tipperRecord] = findTipperRecordPDA(publicKey, recipientProfile);
      const [rateLimit] = findRateLimitPDA(publicKey, recipientProfile);
      const [platformConfig] = findPlatformConfigPDA();
      const [platformTreasury] = findPlatformTreasuryPDA();

      const methodsNamespace = program.methods as MethodsNamespace;
      const voteMethod = methodsNamespace['votePoll'];
      if (!voteMethod) throw new Error('votePoll method not found in program');

      const tx = await voteMethod(optionIndex, new BN(amount.toString()), message ?? null)
        .accounts({
          voter: publicKey,
          recipientProfile,
          recipientOwner,
          vault,
          tipPoll,
          tipperRecord,
          rateLimit,
          platformConfig,
          platformTreasury,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const txPromise = client.provider.sendAndConfirm(tx);
      void showTxToast(txPromise, { confirmedTitle: "Vote submitted!" });
      return txPromise;
    },
    onSuccess: (_sig, { pollAddress }) => {
      qc.invalidateQueries({ queryKey: queryKeys.polls.detail(pollAddress) });
    },
  });
}
