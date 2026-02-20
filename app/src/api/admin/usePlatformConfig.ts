import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";
import { adminApi } from "@/lib/api";

export function usePlatformConfig() {
  return useQuery({
    queryKey: queryKeys.platform.config(),
    queryFn: async () => {
      return adminApi.getPlatformConfig();
    },
    staleTime: 60_000,
  });
}
