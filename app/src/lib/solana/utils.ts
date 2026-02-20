import { PublicKey } from '@solana/web3.js';

// ============================================================
// SOL / Lamport conversions
// ============================================================

const LAMPORTS_PER_SOL = 1_000_000_000n;

/**
 * Convert lamports to a human-readable SOL string.
 * @param lamports - bigint or number of lamports
 * @param decimals - number of decimal places to show (default 4)
 */
export function lamportsToSol(
  lamports: bigint | number,
  decimals: number = 4
): string {
  const amount = typeof lamports === 'number' ? BigInt(lamports) : lamports;
  const whole = amount / LAMPORTS_PER_SOL;
  const remainder = amount % LAMPORTS_PER_SOL;

  if (decimals === 0) {
    return whole.toString();
  }

  const factor = BigInt(10 ** (9 - decimals));
  const fractional = remainder / factor;
  const fractionalStr = fractional.toString().padStart(decimals, '0');

  return `${whole}.${fractionalStr}`;
}

/**
 * Convert a SOL amount (float) to lamports as bigint.
 */
export function solToLamports(sol: number): bigint {
  // Use string manipulation to avoid floating-point precision issues
  const [whole, decimal = ''] = sol.toFixed(9).split('.');
  const paddedDecimal = decimal.padEnd(9, '0').slice(0, 9);
  return BigInt(`${whole}${paddedDecimal}`);
}

// ============================================================
// PublicKey formatting
// ============================================================

/**
 * Shorten a public key for display: first N + "..." + last N chars.
 * Default: 4 chars on each side.
 */
export function formatPublicKey(pk: PublicKey, chars: number = 4): string {
  const str = pk.toBase58();
  if (str.length <= chars * 2 + 3) return str;
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

// ============================================================
// Timestamp formatting
// ============================================================

/**
 * Format a Unix timestamp (seconds) into a human-readable local date-time.
 */
export function formatTimestamp(unix: number): string {
  if (!unix || unix <= 0) return 'N/A';
  const date = new Date(unix * 1000);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a Unix timestamp as a relative time string (e.g. "3 days ago").
 */
export function formatRelativeTime(unix: number): string {
  if (!unix || unix <= 0) return 'N/A';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unix;

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

// ============================================================
// Basis-points helpers
// ============================================================

/**
 * Convert basis points to a percentage string.
 * E.g. bpsToPercent(100) => "1.00%"
 */
export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

/**
 * Calculate the fee amount from a principal and a fee in basis points.
 * Uses bigint arithmetic to avoid overflow.
 */
export function calculateFee(amount: bigint, feeBps: number): bigint {
  return (amount * BigInt(feeBps)) / 10_000n;
}

/**
 * Calculate the net amount after fee deduction.
 */
export function amountAfterFee(amount: bigint, feeBps: number): bigint {
  const fee = calculateFee(amount, feeBps);
  return amount - fee;
}

// ============================================================
// Solana Explorer URL helpers
// ============================================================

const EXPLORER_BASE = 'https://explorer.solana.com';

/**
 * Returns a Solana Explorer URL for a transaction signature.
 * @param signature - base58 transaction signature
 * @param network   - 'devnet' | 'mainnet-beta' | 'localnet'
 */
export function getExplorerUrl(signature: string, network: string): string {
  const clusterParam =
    network === 'mainnet-beta'
      ? ''
      : network === 'localnet'
        ? '?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899'
        : `?cluster=${network}`;

  return `${EXPLORER_BASE}/tx/${signature}${clusterParam}`;
}

/**
 * Returns a Solana Explorer URL for an account address.
 */
export function getAccountExplorerUrl(
  address: string | PublicKey,
  network: string
): string {
  const addr =
    typeof address === 'string' ? address : address.toBase58();
  const clusterParam =
    network === 'mainnet-beta'
      ? ''
      : network === 'localnet'
        ? '?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899'
        : `?cluster=${network}`;

  return `${EXPLORER_BASE}/address/${addr}${clusterParam}`;
}

// ============================================================
// Misc
// ============================================================

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
