import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { Card, SharedDeckCard } from '../api/types';

export function sharedDeckPath(shareId: string) {
  return `/shared/${shareId}`;
}

export function sharedDeckUrl(shareId: string) {
  return new URL(sharedDeckPath(shareId), window.location.origin).toString();
}

export function useSharedDeck(shareId: string) {
  return useQuery({
    queryKey: ['shared', shareId, 'deck'],
    queryFn: async () => unwrap(await api.GET('/shared/decks/{share_id}', { params: { path: { share_id: shareId } } })),
  });
}

export function useSharedDeckStats(shareId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['shared', shareId, 'stats'],
    queryFn: async () =>
      unwrap(await api.GET('/shared/decks/{share_id}/stats', { params: { path: { share_id: shareId } } })),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useSharedDeckLegality(shareId: string) {
  return useQuery({
    queryKey: ['shared', shareId, 'legality'],
    queryFn: async () =>
      unwrap(await api.GET('/shared/decks/{share_id}/legality', { params: { path: { share_id: shareId } } })),
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
