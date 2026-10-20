import { describe, expect, it } from 'vitest';
import type { DeckCard, PendingCard } from '../api/types';
import { forest, grizzlyBears, solRing } from '../scryfall/fixtures';
import type { ScryfallCard } from '../scryfall/client';
import { boardsInput, copies, deckCard, pendingCard } from './boardTestHelpers';
import { buildDeckBoards } from './boardLayout';
import { BOARDS } from './boards';
import { type DeckEntry } from './deckEntries';
import {
  closedEntry,
  closeEntry,
  forgetVanishedEntry,
  openEntry,
  resolveOpenedEntry,
  showSwapResult,
} from './openedEntry';

const printings: ScryfallCard[] = [forest, grizzlyBears, solRing];

function boardsOf(cards: DeckCard[], pending: PendingCard[] = []) {
  return buildDeckBoards(boardsInput(cards, printings, { pending }));
}

function stackOf(cards: DeckCard[], pending: PendingCard[], name: string): DeckEntry {
  const boards = boardsOf(cards, pending);
  const stack = BOARDS.flatMap((board) => boards[board].stacks).find((entry) => entry.name === name);
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

describe('showSwapResult', () => {
  it('shows as owned an entry that turned from pending to owned', () => {
    const wanted = pendingCard(solRing, { board: 'sideboard' });
    const opened = openEntry(closedEntry, stackOf([], [wanted], 'Sol Ring'));
    const bought = deckCard(solRing, { board: 'sideboard' });

    const swapped = showSwapResult(opened, opened.session, { kind: 'card', card: bought, board: 'sideboard' });
    const live = resolveOpenedEntry(swapped, boardsOf([bought]));

    expect(live?.kind).toBe('owned');
    expect(live?.kind === 'owned' && live.copy_ids).toEqual([bought.id]);
    expect(swapped.opened?.entry.kind).toBe('owned');
  });

  it('follows an owned entry that turned pending', () => {
    const bears = deckCard(grizzlyBears);
    const opened = openEntry(closedEntry, stackOf([bears], [], 'Grizzly Bears'));
    const wanted = pendingCard(grizzlyBears);

    const swapped = showSwapResult(opened, opened.session, { kind: 'pending', item: wanted });
    const live = resolveOpenedEntry(swapped, boardsOf([], [wanted]));

    expect(live?.kind === 'pending' && live.pending.id).toBe(wanted.id);
  });

  it('ignores a swap result that arrives after the modal closed', () => {
    const bears = deckCard(grizzlyBears);
    const opened = openEntry(closedEntry, stackOf([bears], [], 'Grizzly Bears'));
    const closed = closeEntry(opened);

    const swapped = showSwapResult(closed, opened.session, { kind: 'pending', item: pendingCard(grizzlyBears) });

    expect(swapped.opened).toBeNull();
  });

  it('ignores a swap result from a modal closed and reopened since', () => {
    const bears = deckCard(grizzlyBears);
    const lands = deckCard(forest);
    const first = openEntry(closedEntry, stackOf([bears, lands], [], 'Grizzly Bears'));
    const reopened = openEntry(closeEntry(first), stackOf([bears, lands], [], 'Forest'));

    const swapped = showSwapResult(reopened, first.session, { kind: 'pending', item: pendingCard(grizzlyBears) });

    expect(resolveOpenedEntry(swapped, boardsOf([bears, lands]))?.name).toBe('Forest');
  });

  it('still shows a swap result when the swapped entry left the boards first', () => {
    const wanted = pendingCard(grizzlyBears);
    const opened = openEntry(closedEntry, stackOf([], [wanted], 'Grizzly Bears'));
    const bought = deckCard(grizzlyBears);
    const refreshed = boardsOf([bought]);

    const vanished = forgetVanishedEntry(opened, refreshed);
    const swapped = showSwapResult(vanished, opened.session, { kind: 'card', card: bought, board: 'main' });

    expect(vanished.opened).toBeNull();
    expect(resolveOpenedEntry(swapped, refreshed)?.kind).toBe('owned');
  });
});
