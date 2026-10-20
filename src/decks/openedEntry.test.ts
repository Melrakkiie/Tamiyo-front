import { describe, expect, it } from 'vitest';
import type { DeckCard, PendingCard } from '../api/types';
import { forest, grizzlyBears, solRing } from '../scryfall/fixtures';
import type { ScryfallCard } from '../scryfall/client';
import { boardsInput, copies, deckCard } from './boardTestHelpers';
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
});
