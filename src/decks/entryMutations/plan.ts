import type { DeckEntry } from '../deckEntries';
import type { Plan, PlanDeck } from './requests';
import { type AddCopies, planAddCopies } from './addCopies';
import { type AddToCollection, planAddToCollection } from './addToCollection';
import { type MoveToBoard, planMoveToBoard } from './moveToBoard';
import { planRemoveCopies, type RemoveCopies } from './removeCopies';
import { planSetQuantity, type SetQuantity } from './setQuantity';
import { planSwapEdition, type SwapEdition } from './swapEdition';
import { planSwitchFinish, type SwitchFinish } from './switchFinish';
import { planSwitchProxy, type SwitchProxy } from './switchProxy';

export type EntryIntent =
  AddCopies | RemoveCopies | SetQuantity | MoveToBoard | SwapEdition | SwitchFinish | SwitchProxy | AddToCollection;

export function planEntryEdit(deck: PlanDeck, entry: DeckEntry, intent: EntryIntent): Plan {
  switch (intent.kind) {
    case 'addCopies':
      return planAddCopies(deck, entry, intent);
    case 'removeCopies':
      return planRemoveCopies(deck, entry, intent);
    case 'setQuantity':
      return planSetQuantity(deck, entry, intent);
    case 'moveToBoard':
      return planMoveToBoard(deck, entry, intent);
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
