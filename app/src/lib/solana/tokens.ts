import { TOKEN_MINTS } from './constants';

// ============================================================
// Token descriptor type
// ============================================================
export interface TokenDescriptor {
  name: string;
  symbol: string;
  /** Mint address on devnet */
  mintDevnet: string;
  /** Mint address on mainnet-beta */
  mintMainnet: string;
  decimals: number;
  logoUrl: string;
}

// ============================================================
// Known tokens
// ============================================================
export const KNOWN_TOKENS: TokenDescriptor[] = [
  {
    name: 'USD Coin',
    symbol: 'USDC',
    mintDevnet: TOKEN_MINTS.devnet.USDC.toBase58(),
    mintMainnet: TOKEN_MINTS.mainnet.USDC.toBase58(),
    decimals: 6,
    logoUrl:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  {
    name: 'Tether USD',
    symbol: 'USDT',
    mintDevnet: TOKEN_MINTS.devnet.USDT.toBase58(),
    mintMainnet: TOKEN_MINTS.mainnet.USDT.toBase58(),
    decimals: 6,
    logoUrl:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
  },
];

// ============================================================
// SOL descriptor (pseudo-token for unified handling)
// ============================================================
export const SOL_TOKEN: TokenDescriptor = {
  name: 'Solana',
  symbol: 'SOL',
  mintDevnet: 'So11111111111111111111111111111111111111112',
  mintMainnet: 'So11111111111111111111111111111111111111112',
  decimals: 9,
  logoUrl:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
};

// ============================================================
// Lookup helpers
// ============================================================

/**
 * Find a token descriptor by its mint address string.
 * Returns undefined if not found (unknown / unsupported token).
 */
export function getTokenByMint(
  mint: string,
  network: 'devnet' | 'mainnet-beta' | 'localnet' | string
): TokenDescriptor | undefined {
  const isMainnet = network === 'mainnet-beta';

  if (
    mint === SOL_TOKEN.mintMainnet ||
    mint === 'So11111111111111111111111111111111111111112'
  ) {
    return SOL_TOKEN;
  }

  return KNOWN_TOKENS.find((t) =>
    isMainnet ? t.mintMainnet === mint : t.mintDevnet === mint
  );
}

/**
 * Format a raw token amount (base units / smallest denomination) as a
 * human-readable decimal string.
 *
 * @param amount   - raw amount as bigint
 * @param decimals - token decimal precision
 * @param maxFrac  - max decimal digits in output (default same as token decimals)
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  maxFrac?: number
): string {
  if (decimals === 0) return amount.toString();

  const factor = BigInt(10 ** decimals);
  const whole = amount / factor;
  const remainder = amount % factor;

  const fracDigits = maxFrac ?? decimals;
  const divisor = BigInt(10 ** (decimals - fracDigits));
  const fractional = remainder / divisor;
  const fractionalStr = fractional
    .toString()
    .padStart(fracDigits, '0')
    .replace(/0+$/, ''); // trim trailing zeros

  if (!fractionalStr) return whole.toString();
  return `${whole}.${fractionalStr}`;
}

/**
 * Parse a human-readable token amount string into raw base units as bigint.
 * Throws on invalid input.
 */
export function parseTokenAmount(value: string, decimals: number): bigint {
  const [wholePart, fracPart = ''] = value.split('.');
  const paddedFrac = fracPart.slice(0, decimals).padEnd(decimals, '0');
  const combined = `${wholePart}${paddedFrac}`;
  return BigInt(combined);
}
