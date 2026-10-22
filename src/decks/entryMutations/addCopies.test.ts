import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { copies, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import { planEntryEdit } from './plan';
import type { PlanDeck } from './requests';

const deck: PlanDeck = { id: 'deck-1', commander_id: null, partner_id: null };

const [first, second] = copies(2, grizzlyBears, { foil: true, board: 'sideboard' });
const owned = ownedEntry({ ...first, copy_ids: [first.id, second.id], quantity: 2 });
const line = { name: 'Grizzly Bears', set_code: first.set_code, collector_number: first.collector_number, foil: true };

describe('add copies to an entry', () => {
  it('imports the copies of the entry printing onto its own board', () => {
    const plan = planEntryEdit(deck, owned, { kind: 'addCopies', count: 3 });

    expect(plan.steps).toEqual([
      { kind: 'importDeckLine', deckId: 'deck-1', card: line, count: 3, board: 'sideboard' },
    ]);
    expect(plan.affected).toBe(3);
    expect(plan.entry).toBe(owned);
  });

  it('imports them onto the given board instead', () => {
    const plan = planEntryEdit(deck, owned, { kind: 'addCopies', count: 1, board: 'main' });

    expect(plan.steps).toEqual([{ kind: 'importDeckLine', deckId: 'deck-1', card: line, count: 1, board: 'main' }]);
  });

  it('imports the copies of a pending entry the same way', () => {
    const entry = pendingEntry(pendingCard(forest, { board: 'considering', quantity: 2 }));

    const plan = planEntryEdit(deck, entry, { kind: 'addCopies', count: 1 });

    expect(plan.steps).toEqual([
      {
        kind: 'importDeckLine',
        deckId: 'deck-1',
        card: {
          name: entry.name,
          set_code: entry.set_code,
          collector_number: entry.collector_number,
          foil: entry.foil,
        },
        count: 1,
        board: 'considering',
      },
    ]);
  });

  it.each([
    { slot: 'commander', field: 'commander_id' },
    { slot: 'partner', field: 'partner_id' },
  ] as const)('leaves the $slot slot alone', ({ field }) => {
    const plan = planEntryEdit({ ...deck, [field]: first.id }, owned, { kind: 'addCopies', count: 1 });

    expect(plan.steps.map((step) => step.kind)).toEqual(['importDeckLine']);
  });
});
