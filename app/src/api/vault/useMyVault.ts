import { useWallet } from "@solana/wallet-adapter-react";
import { useVault } from "./useVault";
import { findTipProfilePDA } from "@/lib/solana/pda";
import { PublicKey } from "@solana/web3.js";

export function useMyVault() {
  const { publicKey } = useWallet();
  let profilePda: string | null = null;
  try {
    if (publicKey) {
      const [pda] = findTipProfilePDA(publicKey);
      profilePda = pda.toBase58();
    }
  } catch {}
  return useVault(profilePda);
}
