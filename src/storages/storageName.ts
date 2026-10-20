import type { Card } from '../api/types';

export function storageNameOf(card: Card, storageNames: Map<number, string>): string | null {
  return card.storage_id ? (storageNames.get(card.storage_id) ?? null) : null;
}
