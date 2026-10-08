import type { Card, DeckCard, DeckCardSort, PendingCard } from '../api/types';
import type { PendingStatus } from '../cards/PendingBadge';

const COPIES_PER_ITEM = 100;

export function pendingToCards(pending: PendingCard[]): DeckCard[] {
  return pending.flatMap((item) =>
    Array.from({ length: item.quantity }, (_, copy) => ({
      id: -(item.id * COPIES_PER_ITEM + copy + 1),
      name: item.name,
      scryfall_id: item.scryfall_id,
      set_code: item.set_code,
      collector_number: item.collector_number,
      foil: item.foil,
      proxy: false,
      storage_id: null,
      mana_value: item.mana_value,
      colors: item.colors,
      card_type: item.card_type,
      color_identity: item.color_identity,
      added: item.added,
      updated: item.added,
      board: item.board,
    })),
  );
}

export function pendingStatus(item: PendingCard): PendingStatus {
  if (item.owned_same_printing > 0) {
    return { kind: 'owned', owned: item.owned_same_printing };
  }
  if (item.owned_copies > 0) {
    return { kind: 'other-printing', owned: item.owned_copies };
  }
  return { kind: 'missing' };
}

export function isPendingCard(card: Card) {
  return card.id < 0;
}

export function pendingIdOf(card: Card) {
  return Math.floor((-card.id - 1) / COPIES_PER_ITEM);
}

function compare(a: Card, b: Card, sort: DeckCardSort) {
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  let result = 0;
  if (field === 'name') {
    result = a.name.localeCompare(b.name);
  } else if (field === 'mana_value') {
    result = a.mana_value - b.mana_value;
  } else {
    result = (field === 'added' ? a.added : a.updated).localeCompare(field === 'added' ? b.added : b.updated);
  }
  return (descending ? -result : result) || (field === 'name' ? 0 : a.name.localeCompare(b.name));
}

export function sortDeckCards<T extends Card>(cards: T[], sort: DeckCardSort): T[] {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => compare(a.card, b.card, sort) || a.index - b.index)
    .map(({ card }) => card);
}

function stackKey(card: Card, commanderId: number | null | undefined) {
  if (isPendingCard(card)) {
    return `pending-${pendingIdOf(card)}`;
  }
  if (card.id === commanderId) {
    return 'commander';
  }
  return `${card.scryfall_id}-${card.foil}-${card.proxy}-${card.storage_id ?? ''}`;
}

export function stackCards<T extends Card>(cards: T[], commanderId: number | null | undefined): T[] {
  const stacks = new Map<string, T>();
  for (const card of cards) {
    const key = stackKey(card, commanderId);
    const stack = stacks.get(key);
    if (stack) {
      stack.quantity = (stack.quantity ?? 1) + 1;
      stack.copy_ids = [...(stack.copy_ids ?? []), card.id];
    } else {
      stacks.set(key, { ...card, quantity: 1, copy_ids: [card.id] });
    }
  }
  return [...stacks.values()];
}
