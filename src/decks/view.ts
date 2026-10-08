import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { DeckView } from '../api/types';

const viewKey = (deckId: string) => ['decks', 'view', deckId];

export function useDeckView(deckId: string) {
  return useQuery({
    queryKey: viewKey(deckId),
    queryFn: async () => unwrap(await api.GET('/deck/{id}/view', { params: { path: { id: deckId } } })),
    staleTime: Infinity,
  });
}

export function useSaveDeckView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deckId, view }: { deckId: string; view: DeckView }) =>
      unwrap(await api.PUT('/deck/{id}/view', { params: { path: { id: deckId } }, body: view })),
    onMutate: ({ deckId, view }) => queryClient.setQueryData(viewKey(deckId), view),
  });
}
