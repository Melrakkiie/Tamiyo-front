import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';

export const MAX_DISPLAY_NAME_LENGTH = 32;

export function useAccount() {
  return useQuery({
    queryKey: ['account'],
    queryFn: async () => unwrap(await api.GET('/auth/me')),
  });
}

export function useUpdateDisplayName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (displayName: string | null) =>
      unwrap(await api.PATCH('/auth/me', { body: { display_name: displayName } })),
    onSuccess: (account) => queryClient.setQueryData(['account'], account),
  });
}
