import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';

export function usePlaytestDeck(id: string, signedIn: boolean) {
  return useQuery({
    queryKey: [signedIn ? 'decks' : 'shared', 'playtest', id],
    queryFn: async () => {
      const params = { path: { id } };
      return unwrap(
        signedIn ? await api.GET('/deck/{id}/content', { params }) : await api.GET('/shared/decks/{id}', { params }),
      );
    },
  });
}
