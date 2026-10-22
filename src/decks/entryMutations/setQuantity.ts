import type { DeckEntry } from '../deckEntries';
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
  return addCopies(deck, entry, intent.quantity - entry.quantity);
}
