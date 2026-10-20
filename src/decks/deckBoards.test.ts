import { describe, expect, it } from 'vitest';
import type { Card } from '../api/types';
import { forest, grizzlyBears, serraAngel, solRing, tarmogoyf } from '../scryfall/fixtures';
import { boardsInput, copies, deckCard } from './boardTestHelpers';
import { buildDeckBoards } from './deckBoards';

function names(cards: Card[]) {
  return cards.map((card) => card.name);
}

describe('buildDeckBoards boards', () => {
  it('splits the cards into main, sideboard and considering', () => {
    const cards = [
      deckCard(grizzlyBears),
      deckCard(solRing, { board: 'sideboard' }),
      deckCard(serraAngel, { board: 'considering' }),
      deckCard(forest),
      deckCard(tarmogoyf, { board: 'sideboard' }),
    ];
    const boards = buildDeckBoards(boardsInput(cards, [grizzlyBears, solRing, serraAngel, forest, tarmogoyf]));
    expect(names(boards.main.stacks)).toEqual(['Forest', 'Grizzly Bears']);
    expect(names(boards.sideboard.stacks)).toEqual(['Sol Ring', 'Tarmogoyf']);
    expect(names(boards.considering.stacks)).toEqual(['Serra Angel']);
  });

  it('counts the copies of each board', () => {
    const cards = [...copies(3, forest), deckCard(solRing, { board: 'sideboard', quantity: 2 })];
    const boards = buildDeckBoards(boardsInput(cards, [forest, solRing]));
    expect([boards.main.count, boards.sideboard.count, boards.considering.count]).toEqual([3, 2, 0]);
  });
});
