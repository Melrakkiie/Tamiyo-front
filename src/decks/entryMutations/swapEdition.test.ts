import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears, serraAngel } from '../../scryfall/fixtures';
import { copies, deckCard, pendingCard } from '../boardTestHelpers';
import { type DeckEntry, ownedEntry, pendingEntry } from '../deckEntries';
import { fakeDeckApi } from './fakeDeckApi';
import { planEntryEdit } from './plan';
import { addedPendingId, type PlanDeck } from './requests';
import { runPlan } from './runPlan';
import type { SwapTarget } from './swapEdition';

const deck: PlanDeck = { id: 'deck-1', commander_id: null, partner_id: null };

describe('swap edition to an owned copy', () => {
  it('swaps an owned entry for another copy, keeping the board', () => {
    const from = deckCard(grizzlyBears, { board: 'sideboard' });
    const copy = deckCard(grizzlyBears, { foil: true });

    const plan = planEntryEdit(deck, ownedEntry(from), { kind: 'swapEdition', target: { kind: 'owned', copy } });

    expect(plan.steps).toEqual([
      { kind: 'putCardOnBoard', deckId: 'deck-1', cardId: copy.id, board: 'sideboard' },
      { kind: 'removeCard', deckId: 'deck-1', cardId: from.id },
    ]);
    expect(plan.affected).toBe(1);
    expect(plan.entry).toEqual(ownedEntry({ ...copy, board: 'sideboard' }));
  });

  it('moves the commander slot onto the new copy before removing the source', () => {
    const from = deckCard(grizzlyBears, { board: 'main' });
    const copy = deckCard(grizzlyBears);

    const plan = planEntryEdit({ ...deck, commander_id: from.id }, ownedEntry(from), {
      kind: 'swapEdition',
      target: { kind: 'owned', copy },
    });

    expect(plan.steps).toEqual([
      { kind: 'putCardOnBoard', deckId: 'deck-1', cardId: copy.id, board: 'main' },
      { kind: 'patchDeck', deckId: 'deck-1', changes: { commander_id: copy.id } },
      { kind: 'removeCard', deckId: 'deck-1', cardId: from.id },
    ]);
  });

  it('leaves the commander slot alone when it sits on another copy of the stack', () => {
    const [kept, replaced] = copies(2, grizzlyBears);
    const copy = deckCard(grizzlyBears);
    const stack = ownedEntry({ ...replaced, copy_ids: [replaced.id, kept.id], quantity: 2 });

    const plan = planEntryEdit({ ...deck, commander_id: kept.id }, stack, {
      kind: 'swapEdition',
      target: { kind: 'owned', copy },
    });

    expect(plan.steps.map((step) => step.kind)).toEqual(['putCardOnBoard', 'removeCard']);
  });

  it('makes a pending entry owned, keeping the board, the partner slot and the other pending copies', () => {
    const from = pendingCard(forest, { board: 'considering', quantity: 3 });
    const copy = deckCard(forest);

    const plan = planEntryEdit({ ...deck, partner_pending_id: from.id }, pendingEntry(from), {
      kind: 'swapEdition',
      target: { kind: 'owned', copy },
    });

    expect(plan.steps).toEqual([
      { kind: 'putCardOnBoard', deckId: 'deck-1', cardId: copy.id, board: 'considering' },
      { kind: 'patchDeck', deckId: 'deck-1', changes: { partner_id: copy.id } },
      { kind: 'removePending', deckId: 'deck-1', pendingId: from.id },
      {
        kind: 'addPending',
        deckId: 'deck-1',
        card: {
          name: from.name,
          scryfall_id: from.scryfall_id,
          set_code: from.set_code,
          collector_number: from.collector_number,
          foil: from.foil,
          quantity: 2,
          mana_value: from.mana_value,
          colors: from.colors,
          card_type: from.card_type,
          color_identity: from.color_identity,
          board: 'considering',
        },
      },
    ]);
    expect(plan.entry).toEqual(ownedEntry({ ...copy, board: 'considering' }));
  });

  it('leaves no pending copies behind when a single pending copy is replaced', () => {
    const from = pendingCard(forest);
    const copy = deckCard(forest);

    const plan = planEntryEdit(deck, pendingEntry(from), { kind: 'swapEdition', target: { kind: 'owned', copy } });

    expect(plan.steps).toEqual([
      { kind: 'putCardOnBoard', deckId: 'deck-1', cardId: copy.id, board: 'main' },
      { kind: 'removePending', deckId: 'deck-1', pendingId: from.id },
    ]);
  });
});

