import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { components } from '../api/schema';

export const MAX_DISPLAY_NAME_LENGTH = 32;

type ProfileChanges = components['schemas']['UpdateMeRequest'];

export function useAccount() {
  return useQuery({
    queryKey: ['account'],
    queryFn: async () => unwrap(await api.GET('/auth/me')),
  });
}

function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changes: ProfileChanges) => unwrap(await api.PATCH('/auth/me', { body: changes })),
    onSuccess: (account) => queryClient.setQueryData(['account'], account),
  });
}

export function useUpdateDisplayName() {
  const update = useUpdateProfile();
  return {
    ...update,
    mutate: (displayName: string | null, options?: Parameters<typeof update.mutate>[1]) =>
      update.mutate({ display_name: displayName }, options),
  };
}

export function useUpdateAvatar() {
  const update = useUpdateProfile();
  return {
    ...update,
    mutate: (avatarScryfallId: string | null, options?: Parameters<typeof update.mutate>[1]) =>
      update.mutate({ avatar_scryfall_id: avatarScryfallId }, options),
  };
}
