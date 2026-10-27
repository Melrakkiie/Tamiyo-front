import { useQuery } from '@tanstack/react-query';

import { ApiError } from '../api/errors';
import { loadCards, rememberCards } from './cardCache';
import { type FaceTypes, faceTypes, subtypes } from './classify';
import { frontManaCost, type PrintingFace, type PrintingFaces, printingFaces } from './faces';
import {
  autocompleteCardNames,
  cdnImageUrl,
  meldResultId,
  type CardSuggestions,
  fetchCardByName,
  fetchFrenchPrinting,
  fetchSetIcons,
  imageUrl,
  isAdvancedQuery,
  searchCardSuggestions,
  type ScryfallCard,
  searchCards,
  searchPrintings,
} from './client';

const ONE_DAY = 24 * 60 * 60 * 1000;

function useScryfallCardsByIds<T>(scryfallIds: string[], select: (cards: Record<string, ScryfallCard>) => T) {
  const ids = [...new Set(scryfallIds)].sort();

  return useQuery({
    queryKey: ['scryfall', 'cards', ids],
    queryFn: () => loadCards(ids),
    select,
    enabled: ids.length > 0,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
  });
}

export function useScryfallCards(scryfallIds: string[]) {
  return useScryfallCardsByIds(scryfallIds, (byId) => byId);
}

export function useCardImages(scryfallIds: string[], size: 'small' | 'normal' = 'normal') {
  const cards = useScryfallCardsByIds(scryfallIds, (byId) => byId);
  const settled = !cards.isLoading;
  const urls: Record<string, string | undefined> = {};
  for (const id of scryfallIds) {
    const card = cards.data?.[id];
    const url = card ? imageUrl(card, size) : undefined;
    urls[id] = url ?? (settled ? cdnImageUrl(id, size) : undefined);
  }
  return {
    data: urls,
    isLoading: cards.isLoading,
    isFetching: cards.isFetching,
  };
}

// Each printing's faces, its melded card loaded through the same cache. While a card loads it has
// no faces; once settled, a front without an image (or a card Scryfall lacks) falls back to the CDN.
export function usePrintingFaces(scryfallIds: string[]) {
  const cards = useScryfallCardsByIds(scryfallIds, (byId) => byId);
  const meldIds = Object.values(cards.data ?? {})
    .map(meldResultId)
    .filter((id) => id !== undefined);
  const melded = useScryfallCardsByIds(meldIds, (byId) => byId);
  const settled = !cards.isLoading;

  const faces: Record<string, PrintingFaces | undefined> = {};
  for (const id of scryfallIds) {
    const card = cards.data?.[id];
    if (!card && !settled) {
      continue;
    }
    const resolved: PrintingFaces = card
      ? printingFaces(card, melded.data?.[meldResultId(card) ?? ''])
      : { front: { ...emptyFront, deckArt: { scryfallId: id, face: 'front' } } };
    const images = resolved.front.images;
    faces[id] = {
      ...resolved,
      front: {
        ...resolved.front,
        images: { small: images.small ?? cdnImageUrl(id, 'small'), normal: images.normal ?? cdnImageUrl(id, 'normal') },
      },
    };
  }
  return { data: faces, isLoading: cards.isLoading, isFetching: cards.isFetching || melded.isFetching };
}

// shortcut: a card Scryfall lacks gets a nameless front, enough to show its CDN image.
const emptyFront: Omit<PrintingFace, 'deckArt'> = {
  face: 'front',
  name: '',
  images: { small: undefined, normal: undefined },
  art: null,
  manaCost: '',
};

export function useCardFaceTypes(scryfallIds: string[]) {
  return useScryfallCardsByIds(scryfallIds, (cards) => {
    const types: Record<string, FaceTypes> = {};
    for (const [id, card] of Object.entries(cards)) {
      types[id] = faceTypes(card);
    }
    return types;
  });
}

export function useCardSubtypes(scryfallIds: string[]) {
  return useScryfallCardsByIds(scryfallIds, (cards) => {
    const byId: Record<string, string[]> = {};
    for (const [id, card] of Object.entries(cards)) {
      byId[id] = subtypes(card);
    }
    return byId;
  });
}

export function useManaCosts(scryfallIds: string[]) {
  return useScryfallCardsByIds(scryfallIds, (cards) => {
    const costs: Record<string, string> = {};
    for (const [id, card] of Object.entries(cards)) {
      costs[id] = frontManaCost(card);
    }
    return costs;
  });
}

export interface RelatedToken {
  id: string;
  name: string;
}

export function useRelatedTokens(scryfallIds: string[]) {
  const parts = useScryfallCardsByIds(scryfallIds, (cards) => {
    const ids = new Set<string>();
    for (const card of Object.values(cards)) {
      for (const part of card.all_parts ?? []) {
        if (part.component === 'token' && part.id !== card.id) {
          ids.add(part.id);
        }
      }
    }
    return [...ids];
  });
  const tokens = useScryfallCardsByIds(parts.data ?? [], (cards) => {
    const byOracle = new Map<string, RelatedToken>();
    for (const card of Object.values(cards)) {
      const key = card.oracle_id ?? card.id;
      if (!byOracle.has(key)) {
        byOracle.set(key, { id: card.id, name: card.name });
      }
    }
    return [...byOracle.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  });
  return { data: tokens.data, isLoading: parts.isLoading || tokens.isLoading };
}

export function useTokenSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['scryfall', 'tokens', trimmed.toLowerCase()],
    queryFn: async (): Promise<RelatedToken[]> => {
      try {
        const cards = await searchCards(`t:token ${trimmed}`);
        rememberCards(cards);
        return cards.map((card) => ({ id: card.id, name: card.name }));
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          return [];
        }
        throw err;
      }
    },
    enabled: trimmed.length >= 2,
    staleTime: ONE_DAY,
  });
}

export function useScryfallCard(scryfallId: string | null | undefined) {
  return useQuery({
    queryKey: ['scryfall', 'card', scryfallId],
    queryFn: async () => (scryfallId ? ((await loadCards([scryfallId]))[scryfallId] ?? null) : null),
    enabled: !!scryfallId,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
  });
}

export function useCardImageByName(name: string) {
  return useQuery({
    queryKey: ['scryfall', 'named', name],
    queryFn: async () => {
      const card = await fetchCardByName(name);
      if (!card) {
        return null;
      }
      rememberCards([card]);
      return imageUrl(card, 'normal') ?? null;
    },
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

export function useCardNameSuggestions(query: string) {
  const trimmed = query.trim();

  const advanced = isAdvancedQuery(trimmed);

  return useQuery({
    queryKey: ['scryfall', advanced ? 'search' : 'autocomplete', trimmed.toLowerCase()],
    queryFn: async (): Promise<CardSuggestions> => {
      const byName = async () => {
        const names = await autocompleteCardNames(trimmed);
        return {
          suggestions: names.map((name) => ({ name })),
          total: names.length,
        };
      };
      if (!advanced) {
        return byName();
      }
      try {
        return await searchCardSuggestions(trimmed);
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          const names = await byName();
          if (names.suggestions.length > 0) {
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
    queryFn: async () => {
      const printings = await searchPrintings(name ?? '');
      rememberCards(printings);
      return printings;
    },
    enabled: !!name,
    staleTime: ONE_DAY,
  });
}

export function useSetIcons() {
  return useQuery({
    queryKey: ['scryfall', 'sets'],
    queryFn: fetchSetIcons,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
  });
}