describe('swap edition to a printing', () => {
  it('turns an owned entry pending in that printing, keeping the board and finish', () => {
    const from = deckCard(grizzlyBears, { board: 'sideboard', foil: true });
    const printing = { ...grizzlyBears, id: 'beta-bears', set: '2ed', finishes: ['nonfoil', 'foil'] };

    const plan = planEntryEdit(deck, ownedEntry(from), { kind: 'swapEdition', target: { kind: 'printing', printing } });

    expect(plan.steps).toEqual([
      {
        kind: 'addPending',
        deckId: 'deck-1',
        card: expect.objectContaining({
          name: 'Grizzly Bears',
          scryfall_id: 'beta-bears',
          set_code: '2ed',
          foil: true,
          quantity: 1,
          board: 'sideboard',
        }),
      },
      { kind: 'removeCard', deckId: 'deck-1', cardId: from.id },
    ]);
    expect(plan.affected).toBe(1);
    expect(plan.entry).toEqual(addedPendingId(0));
  });

  it('gives the commander slot to the pending card the swap adds', () => {
    const from = deckCard(serraAngel, { board: 'main' });

    const plan = planEntryEdit({ ...deck, partner_id: from.id }, ownedEntry(from), {
      kind: 'swapEdition',
      target: { kind: 'printing', printing: serraAngel },
    });

    expect(plan.steps.map((step) => step.kind)).toEqual(['addPending', 'patchDeck', 'removeCard']);
    expect(plan.steps[1]).toEqual({
      kind: 'patchDeck',
      deckId: 'deck-1',
      changes: { partner_pending_id: addedPendingId(0) },
    });
  });

  it('keeps a pending entry pending in that printing with its board, quantity and commander slot', () => {
    const from = pendingCard(forest, { board: 'considering', quantity: 4 });
    const printing = { ...forest, id: 'other-forest', set: 'unf' };

    const plan = planEntryEdit({ ...deck, commander_pending_id: from.id }, pendingEntry(from), {
      kind: 'swapEdition',
      target: { kind: 'printing', printing },
    });

    expect(plan.steps).toEqual([
      {
        kind: 'addPending',
        deckId: 'deck-1',
        card: expect.objectContaining({ scryfall_id: 'other-forest', quantity: 4, board: 'considering' }),
      },
      { kind: 'patchDeck', deckId: 'deck-1', changes: { commander_pending_id: addedPendingId(0) } },
      { kind: 'removePending', deckId: 'deck-1', pendingId: from.id },
    ]);
    expect(plan.affected).toBe(4);
    expect(plan.entry).toEqual(addedPendingId(0));
  });
});

describe('running an edition swap', () => {
  function swap(deckChanges: Partial<PlanDeck>, source: DeckEntry, target: SwapTarget, api = fakeDeckApi()) {
    const plan = planEntryEdit({ ...deck, ...deckChanges }, source, { kind: 'swapEdition', target });
    return { api, result: runPlan(plan, api.port, api.invalidate) };
  }

  it('moves the owned copy in, patches the slot, removes the source, then adds the remaining pending copies', async () => {
    const from = pendingCard(forest, { quantity: 2 });
    const copy = deckCard(forest);

    const { api, result } = swap({ commander_pending_id: from.id }, pendingEntry(from), { kind: 'owned', copy });

    expect(await result).toMatchObject({ entry: ownedEntry({ ...copy, board: 'main' }) });
    expect(api.calls.map((call) => call.kind)).toEqual(['putCardOnBoard', 'patchDeck', 'removePending', 'addPending']);
    expect(api.invalidations).toEqual([{ collection: false }]);
  });

  it('adds the printing, hands its pending id to the commander slot, removes the source and returns the added entry', async () => {
    const from = deckCard(serraAngel);

    const { api, result } = swap(
      { commander_id: from.id },
      ownedEntry(from),
      { kind: 'printing', printing: serraAngel },
      fakeDeckApi({ nextPendingId: 321 }),
    );

    const { entry } = await result;
    expect(api.calls).toEqual([
      expect.objectContaining({ kind: 'addPending' }),
      { kind: 'patchDeck', deckId: 'deck-1', changes: { commander_pending_id: 321 } },
      { kind: 'removeCard', deckId: 'deck-1', cardId: from.id },
    ]);
    expect(entry).toMatchObject({ kind: 'pending', key: 'pending-321', pending: { id: 321, name: 'Serra Angel' } });
  });

  it('stops at a failed step and surfaces its error', async () => {
    const from = deckCard(serraAngel);

    const { api, result } = swap(
      { commander_id: from.id },
      ownedEntry(from),
      { kind: 'printing', printing: serraAngel },
      fakeDeckApi({ failOn: 'patchDeck' }),
    );

    await expect(result).rejects.toThrow('patchDeck failed');
    expect(api.calls.map((call) => call.kind)).toEqual(['addPending', 'patchDeck']);
  });
});
