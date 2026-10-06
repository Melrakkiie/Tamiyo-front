import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api/errors';
import { getSession, subscribe } from './auth/session';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        failureCount < 1 && !(error instanceof ApiError && error.status < 500),
    },
  },
});

subscribe(() => {
  if (getSession().status === 'anonymous') {
    queryClient.clear();
  }
});
