import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import { errorMessage } from '../api/errors';
import type { LikedDeck } from '../api/types';

const likeKey = (deckId: string) => ['likes', 'deck', deckId];

export function useDeckLikes(deckId: string, enabled = true) {
  return useQuery({
    queryKey: likeKey(deckId),
    queryFn: async () => unwrap(await api.GET('/deck/{id}/like', { params: { path: { id: deckId } } })),
    enabled,
  });
}

export function useLikeDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deckId, like }: { deckId: string; like: boolean }) => {
      const params = { params: { path: { id: deckId } } };
      return unwrap(like ? await api.PUT('/deck/{id}/like', params) : await api.DELETE('/deck/{id}/like', params));
    },
    onSuccess: (status, { deckId }) => queryClient.setQueryData(likeKey(deckId), status),
    onError: (err) => notifications.show({ color: 'red', message: errorMessage(err) }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['likes', 'mine'] }),
        queryClient.invalidateQueries({ queryKey: ['shared'] }),
      ]),
  });
}

async function fetchLikedDecks(): Promise<LikedDeck[]> {
  const decks: LikedDeck[] = [];
  for (let page = 1; ; page++) {
    const result = unwrap(await api.GET('/auth/me/liked-decks', { params: { query: { page, limit: 100 } } }));
    decks.push(...result.data);
    if (page >= result.total_pages) {
      return decks;
    }
  }
}

export function useLikedDecks() {
  return useQuery({ queryKey: ['likes', 'mine'], queryFn: fetchLikedDecks });
}
