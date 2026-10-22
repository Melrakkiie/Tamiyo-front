import { type DeckEntry, entrySources } from '../deckEntries';
import type { Plan, PlanDeck } from './requests';

export interface SwitchProxy {
  kind: 'switchProxy';
  proxy: boolean;
}

export function planSwitchProxy(deck: PlanDeck, entry: DeckEntry, { proxy }: SwitchProxy): Plan {
  return {
    steps: [{ kind: 'switchProxy', deckId: deck.id, proxy, ...entrySources(entry) }],
    affected: entry.quantity,
    entry: { ...entry, proxy },
  };
}
