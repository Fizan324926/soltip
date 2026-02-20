import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";
import { goalsApi } from "@/lib/api";

export function useGoals(profilePda: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.goals.byProfile(profilePda ?? ""),
    queryFn: async () => {
      if (!profilePda) throw new Error("No profile PDA");
      return goalsApi.listGoals(profilePda);
    },
    enabled: !!profilePda,
    staleTime: 30_000,
  });
}
