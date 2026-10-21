import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { AddPendingCardInput, Deck, DeckBoard, DeckCardSort, UpdateDeckInput } from '../api/types';
import { clearSlotChanges, type CommanderSlot } from './commanders';
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

export function useAllDecks(enabled = true) {
  return useQuery({ queryKey: ['decks', 'all'], queryFn: fetchAllDecks, staleTime: 60_000, enabled });
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

export function useDeckComparison(id: string, otherId: string, signedIn: boolean) {
  return useQuery({
    queryKey: [signedIn ? 'decks' : 'shared', 'compare', id, otherId],
    queryFn: async () => {
      const params = { path: { id, other_id: otherId } };
      return unwrap(
        signedIn
          ? await api.GET('/deck/{id}/compare/{other_id}', { params })
          : await api.GET('/shared/decks/{id}/compare/{other_id}', { params }),
      );
    },
  });
}

export function useDeckCards(id: string, sort: DeckCardSort) {
  return useQuery({
    queryKey: ['decks', 'cards', id, sort],
    queryFn: async () => unwrap(await api.GET('/deck/{id}/cards', { params: { path: { id }, query: { sort } } })),
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

export function useDeckCombos(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['decks', 'combos', id],
    queryFn: async () => unwrap(await api.GET('/deck/{id}/combos', { params: { path: { id } } })),
    enabled,
    staleTime: Infinity,
    retry: false,
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

export function useInvalidateDecks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['decks'] });
}

export interface DeckInput {
  name: string;
  format: string;
  visibility: DeckVisibility;
  bracket?: number;
  folder_id?: number;
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
    mutationFn: async ({ deckId, cardId, board }: { deckId: string; cardId: number; board: DeckBoard }) => {
      unwrap(
        await api.PUT('/deck/{id}/cards/{card_id}', {
          params: { path: { id: deckId, card_id: cardId } },
          body: { board },
        }),
      );
    },
    onSettled: invalidate,
  });
}

export function useMoveDeckCards() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, cardIds, board }: { deckId: string; cardIds: number[]; board: DeckBoard }) => {
      for (const cardId of cardIds) {
        unwrap(
          await api.PUT('/deck/{id}/cards/{card_id}', {
            params: { path: { id: deckId, card_id: cardId } },
            body: { board },
          }),
        );
      }
    },
    onSettled: invalidate,
  });
}

export function useRemoveCardFromDeck() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({
      deckId,
      cardId,
      commanderSlot,
    }: {
      deckId: string;
      cardId: number;
      commanderSlot: CommanderSlot | null;
    }) => {
      if (commanderSlot) {
        unwrap(
          await api.PATCH('/deck/{id}', { params: { path: { id: deckId } }, body: clearSlotChanges(commanderSlot) }),
        );
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

export function useMovePendingCard() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({ deckId, pendingId, board }: { deckId: string; pendingId: number; board: DeckBoard }) =>
      unwrap(
        await api.PATCH('/deck/{id}/pending/{pending_id}', {
          params: { path: { id: deckId, pending_id: pendingId } },
          body: { board },
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

export type CollectMode = 'all' | 'missing' | 'pending';

export function useSwitchFoil() {
  const invalidate = useInvalidateDeckAndCollection();

  return useMutation({
    mutationFn: async ({
      deckId,
      cardIds,
      pendingIds,
      foil,
    }: {
      deckId: string;
      cardIds?: number[];
      pendingIds?: number[];
      foil: boolean;
    }) =>
      unwrap(
        await api.POST('/deck/{id}/switch-foil', {
          params: { path: { id: deckId } },
          body: { card_ids: cardIds, pending_ids: pendingIds, foil },
        }),
      ),
    onSettled: invalidate,
  });
}

export function useSwitchProxy() {
  const invalidate = useInvalidateDeckAndCollection();

  return useMutation({
    mutationFn: async ({
      deckId,
      cardIds,
      pendingIds,
      proxy,
    }: {
      deckId: string;
      cardIds?: number[];
      pendingIds?: number[];
      proxy: boolean;
    }) =>
      unwrap(
        await api.POST('/deck/{id}/switch-proxy', {
          params: { path: { id: deckId } },
          body: { card_ids: cardIds, pending_ids: pendingIds, proxy },
        }),
      ),
    onSettled: invalidate,
  });
}

export interface PrintingChoice {
  scryfall_id: string;
  set_code: string;
  collector_number: string;
  foil: boolean;
}

export function useSplitPrintings() {
  const invalidate = useInvalidateDeckAndCollection();

  return useMutation({
    mutationFn: async ({
      deckId,
      cardIds,
      pendingIds,
      printings,
    }: {
      deckId: string;
      cardIds?: number[];
      pendingIds?: number[];
      printings: PrintingChoice[];
    }) =>
      unwrap(
        await api.POST('/deck/{id}/split-printings', {
          params: { path: { id: deckId } },
          body: { card_ids: cardIds, pending_ids: pendingIds, printings },
        }),
      ),
    onSettled: invalidate,
  });
}

export function useCollectDeck() {
  const invalidate = useInvalidateDeckAndCollection();

  return useMutation({
    mutationFn: async ({
      deckId,
      mode,
      boards,
      storageId,
    }: {
      deckId: string;
      mode: CollectMode;
      boards: DeckBoard[];
      storageId: number | null;
    }) =>
      unwrap(
        await api.POST('/deck/{id}/collect', {
          params: { path: { id: deckId } },
          body: { mode, boards, storage_id: storageId },
        }),
      ),
    onSettled: invalidate,
  });
}

export function useStoreDeck() {
  const invalidate = useInvalidateDeckAndCollection();

  return useMutation({
    mutationFn: async ({ deckId, boards, storageId }: { deckId: string; boards: DeckBoard[]; storageId: number }) =>
      unwrap(
        await api.POST('/deck/{id}/store', {
          params: { path: { id: deckId } },
          body: { storage_id: storageId, boards },
        }),
      ),
    onSettled: invalidate,
  });
}

export function useDuplicateDeck() {
  const invalidate = useInvalidateDecks();

  return useMutation({
    mutationFn: async ({
      deckId,
      name,
      folderId,
      visibility,
    }: {
      deckId: string;
      name: string;
      folderId: number | null;
      visibility: DeckVisibility;
    }) =>
      unwrap(
        await api.POST('/deck/{id}/duplicate', {
          params: { path: { id: deckId } },
          body: { name, folder_id: folderId ?? undefined, visibility },
        }),
      ),
    onSettled: invalidate,
  });
}
