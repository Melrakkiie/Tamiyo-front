import { describe, expect, it } from 'vitest';

import { grizzlyBears } from '../scryfall/fixtures';
import { copies } from './boardTestHelpers';
import { type DeckEntry, ownedEntry } from './deckEntries';
import { retireAction } from './historyMenu';

function owned(count: number, changes = {}): DeckEntry {
  const cards = copies(count, grizzlyBears, changes);
  return ownedEntry({ ...cards[0], copy_ids: cards.map((card) => card.id), quantity: count });
}

describe('retireAction', () => {
  it('caps at the line count', () => {
    expect(retireAction({ name: 'Grizzly Bears', count: 2 }, 'main', [owned(5)])).toEqual({ max: 2 });
  });

  it('caps at the copies of that name on the board, over every entry', () => {
    const entries = [owned(1), owned(1, { foil: true }), owned(4, { board: 'sideboard' })];

    expect(retireAction({ name: 'Grizzly Bears', count: 5 }, 'main', entries)).toEqual({ max: 2 });
  });

  it('is disabled when nothing of that name is left on the board', () => {
    expect(retireAction({ name: 'Grizzly Bears', count: 2 }, 'main', [owned(3, { board: 'sideboard' })])).toEqual({
      max: 0,
      disabledReason: 'Il ne reste aucun exemplaire de cette carte dans cette section.',
    });
  });
});
