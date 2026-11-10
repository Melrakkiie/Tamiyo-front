import { describe, expect, it } from 'vitest';

import type { ScryfallCard } from './client';
import { grizzlyBears, serraAngel } from './fixtures';
import { deriveTokens, tokenPartIds } from './tokens';

const listing = (card: ScryfallCard, ...ids: string[]): ScryfallCard => ({
  ...card,
  all_parts: ids.map((id) => ({ id, component: 'token', name: id })),
});
const token = (id: string, name: string, oracleId?: string): ScryfallCard => ({
  ...grizzlyBears,
  id,
  name,
  oracle_id: oracleId,
});

describe('deriveTokens', () => {
  it('gives each token the sorted names of the cards listing it', () => {
    const cards = [listing(serraAngel, 'soldier'), listing(grizzlyBears, 'soldier')];

    expect(deriveTokens(cards, [token('soldier', 'Soldier')])).toEqual([
      { id: 'soldier', name: 'Soldier', relatedCards: ['Grizzly Bears', 'Serra Angel'] },
    ]);
  });

  it('merges printings of one token, keeping the first and the union of related cards', () => {
    const cards = [listing(serraAngel, 'soldier-a'), listing(grizzlyBears, 'soldier-b')];
    const parts = [token('soldier-a', 'Soldier', 'o1'), token('soldier-b', 'Soldier', 'o1')];

    expect(deriveTokens(cards, parts)).toEqual([
      { id: 'soldier-a', name: 'Soldier', relatedCards: ['Grizzly Bears', 'Serra Angel'] },
    ]);
  });

  it('falls back to the id when a token has no oracle_id', () => {
    const cards = [listing(serraAngel, 'a', 'b')];

    expect(deriveTokens(cards, [token('a', 'Soldier'), token('b', 'Soldier')])).toHaveLength(2);
  });

  it('ignores a card listing itself as a part', () => {
    const self = listing(serraAngel, serraAngel.id, 'soldier');

    expect(deriveTokens([self], [self, token('soldier', 'Soldier')]).map((t) => t.id)).toEqual(['soldier']);
  });

  it('lists a card once when it has several copies', () => {
    const cards = [listing(serraAngel, 'soldier'), listing(serraAngel, 'soldier')];

    expect(deriveTokens(cards, [token('soldier', 'Soldier')])[0].relatedCards).toEqual(['Serra Angel']);
  });

  it('sorts by name with the French collation', () => {
    const cards = [listing(serraAngel, 'z', 'e', 'f')];
    const parts = [token('z', 'Zombie'), token('e', 'Élémental'), token('f', 'Faerie')];

    expect(deriveTokens(cards, parts).map((t) => t.name)).toEqual(['Élémental', 'Faerie', 'Zombie']);
  });

  it('gives nothing for a deck without token parts', () => {
    expect(deriveTokens([grizzlyBears, serraAngel], [])).toEqual([]);
  });
});

describe('tokenPartIds', () => {
  it('lists token parts other than the card itself, once each', () => {
    const cards = [listing(serraAngel, 'a', serraAngel.id), listing(grizzlyBears, 'a', 'b')];

    expect(tokenPartIds(cards)).toEqual(['a', 'b']);
  });
});
