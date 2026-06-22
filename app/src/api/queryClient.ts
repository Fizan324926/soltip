import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthError, RateLimitError, NetworkError } from '@/lib/api/client';
import { parseAnchorError } from '@/lib/errors';

// ============================================================
// Error Handling
// ============================================================

function handleQueryError(error: unknown): void {
  // Don't show toast for auth errors - let the component handle redirect
  if (error instanceof AuthError) {
    return;
  }

  // Rate limit - show specific message
  if (error instanceof RateLimitError) {
    toast.error('Too many requests. Please wait.', { id: 'rate-limit' });
    return;
  }

  // Network error - only show once
  if (error instanceof NetworkError) {
    toast.error('Network error. Check your connection.', { id: 'network-error' });
    return;
  }

  // Log other errors but don't toast (let individual components handle)
  console.error('[Query Error]', error);
}

function handleMutationError(error: unknown): void {
  // Parse and show the error
  const message = parseAnchorError(error);
  toast.error(message);
}

// ============================================================
// QueryClient singleton
// ============================================================

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
  }),
  defaultOptions: {
    queries: {
      // Longer stale time for most data (5 minutes)
      staleTime: 5 * 60 * 1000,

      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry failed queries up to 2 times
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error instanceof AuthError) return false;
        // Don't retry validation errors
        if (error instanceof Error && error.message.includes('Invalid')) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30_000),

      // Refetch on window focus
      refetchOnWindowFocus: true,

      // Don't refetch on reconnect if data is still fresh
      refetchOnReconnect: 'always',
    },

    mutations: {
      // Don't auto-retry mutations (on-chain state changes)
      retry: 0,
    },
  },
});

// ============================================================
// Query Key Invalidation Helpers
// ============================================================

export function invalidateProfile(address: string): void {
  void queryClient.invalidateQueries({ queryKey: ['profile', address] });
}

export function invalidateVault(profilePda: string): void {
  void queryClient.invalidateQueries({ queryKey: ['vault', profilePda] });
}

export function invalidateGoals(profilePda: string): void {
  void queryClient.invalidateQueries({ queryKey: ['goals', profilePda] });
}

export function invalidateAll(): void {
  void queryClient.invalidateQueries();
}

export default queryClient;
