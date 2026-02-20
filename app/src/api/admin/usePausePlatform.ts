import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";
import { getProgram } from "@/lib/anchor/program";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { SEEDS } from "@/lib/solana/constants";

export function usePausePlatform() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (paused: boolean) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      const program = getProgram(client);
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.PLATFORM_CONFIG)],
        program.programId
      );
      const tx = await program.methods
        .pausePlatform(paused)
        .accounts({ authority: publicKey, platformConfig: configPda })
        .rpc();
      return tx;
    },
    onSuccess: (tx, paused) => {
      showTxToast(tx, paused ? "Platform paused." : "Platform resumed.");
      qc.invalidateQueries({ queryKey: queryKeys.platform.all });
    },
  });
}
