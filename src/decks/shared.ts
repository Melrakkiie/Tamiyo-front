import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { Card, SharedDeckCard } from '../api/types';

export type SharedDeckSort = 'name' | 'mana_value' | '-mana_value';

export const sharedDeckSortOptions: { value: SharedDeckSort; label: string }[] = [
  { value: 'mana_value', label: 'Coût de mana croissant' },
  { value: 'name', label: 'Nom (A → Z)' },
  { value: '-mana_value', label: 'Coût de mana décroissant' },
];

export function deckUrl(deckId: string) {
  return new URL(`/decks/${deckId}`, window.location.origin).toString();
}

export function useSharedDeck(deckId: string) {
  return useQuery({
    queryKey: ['shared', deckId, 'deck'],
    queryFn: async () => unwrap(await api.GET('/shared/decks/{id}', { params: { path: { id: deckId } } })),
  });
}

export function useSharedDeckStats(deckId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['shared', deckId, 'stats'],
    queryFn: async () => unwrap(await api.GET('/shared/decks/{id}/stats', { params: { path: { id: deckId } } })),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useSharedDeckLegality(deckId: string) {
  return useQuery({
    queryKey: ['shared', deckId, 'legality'],
    queryFn: async () => unwrap(await api.GET('/shared/decks/{id}/legality', { params: { path: { id: deckId } } })),
    staleTime: 5 * 60_000,
  });
}

export function sharedCardsToCards(cards: SharedDeckCard[]): Card[] {
  return cards.map((card, index) => ({
    id: index + 1,
    name: card.name,
    scryfall_id: card.scryfall_id,
    set_code: card.set_code,
    collector_number: card.collector_number,
    foil: card.foil,
    proxy: false,
    storage_id: null,
    mana_value: card.mana_value,
    colors: card.colors,
    card_type: card.card_type as Card['card_type'],
    color_identity: card.color_identity,
    added: '',
    updated: '',
    quantity: card.quantity,
  }));
}
