import { useWallet } from "@solana/wallet-adapter-react";
import { useProfile } from "./useProfile";

export function useMyProfile() {
  const { publicKey } = useWallet();
  return useProfile(publicKey?.toBase58() ?? null);
}
