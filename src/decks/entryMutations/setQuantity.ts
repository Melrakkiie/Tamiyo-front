import type { DeckEntry } from '../deckEntries';
import { planAddCopies } from './addCopies';
import { planRemoveCopies } from './removeCopies';
import type { Plan, PlanDeck } from './requests';

export interface SetQuantity {
  kind: 'setQuantity';
  quantity: number;
}

export function planSetQuantity(deck: PlanDeck, entry: DeckEntry, intent: SetQuantity): Plan {
  const difference = Math.max(0, intent.quantity) - entry.quantity;
  if (difference > 0) {
    return planAddCopies(deck, entry, { kind: 'addCopies', count: difference });
  }
  if (difference < 0) {
    return planRemoveCopies(deck, entry, { kind: 'removeCopies', count: -difference });
  }
  return { steps: [], affected: 0, entry };
}
