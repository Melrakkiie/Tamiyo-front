import type { DeckEntry } from '../deckEntries';
import type { Plan, PlanDeck } from './requests';
import { type AddToCollection, planAddToCollection } from './addToCollection';
import { planRemoveCopies, type RemoveCopies } from './removeCopies';
import { planSetQuantity, type SetQuantity } from './setQuantity';
import { planSwapEdition, type SwapEdition } from './swapEdition';
import { planSwitchFinish, type SwitchFinish } from './switchFinish';
import { planSwitchProxy, type SwitchProxy } from './switchProxy';

export type { PlanDeck } from './requests';

// What the person asks of an entry. Each intent has its own planner file.
export type EntryIntent = RemoveCopies | SetQuantity | SwapEdition | SwitchFinish | SwitchProxy | AddToCollection;

export function planEntryEdit(deck: PlanDeck, entry: DeckEntry, intent: EntryIntent): Plan {
  switch (intent.kind) {
    case 'removeCopies':
      return planRemoveCopies(deck, entry, intent);
    case 'setQuantity':
      return planSetQuantity(deck, entry, intent);
    case 'swapEdition':
      return planSwapEdition(deck, entry, intent);
    case 'switchFinish':
      return planSwitchFinish(deck, entry, intent);
    case 'switchProxy':
      return planSwitchProxy(deck, entry, intent);
    case 'addToCollection':
      return planAddToCollection(deck, entry, intent);
  }
}
