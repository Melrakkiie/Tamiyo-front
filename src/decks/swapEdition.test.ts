import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears } from '../scryfall/fixtures';
import { deckCard, pendingCard } from './boardTestHelpers';
import { ownedEntry, pendingEntry } from './deckEntries';
import { swapEdition } from './swapEdition';

describe('swapEdition to an owned copy', () => {
  it('swaps an owned entry for another copy, keeping the board', () => {
    const from = deckCard(grizzlyBears, { board: 'sideboard' });
    const copy = deckCard(grizzlyBears, { foil: true });

    const request = swapEdition('deck-1', ownedEntry(from), { kind: 'owned', copy }, null);

    expect(request).toEqual({
      kind: 'owned',
      deckId: 'deck-1',
      copyId: copy.id,
      board: 'sideboard',
      slotChanges: null,
      remove: { kind: 'card', cardId: from.id },
      remainder: null,
      entry: ownedEntry({ ...copy, board: 'sideboard' }),
    });
  });

  it('moves the commander slot onto the new copy', () => {
    const from = deckCard(grizzlyBears, { board: 'commander' });
    const copy = deckCard(grizzlyBears);

    const request = swapEdition('deck-1', ownedEntry(from), { kind: 'owned', copy }, 'commander');

    expect(request.kind === 'owned' && request.slotChanges).toEqual({ commander_id: copy.id });
  });

  it('makes a pending entry owned, keeping the board and the other pending copies', () => {
    const from = pendingCard(forest, { board: 'considering', quantity: 3 });
    const copy = deckCard(forest);

    const request = swapEdition('deck-1', pendingEntry(from), { kind: 'owned', copy }, 'partner');

    expect(request).toEqual({
      kind: 'owned',
      deckId: 'deck-1',
      copyId: copy.id,
      board: 'considering',
      slotChanges: { partner_id: copy.id },
      remove: { kind: 'pending', pendingId: from.id },
      remainder: expect.objectContaining({ scryfall_id: from.scryfall_id, quantity: 2, board: 'considering' }),
      entry: ownedEntry({ ...copy, board: 'considering' }),
    });
  });

  it('leaves no remainder when a single pending copy is replaced', () => {
    const from = pendingCard(forest);

    const request = swapEdition('deck-1', pendingEntry(from), { kind: 'owned', copy: deckCard(forest) }, null);

    expect(request.kind === 'owned' && request.remainder).toBeNull();
  });
});
