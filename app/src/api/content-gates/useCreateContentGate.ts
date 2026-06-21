import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { findTipProfilePDA, findContentGatePDA } from "@/lib/solana/pda";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface CreateContentGateArgs {
  gateId: bigint;
  title: string;
  contentUrlHash: Uint8Array;
  requiredAmount: bigint;
}

type MethodsNamespace = Record<string, ((gateId: BN, title: string, hash: number[], amount: BN) => {
  accounts: (a: Record<string, PublicKey>) => { transaction: () => Promise<Transaction> };
}) | undefined>;

export function useCreateContentGate() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ gateId, title, contentUrlHash, requiredAmount }: CreateContentGateArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      if (contentUrlHash.length !== 32) {
        throw new Error("Content URL hash must be 32 bytes (SHA-256)");
      }

      const program = client.getProgram();
      const [tipProfile] = findTipProfilePDA(publicKey);
      const [contentGate] = findContentGatePDA(tipProfile, gateId);

      const methodsNamespace = program.methods as MethodsNamespace;
      const createMethod = methodsNamespace['createContentGate'];
      if (!createMethod) throw new Error('createContentGate method not found in program');

      const tx = await createMethod(
          new BN(gateId.toString()),
          title,
          Array.from(contentUrlHash),
          new BN(requiredAmount.toString())
        )
        .accounts({
          owner: publicKey,
          tipProfile,
          contentGate,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const txPromise = client.provider.sendAndConfirm(tx);
      void showTxToast(txPromise, { confirmedTitle: "Content gate created!" });
      return txPromise;
    },
    onSuccess: () => {
      if (publicKey) {
        qc.invalidateQueries({ queryKey: queryKeys.contentGates.byOwner(publicKey.toBase58()) });
      }
    },
  });
}
