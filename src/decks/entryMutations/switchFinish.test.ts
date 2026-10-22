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

describe('switch the finish of an entry', () => {
  it.each([{ count: 1 }, { count: 3 }])('switches every one of $count owned copies', ({ count }) => {
    const { ids, entry } = owned(count);

    const plan = planEntryEdit(deck, entry, { kind: 'switchFinish', foil: true });

    expect(plan.steps).toEqual([{ kind: 'switchFinish', deckId: 'deck-1', cardIds: ids, foil: true }]);
    expect(plan.affected).toBe(count);
    expect(plan.entry).toMatchObject({ foil: true, quantity: count });
  });

  it('switches a pending card', () => {
    const entry = pendingEntry(pendingCard(forest, { id: 70, quantity: 2, foil: true }));

    const plan = planEntryEdit(deck, entry, { kind: 'switchFinish', foil: false });

    expect(plan.steps).toEqual([{ kind: 'switchFinish', deckId: 'deck-1', pendingIds: [70], foil: false }]);
    expect(plan.affected).toBe(2);
    expect(plan.entry).toMatchObject({ foil: false, quantity: 2 });
  });
});
