import { describe, expect, it } from 'vitest';
import type { DeckBoard } from '../../api/types';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { copies, deckCard, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import { planEntryEdit, type PlanDeck } from './plan';

const deck: PlanDeck = { id: 'deck-1', commander_id: null, partner_id: null };

const boards: DeckBoard[] = ['main', 'sideboard', 'considering'];
const moves = boards.flatMap((from) => boards.filter((to) => to !== from).map((to) => ({ from, to })));

function owned(count: number, board: DeckBoard) {
  const cards = copies(count, grizzlyBears, { board });
  const ids = cards.map((card) => card.id);
  return { ids, entry: ownedEntry({ ...cards[0], copy_ids: ids, quantity: count }) };
}

describe('move an owned entry to another board', () => {
  it.each(moves)('moves the only copy from $from to $to', ({ from, to }) => {
    const { ids, entry } = owned(1, from);

    const plan = planEntryEdit(deck, entry, { kind: 'moveToBoard', board: to });

    expect(plan.steps).toEqual([{ kind: 'moveCards', deckId: 'deck-1', cardIds: ids, board: to }]);
    expect(plan.affected).toBe(1);
    expect(plan.entry).toMatchObject({ kind: 'owned', board: to, copy_ids: ids, quantity: 1 });
  });

  it.each(moves)('moves every one of several copies from $from to $to', ({ from, to }) => {
    const { ids, entry } = owned(3, from);

    const plan = planEntryEdit(deck, entry, { kind: 'moveToBoard', board: to });

    expect(plan.steps).toEqual([{ kind: 'moveCards', deckId: 'deck-1', cardIds: ids, board: to }]);
    expect(plan.affected).toBe(3);
    expect(plan.entry).toMatchObject({ kind: 'owned', board: to, copy_ids: ids, quantity: 3 });
  });

  it('moves every copy of an owned entry through the owned-card call', () => {
    const [first, second] = copies(2, forest);
    const entry = ownedEntry({ ...first, copy_ids: [first.id, second.id], quantity: 2 });

    const plan = planEntryEdit(deck, entry, { kind: 'moveToBoard', board: 'sideboard' });

    expect(plan.steps).toEqual([
      { kind: 'moveCards', deckId: 'deck-1', cardIds: [first.id, second.id], board: 'sideboard' },
    ]);
    expect(plan.affected).toBe(2);
  });

  it('moves a single owned card', () => {
    const card = deckCard(forest, { board: 'sideboard' });

    const plan = planEntryEdit(deck, ownedEntry(card), { kind: 'moveToBoard', board: 'main' });

    expect(plan.steps).toEqual([{ kind: 'moveCards', deckId: 'deck-1', cardIds: [card.id], board: 'main' }]);
    expect(plan.affected).toBe(1);
  });
});

describe('move a pending entry to another board', () => {
  it.each(moves.flatMap((move) => [1, 3].map((quantity) => ({ ...move, quantity }))))(
    'moves a pending card of quantity $quantity from $from to $to',
    ({ from, to, quantity }) => {
      const entry = pendingEntry(pendingCard(forest, { id: 60, quantity, board: from }));

      const plan = planEntryEdit(deck, entry, { kind: 'moveToBoard', board: to });

      expect(plan.steps).toEqual([{ kind: 'movePending', deckId: 'deck-1', pendingId: 60, board: to }]);
      expect(plan.affected).toBe(quantity);
      expect(plan.entry).toMatchObject({ kind: 'pending', board: to, quantity, pending: { id: 60, board: to } });
    },
  );

  it('moves a pending entry through the pending-card call', () => {
    const pending = pendingCard(forest, { quantity: 3 });

    const plan = planEntryEdit(deck, pendingEntry(pending), { kind: 'moveToBoard', board: 'considering' });

    expect(plan.steps).toEqual([
      { kind: 'movePending', deckId: 'deck-1', pendingId: pending.id, board: 'considering' },
    ]);
    expect(plan.affected).toBe(3);
  });
});
