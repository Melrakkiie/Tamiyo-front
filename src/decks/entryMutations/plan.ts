import type { DeckEntry } from '../deckEntries';
import type { Plan, PlanDeck } from './requests';
import { type MoveToBoard, planMoveToBoard } from './moveToBoard';
import { planRemoveCopies, type RemoveCopies } from './removeCopies';

export type { PlanDeck } from './requests';

// What the person asks of an entry. Each intent has its own planner file.
export type EntryIntent = RemoveCopies | MoveToBoard;

export function planEntryEdit(deck: PlanDeck, entry: DeckEntry, intent: EntryIntent): Plan {
  switch (intent.kind) {
    case 'removeCopies':
      return planRemoveCopies(deck, entry, intent);
    case 'moveToBoard':
      return planMoveToBoard(deck, entry, intent);
  }
}
