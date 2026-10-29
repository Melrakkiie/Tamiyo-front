import type { DeckBoard } from '../api/types';
import type { DeckEntry } from './deckEntries';
import type { HistoryChange } from './history';

/** What a history menu action may do: at most `max` copies, or why it is disabled. */
export interface HistoryAction {
  max: number;
  disabledReason?: string;
}

/** "Retirer": up to the line's count, within the copies of that name still on the board. */
export function retireAction(
  change: Pick<HistoryChange, 'name' | 'count'>,
  board: DeckBoard,
  entries: DeckEntry[],
): HistoryAction {
  const left = entries
    .filter((entry) => entry.board === board && entry.name === change.name)
    .reduce((sum, entry) => sum + entry.quantity, 0);
  const max = Math.min(change.count, left);
  return max > 0 ? { max } : { max, disabledReason: 'Il ne reste aucun exemplaire de cette carte dans cette section.' };
}
