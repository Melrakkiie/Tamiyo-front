import { describe, expect, it } from 'vitest';

import { mainBoardScryfallIds } from './tokenSources';

describe('mainBoardScryfallIds', () => {
  it('keeps each main-board card once and leaves the other boards out', () => {
    const entries = [
      { board: 'main' as const, scryfall_id: 'a' },
      { board: 'sideboard' as const, scryfall_id: 'b' },
      { board: 'main' as const, scryfall_id: 'a' },
      { board: 'considering' as const, scryfall_id: 'c' },
      { board: 'main' as const, scryfall_id: 'd' },
    ];

    expect(mainBoardScryfallIds(entries)).toEqual(['a', 'd']);
  });

  it('is empty for an empty deck', () => {
    expect(mainBoardScryfallIds([])).toEqual([]);
  });
});
