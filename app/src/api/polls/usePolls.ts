import { useQuery } from "@tanstack/react-query";
import { useAnchorClient } from "@/hooks/useAnchorClient";
import { PublicKey } from "@solana/web3.js";
import { queryKeys } from "@/api/queryKeys";

export interface PollOption {
  label: string;
  voteCount: number;
  totalAmount: bigint;
}

export interface Poll {
  address: string;
  profile: string;
  pollId: bigint;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  totalAmount: bigint;
  deadline: bigint | null;
  isActive: boolean;
  createdAt: bigint;
}

interface PollOptionData {
  label: string;
  voteCount: number;
  totalAmount: { toString: () => string };
}

interface AccountData {
  profile: PublicKey;
  pollId: { toString: () => string };
  title: string;
  description: string;
  options: PollOptionData[];
  totalVotes: number;
  totalAmount: { toString: () => string };
  deadline: { toString: () => string } | null;
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

export function usePolls(ownerAddress?: string) {
  const client = useAnchorClient();

  return useQuery({
    queryKey: queryKeys.polls.byOwner(ownerAddress ?? ""),
    queryFn: async (): Promise<Poll[]> => {
      if (!client || !ownerAddress) return [];

      const program = client.getProgram();
      const accountNamespace = program.account as AccountNamespace;
      const tipPollAccount = accountNamespace['tipPoll'];
      if (!tipPollAccount) throw new Error('tipPoll account not found in program');

      const accounts = await tipPollAccount.all([
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
        pollId: BigInt(acc.account.pollId.toString()),
        title: acc.account.title,
        description: acc.account.description,
        options: acc.account.options.map((opt) => ({
          label: opt.label,
          voteCount: opt.voteCount,
          totalAmount: BigInt(opt.totalAmount.toString()),
        })),
        totalVotes: acc.account.totalVotes,
        totalAmount: BigInt(acc.account.totalAmount.toString()),
        deadline: acc.account.deadline ? BigInt(acc.account.deadline.toString()) : null,
        isActive: acc.account.isActive,
        createdAt: BigInt(acc.account.createdAt.toString()),
      }));
    },
    enabled: !!client && !!ownerAddress,
    staleTime: 30_000,
  });
}
