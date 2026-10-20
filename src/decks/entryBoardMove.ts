import type { DeckBoard } from '../api/types';
import type { DeckEntry } from './deckEntries';

export type EntryBoardMove =
  | { kind: 'owned'; count: number; variables: { deckId: string; cardIds: number[]; board: DeckBoard } }
  | { kind: 'pending'; count: number; variables: { deckId: string; pendingId: number; board: DeckBoard } };

export function entryBoardMove(entry: DeckEntry, deckId: string, board: DeckBoard): EntryBoardMove {
  if (entry.kind === 'pending') {
    return { kind: 'pending', count: entry.quantity, variables: { deckId, pendingId: entry.pending.id, board } };
  }
  return { kind: 'owned', count: entry.copy_ids.length, variables: { deckId, cardIds: entry.copy_ids, board } };
}
