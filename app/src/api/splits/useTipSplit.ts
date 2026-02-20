import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";
import { splitsApi } from "@/lib/api";

export function useTipSplit(profilePda: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.tipSplit.byProfile(profilePda ?? ""),
    queryFn: async () => {
      if (!profilePda) throw new Error("No profile PDA");
      return splitsApi.getSplit(profilePda);
    },
    enabled: !!profilePda,
    staleTime: 60_000,
  });
}
