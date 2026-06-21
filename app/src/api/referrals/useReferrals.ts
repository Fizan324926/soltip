import { useQuery } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { PublicKey } from "@solana/web3.js";
import { queryKeys } from "@/api/queryKeys";

export interface Referral {
  address: string;
  referrer: string;
  refereeProfile: string;
  feeShareBps: number;
  totalEarned: bigint;
  referralCount: number;
  isActive: boolean;
  createdAt: bigint;
}

interface AccountData {
  referrer: PublicKey;
  refereeProfile: PublicKey;
  feeShareBps: number;
  totalEarned: { toString: () => string };
  referralCount: number;
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

export function useReferrals(referrerAddress?: string) {
  const client = useAnchorClient();

  return useQuery({
    queryKey: queryKeys.referrals.byReferrer(referrerAddress ?? ""),
    queryFn: async (): Promise<Referral[]> => {
      if (!client || !referrerAddress) return [];

      const program = client.getProgram();
      const accountNamespace = program.account as AccountNamespace;
      const referralAccount = accountNamespace['referral'];
      if (!referralAccount) throw new Error('referral account not found in program');

      const accounts = await referralAccount.all([
        {
          memcmp: {
            offset: 8,
            bytes: new PublicKey(referrerAddress).toBase58(),
          },
        },
      ]);

      return accounts.map((acc) => ({
        address: acc.publicKey.toBase58(),
        referrer: acc.account.referrer.toBase58(),
        refereeProfile: acc.account.refereeProfile.toBase58(),
        feeShareBps: acc.account.feeShareBps,
        totalEarned: BigInt(acc.account.totalEarned.toString()),
        referralCount: acc.account.referralCount,
        isActive: acc.account.isActive,
        createdAt: BigInt(acc.account.createdAt.toString()),
      }));
    },
    enabled: !!client && !!referrerAddress,
    staleTime: 30_000,
  });
}
