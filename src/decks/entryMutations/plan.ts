import type { DeckEntry } from '../deckEntries';
import type { Plan, PlanDeck } from './requests';
import { planRemoveCopies, type RemoveCopies } from './removeCopies';
import { planSwitchFinish, type SwitchFinish } from './switchFinish';
import { planSwitchProxy, type SwitchProxy } from './switchProxy';

export type { PlanDeck } from './requests';

// What the person asks of an entry. Each intent has its own planner file.
export type EntryIntent = RemoveCopies | SwitchFinish | SwitchProxy;

export function planEntryEdit(deck: PlanDeck, entry: DeckEntry, intent: EntryIntent): Plan {
  switch (intent.kind) {
    case 'removeCopies':
      return planRemoveCopies(deck, entry, intent);
    case 'switchFinish':
      return planSwitchFinish(deck, entry, intent);
    case 'switchProxy':
      return planSwitchProxy(deck, entry, intent);
  }
}
