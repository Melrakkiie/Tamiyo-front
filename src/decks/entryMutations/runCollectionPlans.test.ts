import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { copies, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import { fakeDeckApi } from './fakeDeckApi';
import { type EntryIntent, planEntryEdit } from './plan';
import type { PlanDeck } from './requests';
import { runPlan } from './runPlan';

const deck: PlanDeck = { id: 'deck-1', commander_id: null, partner_id: null };
const [first, second] = copies(2, grizzlyBears);
const owned = ownedEntry({ ...first, copy_ids: [first.id, second.id], quantity: 2 });
const pending = pendingEntry(pendingCard(forest, { id: 90, quantity: 2 }));

const cases: { name: string; entry: typeof owned | typeof pending; intent: EntryIntent }[] = [
  { name: 'switch finish', entry: owned, intent: { kind: 'switchFinish', foil: true } },
  { name: 'switch proxy', entry: pending, intent: { kind: 'switchProxy', proxy: true } },
  { name: 'add a pending entry to the collection', entry: pending, intent: { kind: 'addToCollection', count: 1 } },
  { name: 'add an owned entry to the collection', entry: owned, intent: { kind: 'addToCollection' } },
];

describe('run a plan that touches the collection', () => {
  it.each(cases)('$name invalidates the deck, the collection and storages once', async ({ entry, intent }) => {
    const api = fakeDeckApi();

    await runPlan(planEntryEdit(deck, entry, intent), api.port, api.invalidate);

    expect(api.invalidations).toEqual([{ collection: true }]);
  });

  it('still invalidates the collection once when its request fails', async () => {
    const api = fakeDeckApi({ failOn: 'commitPending' });

    await expect(
      runPlan(planEntryEdit(deck, pending, { kind: 'addToCollection' }), api.port, api.invalidate),
    ).rejects.toThrow('commitPending failed');

    expect(api.invalidations).toEqual([{ collection: true }]);
  });

  it('hands the switch summary back to the caller', async () => {
    const api = fakeDeckApi();

    const result = await runPlan(
      planEntryEdit(deck, owned, { kind: 'switchFinish', foil: true }),
      api.port,
      api.invalidate,
    );

    expect(result.responses).toEqual([{ cards_linked: 2 }]);
    expect(result.affected).toBe(2);
  });
});
