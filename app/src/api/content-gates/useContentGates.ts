import { useQuery } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { PublicKey } from "@solana/web3.js";
import { queryKeys } from "@/api/queryKeys";

export interface ContentGate {
  address: string;
  profile: string;
  gateId: bigint;
  title: string;
  contentUrlHash: Uint8Array;
  requiredAmount: bigint;
  accessCount: number;
  isActive: boolean;
  createdAt: bigint;
}

interface AccountData {
  profile: PublicKey;
  gateId: { toString: () => string };
  title: string;
  contentUrlHash: number[];
  requiredAmount: { toString: () => string };
  accessCount: number;
  isActive: boolean;
  createdAt: { toString: () => string };
}

interface AccountResult {
  publicKey: { toBase58: () => string };
  account: AccountData;
}

type AccountNamespace = Record<string, {
  all: (filters: Array<{ memcmp: { offset: number; bytes: string } }>) => Promise<AccountResult[]>
} | undefined>;

export function useContentGates(ownerAddress?: string) {
  const client = useAnchorClient();

  return useQuery({
    queryKey: queryKeys.contentGates.byOwner(ownerAddress ?? ""),
    queryFn: async (): Promise<ContentGate[]> => {
      if (!client || !ownerAddress) return [];

      const program = client.getProgram();
      const accountNamespace = program.account as AccountNamespace;
      const contentGateAccount = accountNamespace['contentGate'];
      if (!contentGateAccount) throw new Error('contentGate account not found in program');

      const accounts = await contentGateAccount.all([
        {
          memcmp: {
            offset: 8,
            bytes: new PublicKey(ownerAddress).toBase58(),
          },
        },
      ]);

      return accounts.map((acc) => ({
        address: acc.publicKey.toBase58(),
        profile: acc.account.profile.toBase58(),
        gateId: BigInt(acc.account.gateId.toString()),
        title: acc.account.title,
        contentUrlHash: new Uint8Array(acc.account.contentUrlHash),
        requiredAmount: BigInt(acc.account.requiredAmount.toString()),
        accessCount: acc.account.accessCount,
        isActive: acc.account.isActive,
        createdAt: BigInt(acc.account.createdAt.toString()),
      }));
    },
    enabled: !!client && !!ownerAddress,
    staleTime: 30_000,
  });
}
