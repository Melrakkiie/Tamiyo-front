import type { DeckBoard } from '../api/types';
import { useMoveDeckCards, useMovePendingCard } from './api';
import type { DeckEntry } from './deckEntries';
import { entryBoardMove } from './entryBoardMove';

export function useMoveEntry(deckId: string) {
  const owned = useMoveDeckCards();
  const pending = useMovePendingCard();

  async function move(entry: DeckEntry, board: DeckBoard): Promise<number> {
    const description = entryBoardMove(entry, deckId, board);
    if (description.kind === 'owned') {
      await owned.mutateAsync(description.variables);
    } else {
      await pending.mutateAsync(description.variables);
    }
    return description.count;
  }

  return {
    move,
    isPending: owned.isPending || pending.isPending,
    error: owned.error ?? pending.error,
  };
}
