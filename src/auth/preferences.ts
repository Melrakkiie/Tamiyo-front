import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import { errorMessage } from '../api/errors';
import type { Preferences } from '../api/types';

const preferencesKey = ['account', 'preferences'];

export function usePreferences(enabled = true) {
  return useQuery({
    queryKey: preferencesKey,
    queryFn: async () => unwrap(await api.GET('/auth/me/preferences')),
    enabled,
    staleTime: Infinity,
  });
}

export function useShowCollectionInDecks(enabled = true) {
  return usePreferences(enabled).data?.show_collection_in_decks ?? true;
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Preferences) =>
      unwrap(await api.PATCH('/auth/me/preferences', { body: preferences })),
    onMutate: async (preferences) => {
      await queryClient.cancelQueries({ queryKey: preferencesKey });
      const previous = queryClient.getQueryData<Preferences>(preferencesKey);
      queryClient.setQueryData(preferencesKey, preferences);
      return { previous };
    },
    onError: (err, _preferences, context) => {
      if (context?.previous) {
        queryClient.setQueryData(preferencesKey, context.previous);
      } else {
        queryClient.removeQueries({ queryKey: preferencesKey, exact: true });
      }
      notifications.show({
        color: 'red',
        message: errorMessage(err, { 404: "Ce réglage n'est pas encore disponible sur le serveur." }),
      });
    },
    onSuccess: (preferences) => queryClient.setQueryData(preferencesKey, preferences),
  });
}
