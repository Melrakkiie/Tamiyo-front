import { type DeckEntry, entrySources } from '../deckEntries';
import type { Plan, PlanDeck } from './requests';

export interface SwitchFinish {
  kind: 'switchFinish';
  foil: boolean;
}

// Every copy of the entry switches; the API swaps owned copies for copies in the other finish (ADR-0005).
export function planSwitchFinish(deck: PlanDeck, entry: DeckEntry, { foil }: SwitchFinish): Plan {
  return {
    steps: [{ kind: 'switchFinish', deckId: deck.id, foil, ...entrySources(entry) }],
    affected: entry.quantity,
    entry: { ...entry, foil },
  };
}
