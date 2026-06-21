import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { findTipProfilePDA } from "@/lib/solana/pda";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface CloseContentGateArgs {
  gateAddress: string;
}

type MethodsNamespace = Record<string, (() => {
  accounts: (a: Record<string, PublicKey>) => { transaction: () => Promise<Transaction> };
}) | undefined>;

export function useCloseContentGate() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ gateAddress }: CloseContentGateArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");

      const program = client.getProgram();
      const [tipProfile] = findTipProfilePDA(publicKey);
      const contentGate = new PublicKey(gateAddress);

      const methodsNamespace = program.methods as MethodsNamespace;
      const closeMethod = methodsNamespace['closeContentGate'];
      if (!closeMethod) throw new Error('closeContentGate method not found in program');

      const tx = await closeMethod()
        .accounts({
          owner: publicKey,
          tipProfile,
          contentGate,
        })
        .transaction();

      const txPromise = client.provider.sendAndConfirm(tx);
      void showTxToast(txPromise, { confirmedTitle: "Content gate closed" });
      return txPromise;
    },
    onSuccess: () => {
      if (publicKey) {
        qc.invalidateQueries({ queryKey: queryKeys.contentGates.byOwner(publicKey.toBase58()) });
      }
    },
  });
}
