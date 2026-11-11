import type { Card, DeckCard, DeckCardSort, SharedDeckCard } from '../api/types';
import type { PriceCurrency } from '../cards/price';

export type SharedDeckSort = 'name' | 'mana_value' | '-mana_value';

// The compare page offers these only; the shared deck page adds the price sorts.
export const sharedDeckSortOptions: { value: SharedDeckSort; label: string }[] = [
  { value: 'mana_value', label: 'Coût de mana croissant' },
  { value: 'name', label: 'Nom (A → Z)' },
  { value: '-mana_value', label: 'Coût de mana décroissant' },
];

export const priceSortOptions: { value: DeckCardSort; label: string }[] = [
  { value: '-price', label: 'Prix décroissant' },
  { value: 'price', label: 'Prix croissant' },
];

export function sharedCardsToCards(cards: SharedDeckCard[], currency: PriceCurrency | null): DeckCard[] {
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
    board: card.board,
    price: currency ? card.price[currency] : null,
    game_changer: card.game_changer,
  }));
}
