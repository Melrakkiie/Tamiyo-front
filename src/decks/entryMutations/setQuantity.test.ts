import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { copies, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import { planEntryEdit, type PlanDeck } from './plan';

const deck: PlanDeck = { id: 'deck-1', commander_id: null, partner_id: null };

function owned(count: number) {
  const cards = copies(count, grizzlyBears, { board: 'sideboard' });
  const ids = cards.map((card) => card.id);
  return { ids, entry: ownedEntry({ ...cards[0], copy_ids: ids, quantity: count }) };
}

function pending(id: number, quantity: number) {
  return pendingEntry(pendingCard(forest, { id, quantity, board: 'considering', foil: true }));
}

const bears = {
  name: 'Grizzly Bears',
  set_code: grizzlyBears.set,
  collector_number: grizzlyBears.collector_number,
  foil: false,
};
const forests = { name: 'Forest', set_code: forest.set, collector_number: forest.collector_number, foil: true };

describe('raise the quantity of an entry', () => {
  it.each([
    { label: 'an owned entry with one copy', make: () => owned(1).entry, card: bears, board: 'sideboard' },
    { label: 'an owned entry with several copies', make: () => owned(3).entry, card: bears, board: 'sideboard' },
    { label: 'a pending entry of quantity 1', make: () => pending(60, 1), card: forests, board: 'considering' },
    { label: 'a pending entry of quantity N', make: () => pending(61, 3), card: forests, board: 'considering' },
  ])('imports the missing copies on its board for $label', ({ make, card, board }) => {
    const entry = make();

    const plan = planEntryEdit(deck, entry, { kind: 'setQuantity', quantity: entry.quantity + 2 });

    expect(plan.steps).toEqual([{ kind: 'importDeckLine', deckId: 'deck-1', card, count: 2, board }]);
    expect(plan.affected).toBe(2);
  });
});

describe('lower the quantity of an owned entry', () => {
  it('removes the only copy at 0', () => {
    const { ids, entry } = owned(1);

    const plan = planEntryEdit(deck, entry, { kind: 'setQuantity', quantity: 0 });

    expect(plan.steps).toEqual([{ kind: 'removeCard', deckId: 'deck-1', cardId: ids[0] }]);
    expect(plan.affected).toBe(1);
    expect(plan.entry).toBeNull();
  });

  it('removes the last copies and keeps the others', () => {
    const { ids, entry } = owned(4);

    const one = planEntryEdit(deck, entry, { kind: 'setQuantity', quantity: 3 });
    const two = planEntryEdit(deck, entry, { kind: 'setQuantity', quantity: 2 });

    expect(one.steps).toEqual([{ kind: 'removeCard', deckId: 'deck-1', cardId: ids[3] }]);
    expect(one.affected).toBe(1);
    expect(one.entry).toMatchObject({ quantity: 3, copy_ids: [ids[0], ids[1], ids[2]] });
    expect(two.steps).toEqual([{ kind: 'removeCopies', deckId: 'deck-1', cardIds: [ids[2], ids[3]] }]);
    expect(two.affected).toBe(2);
    expect(two.entry).toMatchObject({ quantity: 2, copy_ids: [ids[0], ids[1]] });
  });

  it('removes every copy at 0', () => {
    const { ids, entry } = owned(3);

    const plan = planEntryEdit(deck, entry, { kind: 'setQuantity', quantity: 0 });

    expect(plan.steps).toEqual([{ kind: 'removeCopies', deckId: 'deck-1', cardIds: ids }]);
    expect(plan.affected).toBe(3);
    expect(plan.entry).toBeNull();
  });
});

describe('lower the quantity of a pending entry', () => {
  it('deletes a pending card of quantity 1 at 0', () => {
    const plan = planEntryEdit(deck, pending(70, 1), { kind: 'setQuantity', quantity: 0 });

    expect(plan.steps).toEqual([{ kind: 'removePending', deckId: 'deck-1', pendingId: 70 }]);
    expect(plan.affected).toBe(1);
    expect(plan.entry).toBeNull();
  });

  it.each([
    { quantity: 3, removed: 1 },
    { quantity: 1, removed: 3 },
  ])('keeps $quantity wanted copies of 4', ({ quantity, removed }) => {
    const plan = planEntryEdit(deck, pending(71, 4), { kind: 'setQuantity', quantity });

    expect(plan.steps).toEqual([{ kind: 'setPendingQuantity', deckId: 'deck-1', pendingId: 71, quantity }]);
    expect(plan.affected).toBe(removed);
    expect(plan.entry).toMatchObject({ quantity, pending: { id: 71, quantity } });
  });

  it('deletes a pending card of quantity 4 at 0', () => {
    const plan = planEntryEdit(deck, pending(72, 4), { kind: 'setQuantity', quantity: 0 });

    expect(plan.steps).toEqual([{ kind: 'removePending', deckId: 'deck-1', pendingId: 72 }]);
    expect(plan.affected).toBe(4);
    expect(plan.entry).toBeNull();
  });
});

describe('set the quantity of the commander', () => {
  it('clears the slot before removing its only owned copy', () => {
    const { ids, entry } = owned(1);

    const plan = planEntryEdit({ ...deck, commander_id: ids[0] }, entry, { kind: 'setQuantity', quantity: 0 });

    expect(plan.steps).toEqual([
      { kind: 'patchDeck', deckId: 'deck-1', changes: { clear_commander_id: true } },
      { kind: 'removeCard', deckId: 'deck-1', cardId: ids[0] },
    ]);
  });

  it('keeps the slot and its copy when lowering several owned copies', () => {
    const { ids, entry } = owned(3);

    const plan = planEntryEdit({ ...deck, commander_id: ids[2] }, entry, { kind: 'setQuantity', quantity: 1 });

    expect(plan.steps).toEqual([{ kind: 'removeCopies', deckId: 'deck-1', cardIds: [ids[0], ids[1]] }]);
    expect(plan.entry).toMatchObject({ copy_ids: [ids[2]] });
  });

  it('clears the slot before deleting the pending commander', () => {
    const plan = planEntryEdit({ ...deck, commander_pending_id: 73 }, pending(73, 2), {
      kind: 'setQuantity',
      quantity: 0,
    });

    expect(plan.steps).toEqual([
      { kind: 'patchDeck', deckId: 'deck-1', changes: { clear_commander_id: true } },
      { kind: 'removePending', deckId: 'deck-1', pendingId: 73 },
    ]);
  });

  it('keeps the slot when lowering the pending commander', () => {
    const plan = planEntryEdit({ ...deck, commander_pending_id: 74 }, pending(74, 3), {
      kind: 'setQuantity',
      quantity: 2,
    });

    expect(plan.steps).toEqual([{ kind: 'setPendingQuantity', deckId: 'deck-1', pendingId: 74, quantity: 2 }]);
  });

  it('imports more copies of the commander', () => {
    const { ids, entry } = owned(1);

    const plan = planEntryEdit({ ...deck, commander_id: ids[0] }, entry, { kind: 'setQuantity', quantity: 2 });

    expect(plan.steps).toEqual([
      { kind: 'importDeckLine', deckId: 'deck-1', card: bears, count: 1, board: 'sideboard' },
    ]);
  });
});

describe('keep the quantity of an entry', () => {
  it('plans nothing', () => {
    const entry = pending(75, 2);

    const plan = planEntryEdit(deck, entry, { kind: 'setQuantity', quantity: 2 });

    expect(plan).toEqual({ steps: [], affected: 0, entry });
  });
});
