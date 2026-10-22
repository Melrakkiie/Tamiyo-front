import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { copies, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import { planEntryEdit, type PlanDeck } from './plan';

const deck: PlanDeck = { id: 'deck-1', commander_id: null, partner_id: null };

describe('add a pending entry to the collection', () => {
  it('commits every copy, without storage, when no count is given', () => {
    const entry = pendingEntry(pendingCard(forest, { id: 80, quantity: 3 }));

    const plan = planEntryEdit(deck, entry, { kind: 'addToCollection' });

    expect(plan.steps).toEqual([{ kind: 'commitPending', deckId: 'deck-1', storageId: null, pendingId: 80 }]);
    expect(plan.affected).toBe(3);
    expect(plan.entry).toBeNull();
  });

  it('commits some of the copies and keeps the rest pending', () => {
    const entry = pendingEntry(pendingCard(forest, { id: 81, quantity: 3 }));

    const plan = planEntryEdit(deck, entry, { kind: 'addToCollection', count: 2 });

    expect(plan.steps).toEqual([
      { kind: 'commitPending', deckId: 'deck-1', storageId: null, pendingId: 81, quantity: 2 },
    ]);
    expect(plan.affected).toBe(2);
    expect(plan.entry).toMatchObject({ kind: 'pending', quantity: 1, pending: { id: 81, quantity: 1 } });
  });

  it.each([{ count: 3 }, { count: 5 }])('commits every copy into a storage when asked for $count', ({ count }) => {
    const entry = pendingEntry(pendingCard(forest, { id: 82, quantity: 3 }));

    const plan = planEntryEdit(deck, entry, { kind: 'addToCollection', count, storageId: 12 });

    expect(plan.steps).toEqual([
      { kind: 'commitPending', deckId: 'deck-1', storageId: 12, pendingId: 82, quantity: 3 },
    ]);
    expect(plan.affected).toBe(3);
    expect(plan.entry).toBeNull();
  });
});

describe('add an owned entry to the collection', () => {
  const [first, second] = copies(2, grizzlyBears, { foil: true, proxy: true, storage_id: 4 });
  const entry = ownedEntry({ ...first, copy_ids: [first.id, second.id], quantity: 2 });
  const card = {
    name: 'Grizzly Bears',
    scryfall_id: grizzlyBears.id,
    set_code: grizzlyBears.set,
    collector_number: grizzlyBears.collector_number,
    foil: true,
    proxy: false,
    mana_value: entry.mana_value,
    colors: entry.colors,
    card_type: entry.card_type,
    color_identity: entry.color_identity,
  };

  it('creates one more real copy, outside any storage, and leaves the deck as it is', () => {
    const plan = planEntryEdit(deck, entry, { kind: 'addToCollection' });

    expect(plan.steps).toEqual([{ kind: 'createCards', card: { ...card, storage_id: null }, quantity: 1 }]);
    expect(plan.affected).toBe(1);
    expect(plan.entry).toBe(entry);
  });

  it('creates the given count of copies in the given storage', () => {
    const plan = planEntryEdit(deck, entry, { kind: 'addToCollection', count: 3, storageId: 9 });

    expect(plan.steps).toEqual([{ kind: 'createCards', card: { ...card, storage_id: 9 }, quantity: 3 }]);
    expect(plan.affected).toBe(3);
  });
});
