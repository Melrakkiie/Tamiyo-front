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

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' });

/** "Remettre": the line's count, unless the line predates the remembered printing. */
export function putBackAction(change: Pick<HistoryChange, 'count' | 'set_code'>, date: string): HistoryAction {
  if (change.set_code === undefined) {
    return {
      max: 0,
      disabledReason: `Impression inconnue : ce retrait du ${dateFormat.format(new Date(date))} précède l'enregistrement des impressions.`,
    };
  }
  return { max: Math.abs(change.count) };
}
