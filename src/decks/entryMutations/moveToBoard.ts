import type { DeckBoard } from '../../api/types';
import type { DeckEntry } from '../deckEntries';
import type { Plan, PlanDeck } from './requests';

export interface MoveToBoard {
  kind: 'moveToBoard';
  board: DeckBoard;
}

// Every copy of the entry changes board together.
export function planMoveToBoard(deck: PlanDeck, entry: DeckEntry, { board }: MoveToBoard): Plan {
  if (entry.kind === 'pending') {
    return {
      steps: [{ kind: 'movePending', deckId: deck.id, pendingId: entry.pending.id, board }],
      affected: entry.quantity,
      entry: { ...entry, board, pending: { ...entry.pending, board } },
    };
  }
  return {
    steps: [{ kind: 'moveCards', deckId: deck.id, cardIds: entry.copy_ids, board }],
    affected: entry.copy_ids.length,
    entry: { ...entry, board },
  };
}
