import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status === 401) &&
        failureCount < 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});
