import { describe, expect, it } from 'vitest';

import { grizzlyBears } from '../../scryfall/fixtures';
import { copies, pendingCard } from '../boardTestHelpers';
import { type DeckEntry, ownedEntry, pendingEntry } from '../deckEntries';
import type { PlanDeck } from './requests';
import { planPutBackFromHistory, planRemoveFromHistory } from './undoHistory';

const deck: PlanDeck = { id: 'deck-1', commander_id: null, partner_id: null };
const otherPrinting = { ...grizzlyBears, set: 'xyz', collector_number: '9' };

function owned(count: number, printing = grizzlyBears, changes = {}): { ids: number[]; entry: DeckEntry } {
  const cards = copies(count, printing, changes);
  const ids = cards.map((card) => card.id);
  return { ids, entry: ownedEntry({ ...cards[0], copy_ids: ids, quantity: count }) };
}

const annotated = {
  name: 'Grizzly Bears',
  set_code: grizzlyBears.set,
  collector_number: grizzlyBears.collector_number,
  foil: false,
};

describe('plan removing an addition of the history', () => {
  it('takes the copies of the annotated entry first', () => {
    const other = owned(2, otherPrinting);
    const mine = owned(3);

    const plan = planRemoveFromHistory(deck, [other.entry, mine.entry], 'main', annotated, 2);

    expect(plan.steps).toEqual([{ kind: 'removeCopies', deckId: 'deck-1', cardIds: mine.ids.slice(1) }]);
    expect(plan.affected).toBe(2);
  });

  it('falls back to the other entries of that name when the annotated one runs short', () => {
    const other = owned(2, otherPrinting);
    const mine = owned(1);

    const plan = planRemoveFromHistory(deck, [other.entry, mine.entry], 'main', annotated, 3);

    expect(plan.steps).toEqual([
      { kind: 'removeCard', deckId: 'deck-1', cardId: mine.ids[0] },
      { kind: 'removeCopies', deckId: 'deck-1', cardIds: other.ids },
    ]);
    expect(plan.affected).toBe(3);
  });

  it('works on the other entries when the annotated one is gone', () => {
    const other = owned(2, otherPrinting);

    const plan = planRemoveFromHistory(deck, [other.entry], 'main', annotated, 1);

    expect(plan.steps).toEqual([{ kind: 'removeCard', deckId: 'deck-1', cardId: other.ids[1] }]);
  });

  it('matches the finish too', () => {
    const plain = owned(1);
    const foil = owned(1, grizzlyBears, { foil: true });

    const plan = planRemoveFromHistory(deck, [plain.entry, foil.entry], 'main', { ...annotated, foil: true }, 1);

    expect(plan.steps).toEqual([{ kind: 'removeCard', deckId: 'deck-1', cardId: foil.ids[0] }]);
  });

  it('works by name when the line has no printing, ignoring other names and boards', () => {
    const mine = owned(2);
    const side = owned(2, grizzlyBears, { board: 'sideboard' });
    const pending = pendingEntry(pendingCard({ ...grizzlyBears, name: 'Other' }, { id: 70 }));

    const plan = planRemoveFromHistory(deck, [side.entry, pending, mine.entry], 'main', { name: 'Grizzly Bears' }, 2);

    expect(plan.steps).toEqual([{ kind: 'removeCopies', deckId: 'deck-1', cardIds: mine.ids }]);
  });

  it('deletes or lowers pending cards like the usual removal', () => {
    const pending = pendingEntry(pendingCard(grizzlyBears, { id: 71, quantity: 3 }));

    const plan = planRemoveFromHistory(deck, [pending], 'main', annotated, 2);

    expect(plan.steps).toEqual([{ kind: 'setPendingQuantity', deckId: 'deck-1', pendingId: 71, quantity: 1 }]);
  });

  it('clears the commander slot before removing its only copy', () => {
    const { ids, entry } = owned(1);

    const plan = planRemoveFromHistory({ ...deck, commander_id: ids[0] }, [entry], 'main', annotated, 1);

    expect(plan.steps).toEqual([
      { kind: 'patchDeck', deckId: 'deck-1', changes: { clear_commander_id: true } },
      { kind: 'removeCard', deckId: 'deck-1', cardId: ids[0] },
    ]);
  });
});

describe('plan putting a removal back', () => {
  it('imports one line with the annotated printing, finish, count and board', () => {
    const plan = planPutBackFromHistory(deck, 'sideboard', { ...annotated, foil: true }, 2);

    expect(plan.steps).toEqual([
      {
        kind: 'importDeckLine',
        deckId: 'deck-1',
        card: {
          name: 'Grizzly Bears',
          set_code: grizzlyBears.set,
          collector_number: grizzlyBears.collector_number,
          foil: true,
        },
        count: 2,
        board: 'sideboard',
      },
    ]);
    expect(plan.affected).toBe(2);
  });

  it('plans nothing when the printing is unknown', () => {
    expect(planPutBackFromHistory(deck, 'main', { name: 'Grizzly Bears' }, 1).steps).toEqual([]);
  });
});
