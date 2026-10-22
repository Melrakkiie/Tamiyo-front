import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { copies, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import { planEntryEdit, type PlanDeck } from './plan';

const deck: PlanDeck = { id: 'deck-1', commander_id: null, partner_id: null };

function owned(count: number) {
  const cards = copies(count, grizzlyBears);
  const ids = cards.map((card) => card.id);
  return { ids, entry: ownedEntry({ ...cards[0], copy_ids: ids, quantity: count }) };
}

describe('switch proxy on an entry', () => {
  it.each([{ count: 1 }, { count: 3 }])('switches every one of $count owned copies', ({ count }) => {
    const { ids, entry } = owned(count);

    const plan = planEntryEdit(deck, entry, { kind: 'switchProxy', proxy: true });

    expect(plan.steps).toEqual([{ kind: 'switchProxy', deckId: 'deck-1', cardIds: ids, proxy: true }]);
    expect(plan.affected).toBe(count);
    expect(plan.entry).toMatchObject({ proxy: true, quantity: count });
  });

  it('switches a pending card', () => {
    const entry = pendingEntry(pendingCard(forest, { id: 71, quantity: 2, proxy: true }));

    const plan = planEntryEdit(deck, entry, { kind: 'switchProxy', proxy: false });

    expect(plan.steps).toEqual([{ kind: 'switchProxy', deckId: 'deck-1', pendingIds: [71], proxy: false }]);
    expect(plan.affected).toBe(2);
    expect(plan.entry).toMatchObject({ proxy: false, quantity: 2 });
  });
});

const slots = [
  { slot: 'commander', cardField: 'commander_id', pendingField: 'commander_pending_id' },
  { slot: 'partner', cardField: 'partner_id', pendingField: 'partner_pending_id' },
] as const;

describe.each(slots)('switch the proxy of the $slot', ({ cardField, pendingField }) => {
  it('switches the owned copies and leaves the slot alone', () => {
    const { ids, entry } = owned(2);

    const plan = planEntryEdit({ ...deck, [cardField]: ids[1] }, entry, { kind: 'switchProxy', proxy: true });

    expect(plan.steps).toEqual([{ kind: 'switchProxy', deckId: 'deck-1', cardIds: ids, proxy: true }]);
    expect(plan.entry).toMatchObject({ proxy: true, copy_ids: ids });
  });

  it('switches the pending card and leaves the slot alone', () => {
    const entry = pendingEntry(pendingCard(forest, { id: 91 }));

    const plan = planEntryEdit({ ...deck, [pendingField]: 91 }, entry, { kind: 'switchProxy', proxy: true });

    expect(plan.steps).toEqual([{ kind: 'switchProxy', deckId: 'deck-1', pendingIds: [91], proxy: true }]);
  });
});
