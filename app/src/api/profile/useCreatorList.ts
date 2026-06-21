import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";
import { profileApi } from "@/lib/api";
import type { CreatorFilters } from "@/types/common";

export function useCreatorList(filters?: CreatorFilters) {
  return useQuery({
    queryKey: queryKeys.profile.list(filters as Record<string, unknown> | undefined),
    queryFn: async () => {
      const data = await profileApi.listProfiles({
        search: filters?.search,
        sort_by: filters?.sortBy,
        sort_order: filters?.sortOrder,
        only_verified: filters?.onlyVerified,
      });
      return data.items ?? data;
    },
    staleTime: 60_000,
  });
}
