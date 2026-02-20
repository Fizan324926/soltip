import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { SOLTIP_IDL } from './idl';

// ============================================================
// Constants
// ============================================================
export const PROGRAM_ID = new PublicKey(
  import.meta.env['VITE_PROGRAM_ID'] ?? 'BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo'
);

const DEFAULT_COMMITMENT: Commitment = 'confirmed';

const PROVIDER_OPTS: {
  preflightCommitment: Commitment;
  commitment: Commitment;
  skipPreflight: boolean;
} = {
  preflightCommitment: DEFAULT_COMMITMENT,
  commitment: DEFAULT_COMMITMENT,
  skipPreflight: false,
};

// ============================================================
// AnchorClient
// ============================================================

/**
 * `AnchorClient`
 *
 * Thin wrapper that holds an `AnchorProvider` + `Program<Idl>` pair.
 * Construct via `createAnchorClient(connection, wallet)` rather than
 * `new AnchorClient(...)` directly.
 *
 * All methods that interact with the chain should go through this class
 * so that the program instance can be mocked in tests.
 */
export class AnchorClient {
  public readonly provider: AnchorProvider;
  private readonly program: Program<Idl>;

  constructor(connection: Connection, wallet: AnchorWallet) {
    this.provider = new AnchorProvider(connection, wallet, PROVIDER_OPTS);
    this.program  = new Program(SOLTIP_IDL as Idl, this.provider);
  }

  // ── Program accessor ──────────────────────────────────────

  /**
   * Returns the Anchor `Program` instance pre-loaded with the SolTip IDL.
   * Use this to build transactions:
   *
   * ```ts
   * const sig = await client.getProgram().methods
   *   .sendTip(amountBn, message)
   *   .accounts({ ... })
   *   .rpc();
   * ```
   */
  getProgram(): Program<Idl> {
    return this.program;
  }

  // ── Convenience getters ───────────────────────────────────

  /** The wallet's public key. */
  get walletPublicKey(): PublicKey {
    return this.provider.wallet.publicKey;
  }

  /** The underlying web3.js Connection. */
  get connection(): Connection {
    return this.provider.connection;
  }

  /** The program ID (PublicKey). */
  get programId(): PublicKey {
    return this.program.programId;
  }

  // ── Helper: fetch + decode any known account type ─────────

  /**
   * Fetches and decodes an on-chain account by its public key.
   *
   * @param accountType  The account name as it appears in the IDL
   *                     (e.g. `'tipProfile'`, `'vault'`, `'tipGoal'`).
   * @param address      The on-chain address to fetch.
   *
   * @returns The decoded account data, or `null` if the account does not exist.
   *
   * @example
   * const profile = await client.fetchAccount('tipProfile', profilePda);
   */
  async fetchAccount<T extends object>(
    accountType: string,
    address: PublicKey
  ): Promise<T | null> {
    try {
      const acct = await (this.program.account as Record<string, { fetchNullable: (address: PublicKey) => Promise<T | null> }>)[accountType]?.fetchNullable(address);
      return acct ?? null;
    } catch (err) {
      console.warn(`[AnchorClient] fetchAccount("${accountType}", ${address.toBase58()}) failed:`, err);
      return null;
    }
  }

  /**
   * Returns the `AnchorProvider` – useful for raw RPC calls that bypass
   * the Anchor abstraction layer.
   */
  getProvider(): AnchorProvider {
    return this.provider;
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * `createAnchorClient`
 *
 * Factory function used by `useAnchorClient` (and in tests).
 * Returns a fully configured `AnchorClient` for the given
 * connection + wallet pair.
 *
 * @param connection  A `@solana/web3.js` `Connection` instance.
 * @param wallet      An `AnchorWallet` (from `useAnchorWallet()`).
 */
export function createAnchorClient(
  connection: Connection,
  wallet: AnchorWallet
): AnchorClient {
  return new AnchorClient(connection, wallet);
}
