import { describe, expect, it } from 'vitest';

import type { ComparedCard } from '../api/types';
import { forest } from '../scryfall/fixtures';
import { deckCard } from './boardTestHelpers';
import { ownedEntry, stackEntries } from './deckEntries';
import { comparedStackTotals } from './comparedStack';

function compared(quantity: number, otherQuantity: number, changes: Partial<ComparedCard> = {}): ComparedCard {
  return {
    quantity,
    other_quantity: otherQuantity,
    commander: false,
    other_commander: false,
    ...changes,
  } as ComparedCard;
}

describe('comparedStackTotals', () => {
  it('sums the quantities of compared entries merged into one stack', () => {
    const first = deckCard(forest, { id: 1 });
    const second = deckCard(forest, { id: 2 });
    const [stack] = stackEntries([ownedEntry(first), ownedEntry(second)], [], true);
    const byId = new Map([
      [1, compared(2, 1)],
      [2, compared(3, 4, { other_commander: true })],
    ]);
    expect(comparedStackTotals(stack, byId)).toEqual({
      quantity: 5,
      otherQuantity: 5,
      commander: false,
      otherCommander: true,
    });
  });
});
