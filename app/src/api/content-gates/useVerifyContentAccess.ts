import { useMutation } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { findTipProfilePDA, findTipperRecordPDA } from "@/lib/solana/pda";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";

interface VerifyContentAccessArgs {
  gateAddress: string;
  creatorAddress: string;
}

type MethodsNamespace = Record<string, (() => {
  accounts: (a: Record<string, PublicKey>) => { transaction: () => Promise<Transaction> };
}) | undefined>;

export function useVerifyContentAccess() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();

  return useMutation({
    mutationFn: async ({ gateAddress, creatorAddress }: VerifyContentAccessArgs) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");

      const program = client.getProgram();
      const creatorOwner = new PublicKey(creatorAddress);
      const [creatorProfile] = findTipProfilePDA(creatorOwner);
      const [tipperRecord] = findTipperRecordPDA(publicKey, creatorProfile);
      const contentGate = new PublicKey(gateAddress);

      const methodsNamespace = program.methods as MethodsNamespace;
      const verifyMethod = methodsNamespace['verifyContentAccess'];
      if (!verifyMethod) throw new Error('verifyContentAccess method not found in program');

      const tx = await verifyMethod()
        .accounts({
          viewer: publicKey,
          creatorProfile,
          tipperRecord,
          contentGate,
        })
        .transaction();

      const txPromise = client.provider.sendAndConfirm(tx);
      void showTxToast(txPromise, { confirmedTitle: "Access verified!" });
      return txPromise;
    },
  });
}
