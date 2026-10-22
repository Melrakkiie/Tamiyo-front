import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { deckCard, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import { planEntryEdit, type PlanDeck } from './plan';

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
