import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { AddPendingCardInput, Deck, DeckCardSort, UpdateDeckInput } from '../api/types';

export const COMMON_FORMATS = [
  'commander',
  'standard',
  'pioneer',
  'modern',
  'legacy',
  'vintage',
  'pauper',
  'brawl',
  'oathbreaker',
  'premodern',
];

async function fetchAllDecks(): Promise<Deck[]> {
  const decks: Deck[] = [];
  for (let page = 1; ; page++) {
    const result = unwrap(await api.GET('/deck', { params: { query: { page, limit: 100, sort: 'name' } } }));
    decks.push(...result.data);
    if (page >= result.total_pages) {
      return decks;
    }
  }
}

export function useAllDecks() {
  return useQuery({ queryKey: ['decks', 'all'], queryFn: fetchAllDecks, staleTime: 60_000 });
}

export function useDeckFormats() {
  const { data } = useAllDecks();
  return [...new Set([...COMMON_FORMATS, ...(data ?? []).map((deck) => deck.format.toLowerCase())])].sort();
}

export function useDeck(id: number) {
  return useQuery({
    queryKey: ['decks', 'detail', id],
    queryFn: async () => unwrap(await api.GET('/deck/{id}', { params: { path: { id } } })),
  });
}

export function useDeckCards(id: number, sort: DeckCardSort) {
  return useQuery({
    queryKey: ['decks', 'cards', id, sort],
    queryFn: async () =>
      unwrap(await api.GET('/deck/{id}/cards', { params: { path: { id }, query: { sort } } })),
  });
}

export function useDeckStats(id: number, enabled: boolean) {
  return useQuery({
    queryKey: ['decks', 'stats', id],
    queryFn: async () => unwrap(await api.GET('/deck/{id}/stats', { params: { path: { id } } })),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useDeckLegality(id: number, enabled: boolean) {
  return useQuery({
    queryKey: ['decks', 'legality', id],
    queryFn: async () => unwrap(await api.GET('/deck/{id}/legality', { params: { path: { id } } })),
    enabled,
    staleTime: 5 * 60_000,
  });
}

function useInvalidateDecks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['decks'] });
}

export interface DeckInput {
  name: string;
  format: string;
}

export function useCreateDeck() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async (input: DeckInput) => unwrap(await api.POST('/deck', { body: input })),
    onSettled: invalidate,
  });
}

export function useUpdateDeck() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ id, changes }: { id: number; changes: UpdateDeckInput }) =>
      unwrap(await api.PATCH('/deck/{id}', { params: { path: { id } }, body: changes })),
    onSettled: invalidate,
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      unwrap(await api.DELETE('/deck/{id}', { params: { path: { id } } }));
    },
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({
        queryKey: ['decks'],
        predicate: (query) => query.queryKey[2] !== id,
      });
    },
  });
}

export function useAddCardToDeck() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, cardId }: { deckId: number; cardId: number }) => {
      unwrap(await api.PUT('/deck/{id}/cards/{card_id}', { params: { path: { id: deckId, card_id: cardId } } }));
    },
    onSettled: invalidate,
  });
}

export function useRemoveCardFromDeck() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, cardId, isCommander }: { deckId: number; cardId: number; isCommander: boolean }) => {
      if (isCommander) {
        unwrap(await api.PATCH('/deck/{id}', { params: { path: { id: deckId } }, body: { clear_commander_id: true } }));
      }
      unwrap(await api.DELETE('/deck/{id}/cards/{card_id}', { params: { path: { id: deckId, card_id: cardId } } }));
    },
    onSettled: invalidate,
  });
}

export function useSwapDeckCard() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({
      deckId,
      fromCardId,
      toCardId,
      isCommander,
    }: {
      deckId: number;
      fromCardId: number;
      toCardId: number;
      isCommander: boolean;
    }) => {
      unwrap(await api.PUT('/deck/{id}/cards/{card_id}', { params: { path: { id: deckId, card_id: toCardId } } }));
      if (isCommander) {
        unwrap(await api.PATCH('/deck/{id}', { params: { path: { id: deckId } }, body: { commander_id: toCardId } }));
      }
      unwrap(
        await api.DELETE('/deck/{id}/cards/{card_id}', { params: { path: { id: deckId, card_id: fromCardId } } }),
      );
    },
    onSettled: invalidate,
  });
}

export function isCommanderFormat(format: string) {
  return format.toLowerCase() === 'commander';
}

function useInvalidateDeckAndCollection() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['decks'] }),
      queryClient.invalidateQueries({ queryKey: ['cards'] }),
      queryClient.invalidateQueries({ queryKey: ['storages'] }),
    ]);
}

export function usePendingCards(deckId: number) {
  return useQuery({
    queryKey: ['decks', 'pending', deckId],
    queryFn: async () => unwrap(await api.GET('/deck/{id}/pending', { params: { path: { id: deckId } } })),
  });
}

export function useAddPendingCard() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, card }: { deckId: number; card: AddPendingCardInput }) =>
      unwrap(await api.POST('/deck/{id}/pending', { params: { path: { id: deckId } }, body: card })),
    onSettled: invalidate,
  });
}

export function useRemovePendingCard() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, pendingId }: { deckId: number; pendingId: number }) => {
      unwrap(
        await api.DELETE('/deck/{id}/pending/{pending_id}', {
          params: { path: { id: deckId, pending_id: pendingId } },
        }),
      );
    },
    onSettled: invalidate,
  });
}

export function useCommitPendingCards() {
  const invalidate = useInvalidateDeckAndCollection();

  return useMutation({
    mutationFn: async ({
      deckId,
      storageId,
      pendingId,
    }: {
      deckId: number;
      storageId: number | null;
      pendingId?: number;
    }) =>
      unwrap(
        await api.POST('/deck/{id}/pending/commit', {
          params: { path: { id: deckId } },
          body: { storage_id: storageId, pending_id: pendingId },
        }),
      ),
    onSettled: invalidate,
  });
}
