import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { copies, deckCard, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import { fakeDeckApi } from './fakeDeckApi';
import { addedPendingId, type Plan } from './requests';
import { runPlan } from './runPlan';

const [first, second] = copies(2, grizzlyBears);
const entry = ownedEntry({ ...first, copy_ids: [first.id, second.id], quantity: 2 });

const removePlan: Plan = {
  steps: [
    { kind: 'patchDeck', deckId: 'deck-1', changes: { clear_commander_id: true } },
    { kind: 'removeCopies', deckId: 'deck-1', cardIds: [first.id, second.id] },
  ],
  affected: 2,
  entry: null,
};

describe('runPlan', () => {
  it('runs the requests in plan order and returns the entry and the affected count', async () => {
    const api = fakeDeckApi();

    const result = await runPlan(removePlan, api.port, api.invalidate);

    expect(api.calls).toEqual(removePlan.steps);
    expect(result).toMatchObject({ entry: null, affected: 2 });
  });

  it('returns the entry the plan leaves', async () => {
    const api = fakeDeckApi();
    const left = { ...entry, quantity: 1, copy_ids: [first.id] };

    const result = await runPlan(
      { steps: [{ kind: 'removeCard', deckId: 'deck-1', cardId: second.id }], affected: 1, entry: left },
      api.port,
      api.invalidate,
    );

    expect(result.entry).toEqual(left);
  });

  it('stops at the first failed request and surfaces its error', async () => {
    const api = fakeDeckApi({ failOn: 'patchDeck' });

    await expect(runPlan(removePlan, api.port, api.invalidate)).rejects.toThrow('patchDeck failed');

    expect(api.calls.map((call) => call.kind)).toEqual(['patchDeck']);
  });

  it('invalidates the deck once, whether the plan succeeds or fails', async () => {
    const succeeded = fakeDeckApi();
    const failed = fakeDeckApi({ failOn: 'removeCopies' });

    await runPlan(removePlan, succeeded.port, succeeded.invalidate);
    await runPlan(removePlan, failed.port, failed.invalidate).catch(() => undefined);

    expect(succeeded.invalidations).toEqual([{ collection: false }]);
    expect(failed.invalidations).toEqual([{ collection: false }]);
  });

  it('surfaces the request error when the invalidation fails too', async () => {
    const api = fakeDeckApi({ failOn: 'removeCopies' });
    const invalidate = () => Promise.reject(new Error('invalidation failed'));

    await expect(runPlan(removePlan, api.port, invalidate)).rejects.toThrow('removeCopies failed');
  });

  it('also invalidates the collection when a request touched it', async () => {
    const api = fakeDeckApi();

    await runPlan(
      {
        steps: [{ kind: 'commitPending', deckId: 'deck-1', storageId: null, pendingId: 60 }],
        affected: 2,
        entry: null,
      },
      api.port,
      api.invalidate,
    );

    expect(api.invalidations).toEqual([{ collection: true }]);
  });

  it('hands the id of a pending card added by an earlier step to a later step and returns its entry', async () => {
    const api = fakeDeckApi({ nextPendingId: 900 });
    const source = deckCard(forest);
    const card = { ...pendingInput(), quantity: 1 };

    const result = await runPlan(
      {
        steps: [
          { kind: 'addPending', deckId: 'deck-1', card },
          { kind: 'patchDeck', deckId: 'deck-1', changes: { commander_pending_id: addedPendingId(0) } },
          { kind: 'removeCard', deckId: 'deck-1', cardId: source.id },
        ],
        affected: 1,
        entry: addedPendingId(0),
      },
      api.port,
      api.invalidate,
    );

    expect(api.calls[1]).toEqual({ kind: 'patchDeck', deckId: 'deck-1', changes: { commander_pending_id: 900 } });
    expect(result.entry).toEqual(pendingEntry(api.addedPending[0]));
    expect(result.entry).toMatchObject({ kind: 'pending', pending: { id: 900, name: card.name } });
  });
});

function pendingInput() {
  const { name, scryfall_id, set_code, collector_number, foil, board } = pendingCard(forest);
  return { name, scryfall_id, set_code, collector_number, foil, board };
}
