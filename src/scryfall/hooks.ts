import { useQuery } from '@tanstack/react-query';

import { ApiError } from '../api/errors';
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

export function useCardImages(scryfallIds: string[], size: 'small' | 'normal' = 'normal') {
  const ids = [...new Set(scryfallIds)].sort();

  return useQuery({
    queryKey: ['scryfall', 'images', size, ids],
    queryFn: async () => {
      const cards = await fetchCardsByIds(ids);
      const urls: Record<string, string | undefined> = {};
      for (const card of cards) {
        urls[card.id] = imageUrl(card, size);
      }
      return urls;
    },
    enabled: ids.length > 0,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
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
