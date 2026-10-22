import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { copies, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import { planEntryEdit } from './plan';
import type { PlanDeck } from './requests';

const deck: PlanDeck = { id: 'deck-1', commander_id: null, partner_id: null };

function owned(count: number) {
  const cards = copies(count, grizzlyBears);
  const ids = cards.map((card) => card.id);
  return { ids, entry: ownedEntry({ ...cards[0], copy_ids: ids, quantity: count }) };
}

describe('remove copies of an owned entry', () => {
  it('removes the only copy', () => {
    const { ids, entry } = owned(1);

    const plan = planEntryEdit(deck, entry, { kind: 'removeCopies', count: 1 });

    expect(plan.steps).toEqual([{ kind: 'removeCard', deckId: 'deck-1', cardId: ids[0] }]);
    expect(plan.affected).toBe(1);
    expect(plan.entry).toBeNull();
  });

  it.each([
    { count: 1 as const, removed: [3], left: [0, 1, 2] },
    { count: 2 as const, removed: [2, 3], left: [0, 1] },
  ])('removes the last $count of several copies and keeps the rest', ({ count, removed, left }) => {
    const { ids, entry } = owned(4);

    const plan = planEntryEdit(deck, entry, { kind: 'removeCopies', count });

    expect(plan.steps).toEqual([
      count === 1
        ? { kind: 'removeCard', deckId: 'deck-1', cardId: ids[removed[0]] }
        : { kind: 'removeCopies', deckId: 'deck-1', cardIds: removed.map((index) => ids[index]) },
    ]);
    expect(plan.affected).toBe(count);
    expect(plan.entry).toMatchObject({ quantity: left.length, copy_ids: left.map((index) => ids[index]) });
  });

  it.each([{ count: 'all' as const }, { count: 3 }, { count: 5 }])(
    'removes every copy when asked for $count',
    ({ count }) => {
      const { ids, entry } = owned(3);

      const plan = planEntryEdit(deck, entry, { kind: 'removeCopies', count });

      expect(plan.steps).toEqual([{ kind: 'removeCopies', deckId: 'deck-1', cardIds: ids }]);
      expect(plan.affected).toBe(3);
      expect(plan.entry).toBeNull();
    },
  );
});

describe('remove copies of a pending entry', () => {
  it.each([{ count: 1 }, { count: 'all' as const }])('deletes a pending card of quantity 1 for $count', ({ count }) => {
    const entry = pendingEntry(pendingCard(forest, { id: 40 }));

    const plan = planEntryEdit(deck, entry, { kind: 'removeCopies', count });

    expect(plan.steps).toEqual([{ kind: 'removePending', deckId: 'deck-1', pendingId: 40 }]);
    expect(plan.affected).toBe(1);
    expect(plan.entry).toBeNull();
  });

  it.each([
    { count: 1, left: 3 },
    { count: 3, left: 1 },
  ])('lowers the quantity of a pending card when $count of 4 copies go', ({ count, left }) => {
    const entry = pendingEntry(pendingCard(forest, { id: 41, quantity: 4 }));

    const plan = planEntryEdit(deck, entry, { kind: 'removeCopies', count });

    expect(plan.steps).toEqual([{ kind: 'setPendingQuantity', deckId: 'deck-1', pendingId: 41, quantity: left }]);
    expect(plan.affected).toBe(count);
    expect(plan.entry).toMatchObject({ quantity: left, pending: { id: 41, quantity: left } });
  });

  it.each([{ count: 4 }, { count: 'all' as const }])('deletes a pending card of quantity 4 for $count', ({ count }) => {
    const entry = pendingEntry(pendingCard(forest, { id: 42, quantity: 4 }));

    const plan = planEntryEdit(deck, entry, { kind: 'removeCopies', count });

    expect(plan.steps).toEqual([{ kind: 'removePending', deckId: 'deck-1', pendingId: 42 }]);
    expect(plan.affected).toBe(4);
    expect(plan.entry).toBeNull();
  });
});

const slots = [
  {
    slot: 'commander',
    cardField: 'commander_id',
    pendingField: 'commander_pending_id',
    clear: { clear_commander_id: true },
  },
  { slot: 'partner', cardField: 'partner_id', pendingField: 'partner_pending_id', clear: { clear_partner_id: true } },
] as const;

describe.each(slots)('remove copies of the $slot', ({ cardField, pendingField, clear }) => {
  it.each([{ count: 1 }, { count: 'all' as const }])(
    'clears the slot before removing its only owned copy ($count)',
    ({ count }) => {
      const { ids, entry } = owned(1);
      const slotDeck = { ...deck, [cardField]: ids[0] };

      const plan = planEntryEdit(slotDeck, entry, { kind: 'removeCopies', count });

      expect(plan.steps).toEqual([
        { kind: 'patchDeck', deckId: 'deck-1', changes: clear },
        { kind: 'removeCard', deckId: 'deck-1', cardId: ids[0] },
      ]);
      expect(plan.entry).toBeNull();
    },
  );

  it('keeps the slot and its copy when removing some of several owned copies', () => {
    const { ids, entry } = owned(4);
    const slotDeck = { ...deck, [cardField]: ids[3] };

    const one = planEntryEdit(slotDeck, entry, { kind: 'removeCopies', count: 1 });
    const two = planEntryEdit(slotDeck, entry, { kind: 'removeCopies', count: 2 });

    expect(one.steps).toEqual([{ kind: 'removeCard', deckId: 'deck-1', cardId: ids[2] }]);
    expect(one.entry).toMatchObject({ copy_ids: [ids[0], ids[1], ids[3]] });
    expect(two.steps).toEqual([{ kind: 'removeCopies', deckId: 'deck-1', cardIds: [ids[1], ids[2]] }]);
    expect(two.entry).toMatchObject({ copy_ids: [ids[0], ids[3]] });
  });

  it('keeps the slot when removing a copy other than the first one', () => {
    const { ids, entry } = owned(2);
    const slotDeck = { ...deck, [cardField]: ids[1] };

    const plan = planEntryEdit(slotDeck, entry, { kind: 'removeCopies', count: 1 });

    expect(plan.steps).toEqual([{ kind: 'removeCard', deckId: 'deck-1', cardId: ids[0] }]);
    expect(plan.entry).toMatchObject({ id: ids[1], quantity: 1, copy_ids: [ids[1]] });
  });

  it('clears the slot before removing every owned copy', () => {
    const { ids, entry } = owned(3);
    const slotDeck = { ...deck, [cardField]: ids[0] };

    const plan = planEntryEdit(slotDeck, entry, { kind: 'removeCopies', count: 'all' });

    expect(plan.steps).toEqual([
      { kind: 'patchDeck', deckId: 'deck-1', changes: clear },
      { kind: 'removeCopies', deckId: 'deck-1', cardIds: ids },
    ]);
  });

  it.each([
    { quantity: 1, count: 1 },
    { quantity: 3, count: 'all' as const },
  ])('clears the slot before deleting a pending card of quantity $quantity', ({ quantity, count }) => {
    const entry = pendingEntry(pendingCard(forest, { id: 50, quantity }));
    const slotDeck = { ...deck, [pendingField]: 50 };

    const plan = planEntryEdit(slotDeck, entry, { kind: 'removeCopies', count });

    expect(plan.steps).toEqual([
      { kind: 'patchDeck', deckId: 'deck-1', changes: clear },
      { kind: 'removePending', deckId: 'deck-1', pendingId: 50 },
    ]);
  });

  it('keeps the slot when lowering the quantity of a pending card', () => {
    const entry = pendingEntry(pendingCard(forest, { id: 51, quantity: 3 }));
    const slotDeck = { ...deck, [pendingField]: 51 };

    const plan = planEntryEdit(slotDeck, entry, { kind: 'removeCopies', count: 2 });

    expect(plan.steps).toEqual([{ kind: 'setPendingQuantity', deckId: 'deck-1', pendingId: 51, quantity: 1 }]);
  });
});
