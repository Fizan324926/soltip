import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { queryKeys } from "@/api/queryKeys";
import { subscriptionsApi } from "@/lib/api";

export function useMySubscriptions() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58() ?? "";

  return useQuery({
    queryKey: queryKeys.subscription.bySubscriber(address),
    queryFn: async () => {
      if (!address) throw new Error("Not connected");
      return subscriptionsApi.getBySubscriber(address);
    },
    enabled: !!address,
    staleTime: 30_000,
  });
}
