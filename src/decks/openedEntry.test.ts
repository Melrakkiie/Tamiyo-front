import { describe, expect, it } from 'vitest';
import type { DeckCard, PendingCard } from '../api/types';
import { forest, grizzlyBears, solRing } from '../scryfall/fixtures';
import type { ScryfallCard } from '../scryfall/client';
import { boardsInput, copies, deckCard, pendingCard } from './boardTestHelpers';
import { buildDeckBoards } from './boardLayout';
import { type DeckEntry } from './deckEntries';
import { closedEntry, openEntry, resolveOpenedEntry } from './openedEntry';

const printings: ScryfallCard[] = [forest, grizzlyBears, solRing];

function boardsOf(cards: DeckCard[], pending: PendingCard[] = []) {
  return buildDeckBoards(boardsInput(cards, printings, { pending }));
}

function stackOf(cards: DeckCard[], pending: PendingCard[], name: string): DeckEntry {
  const stack = boardsOf(cards, pending).main.stacks.find((entry) => entry.name === name);
  if (!stack) {
    throw new Error(`no stack for ${name}`);
  }
  return stack;
}

describe('resolveOpenedEntry', () => {
  it('finds an owned entry again after its copy ids change', () => {
    const [first, second] = copies(2, grizzlyBears);
    const opened = openEntry(closedEntry, stackOf([first, second, deckCard(forest)], [], 'Grizzly Bears'));
    const swapped = deckCard(grizzlyBears);

    const live = resolveOpenedEntry(opened, boardsOf([second, swapped, deckCard(forest)]));

    expect(live?.kind).toBe('owned');
    expect(live?.kind === 'owned' && live.copy_ids).toEqual([second.id, swapped.id]);
  });

  it('finds an owned entry after a board move', () => {
    const bears = copies(2, grizzlyBears);
    const opened = openEntry(closedEntry, stackOf(bears, [], 'Grizzly Bears'));

    const live = resolveOpenedEntry(opened, boardsOf(bears.map((card) => ({ ...card, board: 'sideboard' }))));

    expect(live?.board).toBe('sideboard');
    expect(live?.quantity).toBe(2);
  });

  it('finds a pending entry by id after its quantity changes', () => {
    const lands = pendingCard(forest, { quantity: 3 });
    const opened = openEntry(closedEntry, stackOf([], [lands], 'Forest'));

    const live = resolveOpenedEntry(opened, boardsOf([deckCard(forest)], [{ ...lands, quantity: 150 }]));

    expect(live?.kind === 'pending' && live.pending.id).toBe(lands.id);
    expect(live?.quantity).toBe(150);
  });

  it('resolves a vanished entry to nothing', () => {
    const bears = deckCard(grizzlyBears);
    const lands = pendingCard(forest);
    const boards = boardsOf([bears], [lands]);
    const others = boardsOf([deckCard(grizzlyBears)], [pendingCard(forest)]);

    expect(resolveOpenedEntry(openEntry(closedEntry, stackOf([bears], [], 'Grizzly Bears')), others)).toBeNull();
    expect(resolveOpenedEntry(openEntry(closedEntry, stackOf([], [lands], 'Forest')), others)).toBeNull();
    expect(resolveOpenedEntry(closedEntry, boards)).toBeNull();
  });
});
