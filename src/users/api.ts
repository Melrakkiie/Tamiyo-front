import { notifications } from '@mantine/notifications';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import { errorMessage } from '../api/errors';
import type { Deck } from '../api/types';

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id, 'profile'],
    queryFn: async () => unwrap(await api.GET('/users/{id}', { params: { path: { id: id ?? '' } } })),
    enabled: !!id,
  });
}

async function fetchPublicDecks(id: string): Promise<Deck[]> {
  const decks: Deck[] = [];
  for (let page = 1; ; page++) {
    const result = unwrap(
      await api.GET('/users/{id}/decks', { params: { path: { id }, query: { page, limit: 100, sort: '-updated' } } }),
    );
    decks.push(...result.data);
    if (page >= result.total_pages) {
      return decks;
    }
  }
}

export function usePublicDecks(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id, 'decks'],
    queryFn: () => fetchPublicDecks(id ?? ''),
    enabled: !!id,
  });
}

export type ConnectionKind = 'followers' | 'following';

export const CONNECTIONS_PAGE_SIZE = 24;

export const connectionTabKeys: Record<ConnectionKind, string> = { followers: 'abonnes', following: 'suivis' };

export function connectionsUrl(userId: string, kind: ConnectionKind) {
  return `/users/${userId}/connexions?onglet=${connectionTabKeys[kind]}`;
}

export function useFollowStatus(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id, 'follow'],
    queryFn: async () => unwrap(await api.GET('/users/{id}/follow', { params: { path: { id: id ?? '' } } })),
    enabled: !!id,
  });
}

export function useConnections(id: string | undefined, kind: ConnectionKind, page: number) {
  return useQuery({
    queryKey: ['users', id, 'connections', kind, page],
    queryFn: async () => {
      const params = { path: { id: id ?? '' }, query: { page, limit: CONNECTIONS_PAGE_SIZE } };
      return unwrap(
        kind === 'followers'
          ? await api.GET('/users/{id}/followers', { params })
          : await api.GET('/users/{id}/following', { params }),
      );
    },
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, follow }: { id: string; follow: boolean; name: string }) => {
      const params = { params: { path: { id } } };
      return unwrap(
        follow ? await api.PUT('/users/{id}/follow', params) : await api.DELETE('/users/{id}/follow', params),
      );
    },
    onSuccess: (status, { id, follow, name }) => {
      queryClient.setQueryData(['users', id, 'follow'], status);
      notifications.show({ color: 'green', message: follow ? `Tu suis ${name}.` : `Tu ne suis plus ${name}.` });
    },
    onError: (err) => notifications.show({ color: 'red', message: errorMessage(err) }),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'users' && (query.queryKey[2] === 'connections' || query.queryKey[2] === 'follow'),
      }),
  });
}
