import { describe, expect, it } from 'vitest';
import type { DeckBoard } from '../../api/types';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { copies, deckCard, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import { planEntryEdit } from './plan';
import type { PlanDeck } from './requests';

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

describe('move only some copies of an entry', () => {
  it('moves the last copies of an owned entry and leaves the rest as one entry', () => {
    const { ids, entry } = owned(4, 'main');

    const plan = planEntryEdit(deck, entry, { kind: 'moveToBoard', board: 'sideboard', count: 1 });

    expect(plan.steps).toEqual([{ kind: 'moveCards', deckId: 'deck-1', cardIds: [ids[3]], board: 'sideboard' }]);
    expect(plan.affected).toBe(1);
    expect(plan.entry).toMatchObject({ kind: 'owned', board: 'main', copy_ids: ids.slice(0, 3), quantity: 3 });
  });

  it('splits a pending entry: reduces it, then adds the moved copies on the target board', () => {
    const pending = pendingCard(forest, { id: 60, quantity: 4, board: 'main', foil: true, proxy: true });

    const plan = planEntryEdit(deck, pendingEntry(pending), { kind: 'moveToBoard', board: 'considering', count: 3 });

    expect(plan.steps).toEqual([
      { kind: 'setPendingQuantity', deckId: 'deck-1', pendingId: 60, quantity: 1 },
      {
        kind: 'addPending',
        deckId: 'deck-1',
        card: expect.objectContaining({
          scryfall_id: pending.scryfall_id,
          foil: true,
          proxy: true,
          quantity: 3,
          board: 'considering',
        }),
      },
    ]);
    expect(plan.affected).toBe(3);
    expect(plan.entry).toMatchObject({ kind: 'pending', board: 'main', quantity: 1, pending: { id: 60, quantity: 1 } });
  });

  it.each(moves)('a count equal to the entry moves it whole from $from to $to', ({ from, to }) => {
    const { ids, entry } = owned(3, from);
    const pending = pendingEntry(pendingCard(forest, { id: 61, quantity: 2, board: from }));

    const whole = planEntryEdit(deck, entry, { kind: 'moveToBoard', board: to, count: 3 });
    expect(whole.steps).toEqual([{ kind: 'moveCards', deckId: 'deck-1', cardIds: ids, board: to }]);
    expect(whole).toEqual(planEntryEdit(deck, entry, { kind: 'moveToBoard', board: to }));
    expect(planEntryEdit(deck, pending, { kind: 'moveToBoard', board: to, count: 2 }).steps).toEqual([
      { kind: 'movePending', deckId: 'deck-1', pendingId: 61, board: to },
    ]);
  });

  it('clamps a count above the size of the entry', () => {
    const { entry } = owned(2, 'main');
    const pending = pendingEntry(pendingCard(forest, { id: 62, quantity: 2 }));

    expect(planEntryEdit(deck, entry, { kind: 'moveToBoard', board: 'sideboard', count: 9 })).toEqual(
      planEntryEdit(deck, entry, { kind: 'moveToBoard', board: 'sideboard' }),
    );
    expect(planEntryEdit(deck, pending, { kind: 'moveToBoard', board: 'sideboard', count: 9 })).toEqual(
      planEntryEdit(deck, pending, { kind: 'moveToBoard', board: 'sideboard' }),
    );
  });
});

const slots = [
  { slot: 'commander', cardField: 'commander_id', pendingField: 'commander_pending_id' },
  { slot: 'partner', cardField: 'partner_id', pendingField: 'partner_pending_id' },
] as const;

describe.each(slots)('move the $slot', ({ cardField, pendingField }) => {
  it('plans the same move for an owned entry and leaves the slot alone', () => {
    const { ids, entry } = owned(1, 'main');

    const plan = planEntryEdit({ ...deck, [cardField]: ids[0] }, entry, { kind: 'moveToBoard', board: 'sideboard' });

    expect(plan.steps).toEqual([{ kind: 'moveCards', deckId: 'deck-1', cardIds: ids, board: 'sideboard' }]);
    expect(plan.entry).toMatchObject({ kind: 'owned', board: 'sideboard', copy_ids: ids });
  });

  it('plans the same move for a pending entry and leaves the slot alone', () => {
    const pending = pendingCard(forest, { id: 90 });

    const plan = planEntryEdit({ ...deck, [pendingField]: 90 }, pendingEntry(pending), {
      kind: 'moveToBoard',
      board: 'sideboard',
    });

    expect(plan.steps).toEqual([{ kind: 'movePending', deckId: 'deck-1', pendingId: 90, board: 'sideboard' }]);
  });
});
