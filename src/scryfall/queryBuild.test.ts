import { describe, expect, it } from 'vitest';
import type { ScryfallCard } from './client';
import { alrundGodOfTheCosmos, forest, grizzlyBears, westvaleAbbey } from './fixtures';
import { allOf, matchesScryfallQuery, parseScryfallQuery, term } from './query';

function parsed(search: string) {
  const result = parseScryfallQuery(search);
  if (result.error !== null) {
    throw new Error(result.error);
  }
  return result.node;
}

describe('allOf', () => {
  it('gives nothing for no nodes', () => {
    expect(allOf([])).toBeNull();
  });

  it('gives the node itself for a single one', () => {
    const node = parsed('t:creature');
    expect(allOf([node!])).toBe(node);
  });

  it('requires every node to match', () => {
    const node = allOf([parsed('t:creature')!, parsed('c:g')!]);
    expect(matchesScryfallQuery(node, grizzlyBears, grizzlyBears.name)).toBe(true);
    expect(matchesScryfallQuery(node, westvaleAbbey, westvaleAbbey.name)).toBe(false);
  });
});

describe('subtype term', () => {
  const cases: [string, ScryfallCard, boolean][] = [
    ['bear', grizzlyBears, true],
    ['BEAR', grizzlyBears, true],
    ['creature', grizzlyBears, false],
    ['bird', alrundGodOfTheCosmos, true],
    ['god', alrundGodOfTheCosmos, true],
    ['demon', westvaleAbbey, true],
    ['land', westvaleAbbey, false],
    ['forest', forest, true],
    ['basic', forest, false],
  ];
  it.each(cases)('subtype %s on %s gives %s', (text, card, expected) => {
    expect(matchesScryfallQuery(term('subtype', '=', text), card, card.name)).toBe(expected);
  });
});
