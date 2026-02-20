import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";
import { getProgram } from "@/lib/anchor/program";
import { PublicKey } from "@solana/web3.js";
import { SEEDS } from "@/lib/solana/constants";

export function useVerifyCreator() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ creatorAddress, verified }: { creatorAddress: string; verified: boolean }) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      const program = getProgram(client);
      const creatorPk = new PublicKey(creatorAddress);
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.PLATFORM_CONFIG)], program.programId
      );
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.TIP_PROFILE), creatorPk.toBuffer()], program.programId
      );
      const tx = await program.methods
        .verifyCreator(verified)
        .accounts({ authority: publicKey, platformConfig: configPda, creatorProfile: profilePda })
        .rpc();
      return tx;
    },
    onSuccess: (tx, { creatorAddress }) => {
      showTxToast(tx, "Creator verification updated!");
      qc.invalidateQueries({ queryKey: queryKeys.profile.byOwner(creatorAddress) });
    },
  });
}
