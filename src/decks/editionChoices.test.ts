import { describe, expect, it } from 'vitest';
import type { ScryfallCard } from '../scryfall/client';
import { grizzlyBears } from '../scryfall/fixtures';
import { deckCard } from './boardTestHelpers';
import { ownedEntry } from './deckEntries';
import { editionChoices, type EditionChoicesInput } from './editionChoices';

const beta: ScryfallCard = { ...grizzlyBears, id: 'beta-bears', set: '2ed', set_name: 'Limited Edition Beta' };
const tenth: ScryfallCard = { ...grizzlyBears, id: 'tenth-bears', set: '10e', set_name: 'Tenth Edition' };

function input(changes: Partial<EditionChoicesInput>): EditionChoicesInput {
  const source = deckCard(grizzlyBears);
  return {
    source: ownedEntry(source),
    copies: [source],
    printings: [grizzlyBears, beta, tenth],
    deckCardIds: new Set([source.id]),
    isLocked: () => false,
    showLocked: false,
    query: '',
    ...changes,
  };
}

describe('editionChoices', () => {
  it('does not offer the source copies nor copies already in the deck', () => {
    const [first, second] = [deckCard(grizzlyBears), deckCard(grizzlyBears)];
    const inDeck = deckCard(beta);
    const free = deckCard(tenth);
    const source = ownedEntry({ ...first, copy_ids: [first.id, second.id], quantity: 2 });

    const choices = editionChoices(
      input({ source, copies: [first, second, inDeck, free], deckCardIds: new Set([inDeck.id]) }),
    );

    expect(choices.copies.map((copy) => copy.id)).toEqual([free.id]);
  });
});
