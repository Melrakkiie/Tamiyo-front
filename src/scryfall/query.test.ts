import { describe, expect, it } from 'vitest';
import type { ScryfallCard } from './client';
import {
  alrundGodOfTheCosmos,
  commitMemory,
  delverOfSecrets,
  esperSentinel,
  forest,
  grizzlyBears,
  solRing,
  sproutingThrinax,
  westvaleAbbey,
} from './fixtures';
import { matchesScryfallQuery, parseScryfallQuery } from './query';

interface Case {
  search: string;
  card: ScryfallCard;
  matches: boolean;
}

function matches(search: string, card: ScryfallCard) {
  const parsed = parseScryfallQuery(search);
  if (parsed.error !== null) {
    throw new Error(`« ${search} » failed to parse: ${parsed.error}`);
  }
  return matchesScryfallQuery(parsed.node, card, card.name);
}

function cases(rows: [string, ScryfallCard, boolean][]): Case[] {
  return rows.map(([search, card, expected]) => ({ search, card, matches: expected }));
}

const abbeyTypedOnFacesOnly: ScryfallCard = {
  ...westvaleAbbey,
  name: 'Westvale Abbey (faces only)',
  type_line: undefined,
};

describe('type', () => {
  it.each(
    cases([
      ['t:creature', grizzlyBears, true],
      ['t:creature', esperSentinel, true],
      ['t:creature', solRing, false],
      ['t:creature', forest, false],
      ['t:artifact', esperSentinel, true],
      ['t:artifact', solRing, true],
      ['t:artifact', grizzlyBears, false],
      ['type:creature', grizzlyBears, true],
      ['t=creature', grizzlyBears, true],
      ['t:CREATURE', grizzlyBears, true],
      ['t:bear', grizzlyBears, true],
      ['t:crea', grizzlyBears, true],
      ['t:land', forest, true],
      ['t:forest', forest, true],
      ['t:basic', forest, true],
      ['t:"basic land"', forest, true],
      ['t:"basic land"', westvaleAbbey, false],
      ['t:creature', alrundGodOfTheCosmos, true],
      ['t:bird', alrundGodOfTheCosmos, true],
      ['t:land', westvaleAbbey, true],
      ['t:creature', westvaleAbbey, true],
      ['t:demon', westvaleAbbey, true],
      ['t:legendary', westvaleAbbey, true],
      ['t:land', abbeyTypedOnFacesOnly, true],
      ['t:demon', abbeyTypedOnFacesOnly, true],
      ['t:artifact', abbeyTypedOnFacesOnly, false],
      ['t:insect', delverOfSecrets, true],
      ['t:instant', commitMemory, true],
      ['t:sorcery', commitMemory, true],
      ['t:creature', commitMemory, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});

describe('colors', () => {
  it.each(
    cases([
      ['c=g', grizzlyBears, true],
      ['c=g', sproutingThrinax, false],
      ['c=g', solRing, false],
      ['c=brg', sproutingThrinax, true],
      ['c=gbr', sproutingThrinax, true],
      ['c=jund', sproutingThrinax, true],
      ['c=br', sproutingThrinax, false],
      ['c>=g', grizzlyBears, true],
      ['c>=g', sproutingThrinax, true],
      ['c>=g', solRing, false],
      ['c>=br', sproutingThrinax, true],
      ['c>=br', grizzlyBears, false],
      ['c:g', sproutingThrinax, true],
      ['color:green', grizzlyBears, true],
      ['c<=g', grizzlyBears, true],
      ['c<=g', solRing, true],
      ['c<=g', sproutingThrinax, false],
      ['c<=brg', sproutingThrinax, true],
      ['c<=brg', grizzlyBears, true],
      ['c<=brg', esperSentinel, false],
      ['c=u', delverOfSecrets, true],
      ['c=u', alrundGodOfTheCosmos, true],
      ['c=b', westvaleAbbey, true],
      ['c=u', commitMemory, true],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});

describe('colorless', () => {
  it.each(
    cases([
      ['c=c', solRing, true],
      ['c=c', forest, true],
      ['c:c', solRing, true],
      ['c:colorless', solRing, true],
      ['c=c', grizzlyBears, false],
      ['c:c', esperSentinel, false],
      ['c=c', westvaleAbbey, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});
