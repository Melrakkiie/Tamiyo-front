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
