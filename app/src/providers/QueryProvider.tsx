import React, { type FC, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../api/queryClient';

// ============================================================
// Props
// ============================================================
interface QueryProviderProps {
  children: ReactNode;
}

// ============================================================
// QueryProvider
//
// Wraps the application with TanStack Query v5.
// Uses the shared queryClient singleton so that cache is not
// recreated on hot-reloads during development.
// ============================================================
export const QueryProvider: FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only renders in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;
