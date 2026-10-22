import type { DeckEntry } from '../deckEntries';
import type { Plan, PlanDeck } from './requests';
import { planRemoveCopies, type RemoveCopies } from './removeCopies';
import { planSwapEdition, type SwapEdition } from './swapEdition';

export type { PlanDeck } from './requests';

// What the person asks of an entry. Each intent has its own planner file.
export type EntryIntent = RemoveCopies | SwapEdition;

export function planEntryEdit(deck: PlanDeck, entry: DeckEntry, intent: EntryIntent): Plan {
  switch (intent.kind) {
    case 'removeCopies':
      return planRemoveCopies(deck, entry, intent);
    case 'swapEdition':
      return planSwapEdition(deck, entry, intent);
  }
}
