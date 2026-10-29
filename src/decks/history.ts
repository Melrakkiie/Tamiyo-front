import type { DeckHistory } from '../api/types';

export type HistoryFilter = 'all' | 'additions' | 'removals';

export type HistoryDay = DeckHistory['days'][number];

export type HistoryChange = HistoryDay['boards'][number]['changes'][number];

const keeps: Record<HistoryFilter, (count: number) => boolean> = {
  all: () => true,
  additions: (count) => count > 0,
  removals: (count) => count < 0,
};

/** Only the changes matching the filter; boards and days left empty are dropped. */
export function filterHistory(history: DeckHistory, filter: HistoryFilter): HistoryDay[] {
  const keep = keeps[filter];
  return history.days
    .map((day) => ({
      ...day,
      boards: day.boards
        .map((board) => ({ ...board, changes: board.changes.filter((change) => keep(change.count)) }))
        .filter((board) => board.changes.length > 0),
    }))
    .filter((day) => day.boards.length > 0);
}
