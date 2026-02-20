import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";
import { vaultApi } from "@/lib/api";

export function useVault(profilePda: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.vault.byProfile(profilePda ?? ""),
    queryFn: async () => {
      if (!profilePda) throw new Error("No profile PDA");
      return vaultApi.getVault(profilePda);
    },
    enabled: !!profilePda,
    staleTime: 15_000,
  });
}
