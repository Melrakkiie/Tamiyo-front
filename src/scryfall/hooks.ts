import { useQuery } from '@tanstack/react-query';

import { ApiError } from '../api/errors';
import { type FaceTypes, faceTypes } from './classify';
import {
  autocompleteCardNames,
  type CardArt,
  cardArt,
  type CardSuggestion,
  fetchCardsByIds,
  fetchFrenchPrinting,
  imageUrl,
  isAdvancedQuery,
  searchCardSuggestions,
  type ScryfallCard,
  searchPrintings,
} from './client';

const ONE_DAY = 24 * 60 * 60 * 1000;

function useScryfallCardsByIds<T>(scryfallIds: string[], select: (cards: Record<string, ScryfallCard>) => T) {
  const ids = [...new Set(scryfallIds)].sort();

  return useQuery({
    queryKey: ['scryfall', 'cards', ids],
    queryFn: async () => {
      const cards: Record<string, ScryfallCard> = {};
      for (const card of await fetchCardsByIds(ids)) {
        cards[card.id] = card;
      }
      return cards;
    },
    select,
    enabled: ids.length > 0,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
  });
}

export function useCardImages(scryfallIds: string[], size: 'small' | 'normal' = 'normal') {
  return useScryfallCardsByIds(scryfallIds, (cards) => {
    const urls: Record<string, string | undefined> = {};
    for (const [id, card] of Object.entries(cards)) {
      urls[id] = imageUrl(card, size);
    }
    return urls;
  });
}

export function useCardFaceTypes(scryfallIds: string[]) {
  return useScryfallCardsByIds(scryfallIds, (cards) => {
    const types: Record<string, FaceTypes> = {};
    for (const [id, card] of Object.entries(cards)) {
      types[id] = faceTypes(card);
    }
    return types;
  });
}

export function useManaCosts(scryfallIds: string[]) {
  return useScryfallCardsByIds(scryfallIds, (cards) => {
    const costs: Record<string, string> = {};
    for (const [id, card] of Object.entries(cards)) {
      costs[id] = card.mana_cost ?? card.card_faces?.[0]?.mana_cost ?? '';
    }
    return costs;
  });
}

export function useScryfallCard(scryfallId: string | null | undefined) {
  return useQuery({
    queryKey: ['scryfall', 'card', scryfallId],
    queryFn: async () => (await fetchCardsByIds([scryfallId ?? '']))[0] ?? null,
    enabled: !!scryfallId,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
  });
}

export function useFrenchPrinting(card: ScryfallCard | null | undefined) {
  return useQuery({
    queryKey: ['scryfall', 'french', card?.id],
    queryFn: () => (card ? fetchFrenchPrinting(card) : null),
    enabled: !!card,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
    retry: false,
  });
}

export function useCardArts(scryfallIds: (string | null | undefined)[]) {
  const ids = [...new Set(scryfallIds.filter((id): id is string => !!id))].sort();

  return useQuery({
    queryKey: ['scryfall', 'arts', ids],
    queryFn: async () => {
      const cards = await fetchCardsByIds(ids);
      const arts: Record<string, CardArt | null> = {};
      for (const card of cards) {
        arts[card.id] = cardArt(card);
      }
      return arts;
    },
    enabled: ids.length > 0,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
  });
}

export function useCardNameSuggestions(query: string) {
  const trimmed = query.trim();

  const advanced = isAdvancedQuery(trimmed);

  return useQuery({
    queryKey: ['scryfall', advanced ? 'search' : 'autocomplete', trimmed.toLowerCase()],
    queryFn: async (): Promise<CardSuggestion[]> => {
      const byName = async () => (await autocompleteCardNames(trimmed)).map((name) => ({ name }));
      if (!advanced) {
        return byName();
      }
      try {
        return await searchCardSuggestions(trimmed);
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          const names = await byName();
          if (names.length > 0) {
            return names;
          }
        }
        throw err;
      }
    },
    enabled: trimmed.length >= 2,
    staleTime: ONE_DAY,
    retry: (failureCount, error) => !(error instanceof ApiError && error.status === 400) && failureCount < 2,
  });
}

export function usePrintings(name: string | null) {
  return useQuery({
    queryKey: ['scryfall', 'printings', name],
    queryFn: () => searchPrintings(name ?? ''),
    enabled: !!name,
    staleTime: ONE_DAY,
  });
}
