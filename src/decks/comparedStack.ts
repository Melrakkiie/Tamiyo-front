import type { Card, ComparedCard } from '../api/types';
import { copyIds } from '../cards/copies';
import type { OwnedSource } from './deckEntries';

export type Side = 'deck' | 'other' | 'both';

export function comparedStackTotals(stack: Card, comparedById: Map<number, ComparedCard>) {
  const entries = copyIds(stack).flatMap((id) => comparedById.get(id) ?? []);
  return {
    quantity: entries.reduce((total, entry) => total + entry.quantity, 0),
    otherQuantity: entries.reduce((total, entry) => total + entry.other_quantity, 0),
    commander: entries.some((entry) => entry.commander),
    otherCommander: entries.some((entry) => entry.other_commander),
  };
}

export function copies(card: ComparedCard, side: Side) {
  switch (side) {
    case 'deck':
      return card.quantity;
    case 'other':
      return card.other_quantity;
    case 'both':
      return 1;
  }
}

export function toOwnedSources(cards: ComparedCard[], side: Side): OwnedSource[] {
  return cards.map((card, index) => ({
    id: index + 1,
    name: card.name,
    scryfall_id: card.scryfall_id,
    set_code: '',
    collector_number: '',
    foil: false,
    proxy: false,
    storage_id: null,
    mana_value: card.mana_value,
    colors: card.colors,
    card_type: card.card_type as Card['card_type'],
    color_identity: card.color_identity,
    added: '',
    updated: '',
    quantity: copies(card, side),
    board: 'main',
    game_changer: card.game_changer,
  }));
}
