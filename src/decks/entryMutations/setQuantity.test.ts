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
