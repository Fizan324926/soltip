import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";
import { profileApi } from "@/lib/api";

export function useProfile(ownerAddress: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.profile.byOwner(ownerAddress ?? ""),
    queryFn: async () => {
      if (!ownerAddress) throw new Error("No address");
      return profileApi.getProfile(ownerAddress);
    },
    enabled: !!ownerAddress,
    staleTime: 30_000,
  });
}
