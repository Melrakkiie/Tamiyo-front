import type { Card } from '../api/types';

export function copyIds(card: Card): number[] {
  return card.copy_ids && card.copy_ids.length > 0 ? card.copy_ids : [card.id];
}

export function copyCount(card: Card): number {
  return card.quantity ?? 1;
}

export function totalCopies(cards: Card[]): number {
  return cards.reduce((total, card) => total + copyCount(card), 0);
}
