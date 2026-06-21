import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";
import { PublicKey } from "@solana/web3.js";
import { SEEDS } from "@/lib/solana/constants";

export function useVerifyCreator() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ creatorAddress, verified }: { creatorAddress: string; verified: boolean }) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      const program = client.getProgram();
      const creatorPk = new PublicKey(creatorAddress);
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.PLATFORM_CONFIG)], program.programId
      );
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.TIP_PROFILE), creatorPk.toBuffer()], program.programId
      );
      const txPromise = (program.methods as any)
        .verifyCreator(verified)
        .accounts({ authority: publicKey, platformConfig: configPda, creatorProfile: profilePda })
        .rpc() as Promise<string>;
      void showTxToast(txPromise, { confirmedTitle: "Creator verification updated!" });
      return txPromise;
    },
    onSuccess: (_sig, { creatorAddress }) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.byOwner(creatorAddress) });
    },
  });
}
