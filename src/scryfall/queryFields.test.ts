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
  tarmogoyf,
  westvaleAbbey,
} from './fixtures';
import { matchesScryfallQuery, parseScryfallQuery } from './query';

interface Case {
  search: string;
  card: ScryfallCard;
  matches: boolean;
}

function matches(search: string, card: ScryfallCard, name = card.name) {
  const parsed = parseScryfallQuery(search);
  if (parsed.error !== null) {
    throw new Error(`« ${search} » failed to parse: ${parsed.error}`);
  }
  return matchesScryfallQuery(parsed.node, card, name);
}

function cases(rows: [string, ScryfallCard, boolean][]): Case[] {
  return rows.map(([search, card, expected]) => ({ search, card, matches: expected }));
}

function failsToParse(rows: [string, RegExp][]) {
  it.each(rows)('%s fails with an error message', (search, message) => {
    const parsed = parseScryfallQuery(search);
    expect(parsed.node).toBeNull();
    expect(parsed.error).toMatch(message);
  });
}

describe('name', () => {
  it.each(
    cases([
      ['bears', grizzlyBears, true],
      ['BEARS', grizzlyBears, true],
      ['"grizzly bears"', grizzlyBears, true],
      ['"grizzly  bears"', grizzlyBears, false],
      ['bears', esperSentinel, false],
      ['name:sentinel', esperSentinel, true],
      ['name=sentinel', esperSentinel, true],
      ['name:sentinel', grizzlyBears, false],
      ['name!=bears', grizzlyBears, false],
      ['name!=bears', forest, true],
      ['name:hakka', alrundGodOfTheCosmos, true],
      ['name:alrund', alrundGodOfTheCosmos, true],
      ['name:memory', commitMemory, true],
      ['name:abbey', westvaleAbbey, true],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  it('matches either the instance name or the card name', () => {
    expect(matches('name:token', grizzlyBears, 'Bear Token')).toBe(true);
    expect(matches('name:grizzly', grizzlyBears, 'Bear Token')).toBe(true);
    expect(matches('name:forest', grizzlyBears, 'Bear Token')).toBe(false);
  });

  it('matches by instance name when the card is unknown', () => {
    const parsed = parseScryfallQuery('name:token');
    expect(matchesScryfallQuery(parsed.node, undefined, 'Bear Token')).toBe(true);
    expect(matchesScryfallQuery(parsed.node, undefined, 'Forest')).toBe(false);
  });

  failsToParse([
    ['name>bears', /« name » n'accepte pas « > »/],
    ['name<=bears', /« name » n'accepte pas « <= »/],
    ['name:', /attend une valeur/],
  ]);
});

describe('exact name', () => {
  it.each(
    cases([
      ['!forest', forest, true],
      ['!Forest', forest, true],
      ['!"Grizzly Bears"', grizzlyBears, true],
      ['!"grizzly bears"', grizzlyBears, true],
      ['!grizzly', grizzlyBears, false],
      ['!"Grizzly"', grizzlyBears, false],
      ['!"Grizzly Bears"', forest, false],
      ['!"Commit // Memory"', commitMemory, true],
      ['!Commit', commitMemory, false],
      ['!"Alrund, God of the Cosmos // Hakka, Whispering Raven"', alrundGodOfTheCosmos, true],
      ['!Alrund', alrundGodOfTheCosmos, false],
      ['-!forest', forest, false],
      ['-!forest', grizzlyBears, true],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  it('matches the instance name when it equals the search', () => {
    expect(matches('!"bear token"', grizzlyBears, 'Bear Token')).toBe(true);
    expect(matches('!"bear"', grizzlyBears, 'Bear Token')).toBe(false);
  });

  failsToParse([['!""', /« ! » attend un nom de carte/]]);
});

describe('oracle text', () => {
  it.each(
    cases([
      ['o:draw', esperSentinel, true],
      ['oracle:draw', esperSentinel, true],
      ['o=draw', esperSentinel, true],
      ['o:DRAW', esperSentinel, true],
      ['o:draw', grizzlyBears, false],
      ['o:"draw a card"', esperSentinel, true],
      ['o:"draw two cards"', esperSentinel, false],
      ['o:"{T}: Add"', solRing, true],
      ['o:"add {c}{c}"', solRing, true],
      ['o:"add {g}"', solRing, false],
      ['o:"~\'s power"', esperSentinel, true],
      ['o:"~ dies"', sproutingThrinax, true],
      ['o:"~ dies"', esperSentinel, false],
      ['o:saproling', sproutingThrinax, true],
      ['-o:saproling', grizzlyBears, true],
      ['o:flying', alrundGodOfTheCosmos, true],
      ['o:foretold', alrundGodOfTheCosmos, true],
      ['o:lifelink', westvaleAbbey, true],
      ['o:"add {c}"', westvaleAbbey, true],
      ['o:flying', delverOfSecrets, true],
      ['o:transform', delverOfSecrets, true],
      ['o:aftermath', commitMemory, true],
      ['o:"second from the top"', commitMemory, true],
      ['o:flying', commitMemory, false],
      ['o:flying', tarmogoyf, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  failsToParse([
    ['o>flying', /« o » n'accepte pas « > »/],
    ['oracle<=flying', /« oracle » n'accepte pas « <= »/],
    ['o:', /attend une valeur/],
  ]);
});
