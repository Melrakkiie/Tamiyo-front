import { useQuery } from '@tanstack/react-query';

import { autocompleteCardNames, type CardArt, cardArt, fetchCardsByIds, imageUrl, searchPrintings } from './client';

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

  return useQuery({
    queryKey: ['scryfall', 'autocomplete', trimmed.toLowerCase()],
    queryFn: () => autocompleteCardNames(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: ONE_DAY,
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
