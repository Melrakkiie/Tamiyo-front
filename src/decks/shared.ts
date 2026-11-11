import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';

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

export function useSharedDeckHistory(deckId: string) {
  return useQuery({
    queryKey: ['shared', deckId, 'history'],
    queryFn: async () => unwrap(await api.GET('/shared/decks/{id}/history', { params: { path: { id: deckId } } })),
  });
}

export function useSharedDeckCombos(deckId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['shared', deckId, 'combos'],
    queryFn: async () => unwrap(await api.GET('/shared/decks/{id}/combos', { params: { path: { id: deckId } } })),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useSharedDeckLegality(deckId: string) {
  return useQuery({
    queryKey: ['shared', deckId, 'legality'],
    queryFn: async () => unwrap(await api.GET('/shared/decks/{id}/legality', { params: { path: { id: deckId } } })),
    staleTime: 5 * 60_000,
  });
}

export function useDeckOwnership(deckId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['decks', 'ownership', deckId],
    queryFn: async () => unwrap(await api.GET('/deck/{id}/ownership', { params: { path: { id: deckId } } })),
    enabled,
    staleTime: 60_000,
  });
}
