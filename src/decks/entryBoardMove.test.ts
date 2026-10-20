import { describe, expect, it } from 'vitest';
import { forest } from '../scryfall/fixtures';
import { copies, deckCard, pendingCard } from './boardTestHelpers';
import { ownedEntry, pendingEntry } from './deckEntries';
import { entryBoardMove } from './entryBoardMove';

describe('entryBoardMove', () => {
  it('moves every copy of an owned entry through the owned-card call', () => {
    const [first, second] = copies(2, forest);
    const entry = ownedEntry({ ...first, copy_ids: [first.id, second.id], quantity: 2 });

    expect(entryBoardMove(entry, 'deck-1', 'sideboard')).toEqual({
      kind: 'owned',
      count: 2,
      variables: { deckId: 'deck-1', cardIds: [first.id, second.id], board: 'sideboard' },
    });
  });

  it('moves a pending entry through the pending-card call', () => {
    const pending = pendingCard(forest, { quantity: 3 });

    expect(entryBoardMove(pendingEntry(pending), 'deck-1', 'considering')).toEqual({
      kind: 'pending',
      count: 3,
      variables: { deckId: 'deck-1', pendingId: pending.id, board: 'considering' },
    });
  });

  it('moves a single owned card', () => {
    const card = deckCard(forest);

    expect(entryBoardMove(ownedEntry(card), 'deck-1', 'main')).toMatchObject({
      kind: 'owned',
      count: 1,
      variables: { cardIds: [card.id] },
    });
  });
});
