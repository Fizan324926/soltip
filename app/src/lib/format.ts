/**
 * Formatting Utilities
 *
 * Centralized formatting functions for consistent display.
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// ============================================================
// Number Formatting
// ============================================================

/**
 * Format a number with locale-aware separators.
 */
export function formatNumber(value: number | bigint, decimals = 0): string {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a large number with abbreviations (1K, 1M, etc.)
 */
export function formatCompact(value: number | bigint): string {
  const num = Number(value);
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString('en-US');
}

/**
 * Format a percentage (0-100).
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format basis points as percentage (10000 = 100%).
 */
export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

// ============================================================
// Currency Formatting
// ============================================================

/**
 * Convert lamports to SOL (9 decimals).
 */
export function lamportsToSol(lamports: bigint | number): string {
  const value = Number(lamports) / 1e9;
  // Show more decimals for small amounts
  if (value < 0.001) return value.toPrecision(3);
  if (value < 1) return value.toFixed(4);
  if (value < 100) return value.toFixed(3);
  return value.toFixed(2);
}

/**
 * Convert SOL to lamports.
 */
export function solToLamports(sol: number): bigint {
  return BigInt(Math.round(sol * 1e9));
}

/**
 * Format USD amount.
 */
export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format SOL with symbol.
 */
export function formatSol(lamports: bigint | number): string {
  return `${lamportsToSol(lamports)} SOL`;
}

// ============================================================
// Address Formatting
// ============================================================

/**
 * Shorten a Solana address for display.
 */
export function shortAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format a public key (handles PublicKey objects too).
 */
export function formatPublicKey(key: string | { toBase58(): string }): string {
  const address = typeof key === 'string' ? key : key.toBase58();
  return shortAddress(address);
}

// ============================================================
// Date/Time Formatting
// ============================================================

/**
 * Format a timestamp as relative time (e.g., "5 minutes ago").
 */
export function formatRelativeTime(timestamp: number | Date): string {
  return dayjs(timestamp).fromNow();
}

/**
 * Format a timestamp as a date string.
 */
export function formatDate(timestamp: number | Date, format = 'MMM D, YYYY'): string {
  return dayjs(timestamp).format(format);
}

/**
 * Format a timestamp as date and time.
 */
export function formatDateTime(timestamp: number | Date): string {
  return dayjs(timestamp).format('MMM D, YYYY h:mm A');
}

/**
 * Format duration in a human-readable way.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/**
 * Get remaining time until a deadline.
 */
export function getTimeRemaining(deadline: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadline - now;

  if (remaining <= 0) return 'Ended';
  return formatDuration(remaining);
}

// ============================================================
// Text Formatting
// ============================================================

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

/**
 * Pluralize a word based on count.
 */
export function pluralize(count: number | bigint, singular: string, plural?: string): string {
  const p = plural ?? `${singular}s`;
  return Number(count) === 1 ? singular : p;
}

/**
 * Format a count with label (e.g., "5 tips").
 */
export function formatCount(count: number | bigint, singular: string, plural?: string): string {
  return `${formatNumber(count)} ${pluralize(count, singular, plural)}`;
}
