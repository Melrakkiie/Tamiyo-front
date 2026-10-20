import type { Card, DeckCardSort, PendingCard } from '../api/types';
import type { PendingStatus } from '../cards/PendingBadge';

export function pendingStatus(item: PendingCard): PendingStatus {
  if (item.owned_same_printing > 0) {
    return { kind: 'owned', owned: item.owned_same_printing };
  }
  if (item.owned_copies > 0) {
    return { kind: 'other-printing', owned: item.owned_copies };
  }
  return { kind: 'missing' };
}

type SortableCard = Pick<Card, 'name' | 'mana_value' | 'added' | 'updated'> & { price?: number | null };

function compare(a: SortableCard, b: SortableCard, sort: DeckCardSort) {
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  let result = 0;
  if (field === 'price') {
    const aPrice = a.price ?? null;
    const bPrice = b.price ?? null;
    if (aPrice === null || bPrice === null) {
      return (aPrice === null ? 1 : 0) - (bPrice === null ? 1 : 0) || a.name.localeCompare(b.name);
    }
    result = aPrice - bPrice;
  } else if (field === 'name') {
    result = a.name.localeCompare(b.name);
  } else if (field === 'mana_value') {
    result = a.mana_value - b.mana_value;
  } else {
    result = (field === 'added' ? a.added : a.updated).localeCompare(field === 'added' ? b.added : b.updated);
  }
  return (descending ? -result : result) || (field === 'name' ? 0 : a.name.localeCompare(b.name));
}

export function sortDeckCards<T extends SortableCard>(cards: T[], sort: DeckCardSort): T[] {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => compare(a.card, b.card, sort) || a.index - b.index)
    .map(({ card }) => card);
}
