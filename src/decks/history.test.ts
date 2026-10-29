import { describe, expect, it } from 'vitest';

import type { DeckHistory } from '../api/types';
import { filterHistory } from './history';

const history: DeckHistory = {
  days: [
    {
      date: '2026-10-02',
      boards: [
        { board: 'main', changes: [{ name: 'Island', count: 2 }] },
        { board: 'sideboard', changes: [{ name: 'Negate', count: -1 }] },
      ],
    },
    {
      date: '2026-10-01',
      boards: [{ board: 'main', changes: [{ name: 'Forest', count: 3 }] }],
    },
  ],
};

describe('filterHistory', () => {
  it('keeps everything for "all"', () => {
    expect(filterHistory(history, 'all')).toEqual(history.days);
  });

  it('keeps additions only, dropping the boards and days left empty', () => {
    expect(filterHistory(history, 'additions')).toEqual([
      { date: '2026-10-02', boards: [{ board: 'main', changes: [{ name: 'Island', count: 2 }] }] },
      { date: '2026-10-01', boards: [{ board: 'main', changes: [{ name: 'Forest', count: 3 }] }] },
    ]);
  });

  it('keeps removals only, dropping the boards and days left empty', () => {
    expect(filterHistory(history, 'removals')).toEqual([
      { date: '2026-10-02', boards: [{ board: 'sideboard', changes: [{ name: 'Negate', count: -1 }] }] },
    ]);
  });
});
