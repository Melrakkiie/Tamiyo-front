import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';

export function useAccount() {
  return useQuery({
    queryKey: ['account'],
    queryFn: async () => unwrap(await api.GET('/auth/me')),
  });
}
