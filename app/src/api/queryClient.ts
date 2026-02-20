import { QueryClient } from '@tanstack/react-query';

// ============================================================
// QueryClient singleton
//
// Created once at module load time so the cache survives
// component unmounts and hot-reloads in development.
// ============================================================
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 30 seconds before a background refetch
      staleTime: 30 * 1000,

      // Keep unused data in the cache for 5 minutes
      gcTime: 5 * 60 * 1000,

      // Retry failed queries up to 2 times (with exponential back-off)
      retry: 2,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30_000),

      // Always refetch when the window regains focus (e.g. after the user
      // returns from wallet approval screens)
      refetchOnWindowFocus: true,

      // Do not refetch on component mount when data is still fresh
      refetchOnMount: true,
    },

    mutations: {
      // Do not retry failed mutations automatically – they involve on-chain
      // state changes and must be explicitly retried by the user
      retry: 0,
    },
  },
});

export default queryClient;
