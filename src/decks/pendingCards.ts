import type { Card, DeckCardSort, PendingCard } from '../api/types';

const COPIES_PER_ITEM = 100;

export function pendingToCards(pending: PendingCard[]): Card[] {
  return pending.flatMap((item) =>
    Array.from({ length: item.quantity }, (_, copy) => ({
      id: -(item.id * COPIES_PER_ITEM + copy + 1),
      name: item.name,
      scryfall_id: item.scryfall_id,
      set_code: item.set_code,
      collector_number: item.collector_number,
      foil: item.foil,
      storage_id: null,
      mana_value: item.mana_value,
      colors: item.colors,
      card_type: item.card_type,
      color_identity: item.color_identity,
      added: item.added,
      updated: item.added,
    })),
  );
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
  return descending ? -result : result;
}

export function sortDeckCards(cards: Card[], sort: DeckCardSort) {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => compare(a.card, b.card, sort) || a.index - b.index)
    .map(({ card }) => card);
}
