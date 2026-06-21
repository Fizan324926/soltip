import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { queryKeys } from "@/api/queryKeys";
import { showTxToast } from "@/components/shared/TransactionToast/TransactionToast";
import { PublicKey } from "@solana/web3.js";
import { SEEDS } from "@/lib/solana/constants";

export function usePausePlatform() {
  const client = useAnchorClient();
  const { publicKey } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (paused: boolean) => {
      if (!client || !publicKey) throw new Error("Wallet not connected");
      const program = client.getProgram();
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.PLATFORM_CONFIG)],
        program.programId
      );
      const txPromise = (program.methods as any)
        .pausePlatform(paused)
        .accounts({ authority: publicKey, platformConfig: configPda })
        .rpc() as Promise<string>;
      const label = paused ? "Platform paused." : "Platform resumed.";
      void showTxToast(txPromise, { confirmedTitle: label });
      return txPromise;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.all });
    },
  });
}
