import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
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
