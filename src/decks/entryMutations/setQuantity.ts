import type { DeckEntry } from '../deckEntries';
import { planRemoveCopies } from './removeCopies';
import type { Plan, PlanDeck } from './requests';

export interface SetQuantity {
  kind: 'setQuantity';
  quantity: number;
}

function addCopies(deck: PlanDeck, entry: DeckEntry, count: number): Plan {
  const { name, set_code, collector_number, foil } = entry;
  return {
    steps: [
      {
        kind: 'importDeckLine',
        deckId: deck.id,
        card: { name, set_code, collector_number, foil },
        count,
        board: entry.board,
      },
    ],
    affected: count,
    // The import decides whether the new copies come from the collection or stay pending.
    entry,
  };
}

export function planSetQuantity(deck: PlanDeck, entry: DeckEntry, intent: SetQuantity): Plan {
  const difference = Math.max(0, intent.quantity) - entry.quantity;
  if (difference > 0) {
    return addCopies(deck, entry, difference);
  }
  if (difference < 0) {
    return planRemoveCopies(deck, entry, { kind: 'removeCopies', count: -difference });
  }
  return { steps: [], affected: 0, entry };
}
