import { describe, expect, it } from 'vitest';
import type { Card } from '../api/types';
import { forest, grizzlyBears, serraAngel, solRing, tarmogoyf } from '../scryfall/fixtures';
import { boardsInput, copies, deckCard, pendingCard } from './boardTestHelpers';
import { buildDeckBoards } from './deckBoards';
import { isPendingCard, pendingToCards } from './pendingCards';

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

function stackSummary(cards: Card[]) {
  return cards.map((card) => [card.name, card.quantity]);
}

describe('buildDeckBoards stacks', () => {
  it('stacks identical copies whatever their storage', () => {
    const cards = [
      ...copies(2, forest, { storage_id: 1 }),
      deckCard(forest, { storage_id: 2 }),
      deckCard(forest, { foil: true }),
      deckCard(grizzlyBears),
    ];
    const boards = buildDeckBoards(boardsInput(cards, [forest, grizzlyBears]));
    expect(stackSummary(boards.main.stacks)).toEqual([
      ['Forest', 3],
      ['Forest', 1],
      ['Grizzly Bears', 1],
    ]);
    expect(boards.main.stacks[0].copy_ids).toEqual(cards.slice(0, 3).map((card) => card.id));
  });

  it('keeps copies from different storages apart when asked', () => {
    const cards = [...copies(2, forest, { storage_id: 1 }), deckCard(forest, { storage_id: 2 })];
    const boards = buildDeckBoards(boardsInput(cards, [forest], { separateByStorage: true }));
    expect(stackSummary(boards.main.stacks)).toEqual([
      ['Forest', 2],
      ['Forest', 1],
    ]);
  });

  it('adds up entries that already carry a quantity', () => {
    const cards = [deckCard(forest, { quantity: 3 }), deckCard(forest, { quantity: 2 })];
    const boards = buildDeckBoards(boardsInput(cards, [forest]));
    expect(stackSummary(boards.main.stacks)).toEqual([['Forest', 5]]);
    expect(boards.main.count).toBe(5);
  });

  it('stacks the copies of a pending card apart from the owned ones', () => {
    const pending = pendingToCards([pendingCard(forest, { id: 4, quantity: 2 })]);
    const cards = [...copies(2, forest), ...pending, deckCard(grizzlyBears)];
    const boards = buildDeckBoards(boardsInput(cards, [forest, grizzlyBears]));
    expect(stackSummary(boards.main.stacks)).toEqual([
      ['Forest', 2],
      ['Forest', 2],
      ['Grizzly Bears', 1],
    ]);
    expect(boards.main.stacks.map(isPendingCard)).toEqual([false, true, false]);
  });
});

describe('buildDeckBoards commanders', () => {
  it('puts the commanders first, each alone in its stack', () => {
    const partner = deckCard(tarmogoyf);
    const commander = deckCard(serraAngel);
    const cards = [deckCard(forest), deckCard(serraAngel), commander, partner, deckCard(tarmogoyf)];
    const boards = buildDeckBoards(
      boardsInput(cards, [forest, serraAngel, tarmogoyf], { commanderIds: [commander.id, partner.id] }),
    );
    expect(boards.main.stacks.map((card) => card.id)).toEqual([
      commander.id,
      partner.id,
      cards[0].id,
      cards[1].id,
      cards[4].id,
    ]);
    expect(boards.main.stacks.slice(0, 2).map((card) => card.quantity)).toEqual([1, 1]);
  });

  it('puts a pending commander first', () => {
    const [commander] = pendingToCards([pendingCard(serraAngel, { id: 7, quantity: 1 })]);
    const cards = [deckCard(forest), commander];
    const boards = buildDeckBoards(boardsInput(cards, [forest, serraAngel], { commanderIds: [null, commander.id] }));
    expect(names(boards.main.stacks)).toEqual(['Serra Angel', 'Forest']);
  });
});
