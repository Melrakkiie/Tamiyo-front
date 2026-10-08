import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { AddPendingCardInput, Deck, DeckCardSort, PendingCard, UpdateDeckInput } from '../api/types';
import type { DeckVisibility } from './visibility';

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

export function useDeck(id: string) {
  return useQuery({
    queryKey: ['decks', 'detail', id],
    queryFn: async () => unwrap(await api.GET('/deck/{id}', { params: { path: { id } } })),
  });
}

export function useDeckCards(id: string, sort: DeckCardSort) {
  return useQuery({
    queryKey: ['decks', 'cards', id, sort],
    queryFn: async () =>
      unwrap(await api.GET('/deck/{id}/cards', { params: { path: { id }, query: { sort } } })),
  });
}

export function useDeckStats(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['decks', 'stats', id],
    queryFn: async () => unwrap(await api.GET('/deck/{id}/stats', { params: { path: { id } } })),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useDeckLegality(id: string, enabled: boolean) {
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
  visibility: DeckVisibility;
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
    mutationFn: async ({ id, changes }: { id: string; changes: UpdateDeckInput }) =>
      unwrap(await api.PATCH('/deck/{id}', { params: { path: { id } }, body: changes })),
    onSettled: invalidate,
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
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
    mutationFn: async ({ deckId, cardId }: { deckId: string; cardId: number }) => {
      unwrap(await api.PUT('/deck/{id}/cards/{card_id}', { params: { path: { id: deckId, card_id: cardId } } }));
    },
    onSettled: invalidate,
  });
}

export function useRemoveCardFromDeck() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, cardId, isCommander }: { deckId: string; cardId: number; isCommander: boolean }) => {
      if (isCommander) {
        unwrap(await api.PATCH('/deck/{id}', { params: { path: { id: deckId } }, body: { clear_commander_id: true } }));
      }
      unwrap(await api.DELETE('/deck/{id}/cards/{card_id}', { params: { path: { id: deckId, card_id: cardId } } }));
    },
    onSettled: invalidate,
  });
}

export function useRemoveCopiesFromDeck() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, cardIds }: { deckId: string; cardIds: number[] }) => {
      for (const cardId of cardIds) {
        unwrap(await api.DELETE('/deck/{id}/cards/{card_id}', { params: { path: { id: deckId, card_id: cardId } } }));
      }
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
      deckId: string;
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

export function usePendingCards(deckId: string) {
  return useQuery({
    queryKey: ['decks', 'pending', deckId],
    queryFn: async () => unwrap(await api.GET('/deck/{id}/pending', { params: { path: { id: deckId } } })),
  });
}

export function useAddPendingCard() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, card }: { deckId: string; card: AddPendingCardInput }) =>
      unwrap(await api.POST('/deck/{id}/pending', { params: { path: { id: deckId } }, body: card })),
    onSettled: invalidate,
  });
}

export function useRemovePendingCard() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, pendingId }: { deckId: string; pendingId: number }) => {
      unwrap(
        await api.DELETE('/deck/{id}/pending/{pending_id}', {
          params: { path: { id: deckId, pending_id: pendingId } },
        }),
      );
    },
    onSettled: invalidate,
  });
}

export function useSetPendingQuantity() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, pendingId, quantity }: { deckId: string; pendingId: number; quantity: number }) =>
      unwrap(
        await api.PATCH('/deck/{id}/pending/{pending_id}', {
          params: { path: { id: deckId, pending_id: pendingId } },
          body: { quantity },
        }),
      ),
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
      quantity,
    }: {
      deckId: string;
      storageId: number | null;
      pendingId?: number;
      quantity?: number;
    }) =>
      unwrap(
        await api.POST('/deck/{id}/pending/commit', {
          params: { path: { id: deckId } },
          body: { storage_id: storageId, pending_id: pendingId, quantity },
        }),
      ),
    onSettled: invalidate,
  });
}

function pendingInput(item: PendingCard, quantity: number): AddPendingCardInput {
  return {
    name: item.name,
    scryfall_id: item.scryfall_id,
    set_code: item.set_code,
    collector_number: item.collector_number,
    foil: item.foil,
    quantity,
    mana_value: item.mana_value,
    colors: item.colors,
    card_type: item.card_type,
    color_identity: item.color_identity,
  };
}

export function useReplaceDeckCardWithPending() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({
      deckId,
      fromCardId,
      isCommander,
      card,
    }: {
      deckId: string;
      fromCardId: number;
      isCommander: boolean;
      card: AddPendingCardInput;
    }) => {
      const added = unwrap(await api.POST('/deck/{id}/pending', { params: { path: { id: deckId } }, body: card }));
      if (isCommander) {
        unwrap(
          await api.PATCH('/deck/{id}', {
            params: { path: { id: deckId } },
            body: { commander_pending_id: added.id },
          }),
        );
      }
      unwrap(await api.DELETE('/deck/{id}/cards/{card_id}', { params: { path: { id: deckId, card_id: fromCardId } } }));
    },
    onSettled: invalidate,
  });
}

export function useReplacePendingCard() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({
      deckId,
      from,
      isCommander,
      card,
    }: {
      deckId: string;
      from: PendingCard;
      isCommander: boolean;
      card: AddPendingCardInput;
    }) => {
      const added = unwrap(
        await api.POST('/deck/{id}/pending', {
          params: { path: { id: deckId } },
          body: { ...card, quantity: from.quantity },
        }),
      );
      if (isCommander) {
        unwrap(
          await api.PATCH('/deck/{id}', {
            params: { path: { id: deckId } },
            body: { commander_pending_id: added.id },
          }),
        );
      }
      unwrap(
        await api.DELETE('/deck/{id}/pending/{pending_id}', {
          params: { path: { id: deckId, pending_id: from.id } },
        }),
      );
    },
    onSettled: invalidate,
  });
}

export function useReplacePendingWithOwned() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({
      deckId,
      from,
      toCardId,
      isCommander,
    }: {
      deckId: string;
      from: PendingCard;
      toCardId: number;
      isCommander: boolean;
    }) => {
      unwrap(await api.PUT('/deck/{id}/cards/{card_id}', { params: { path: { id: deckId, card_id: toCardId } } }));
      if (isCommander) {
        unwrap(await api.PATCH('/deck/{id}', { params: { path: { id: deckId } }, body: { commander_id: toCardId } }));
      }
      unwrap(
        await api.DELETE('/deck/{id}/pending/{pending_id}', {
          params: { path: { id: deckId, pending_id: from.id } },
        }),
      );
      if (from.quantity > 1) {
        unwrap(
          await api.POST('/deck/{id}/pending', {
            params: { path: { id: deckId } },
            body: pendingInput(from, from.quantity - 1),
          }),
        );
      }
    },
    onSettled: invalidate,
  });
}
