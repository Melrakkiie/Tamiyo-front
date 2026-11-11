import { describe, expect, it } from 'vitest';

import type { SharedDeckCard } from '../api/types';
import { sharedCardsToCards } from './sharedCards';

const card = {
  name: 'Sol Ring',
  scryfall_id: 'a',
  set_code: 'c21',
  collector_number: '1',
  foil: false,
  mana_value: 1,
  colors: [],
  card_type: 'artifact',
  color_identity: [],
  quantity: 1,
  board: 'mainboard',
  game_changer: false,
  price: { eur: 1.5, usd: 2.25 },
} as unknown as SharedDeckCard;

describe('sharedCardsToCards', () => {
  it.each([
    ['eur', 1.5],
    ['usd', 2.25],
    [null, null],
  ] as const)('fills the price for currency %s', (currency, expected) => {
    expect(sharedCardsToCards([card], currency)[0].price).toBe(expected);
  });

  it('keeps an unknown price null', () => {
    const unknown = { ...card, price: { eur: null, usd: null } };
    expect(sharedCardsToCards([unknown], 'eur')[0].price).toBeNull();
  });
});
