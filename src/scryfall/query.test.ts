import { describe, expect, it } from 'vitest';
import type { ScryfallCard } from './client';
import { grizzlyBears } from './fixtures';
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

describe('type', () => {
  it.each(
    cases([
      ['t:creature', grizzlyBears, true],
      ['t:artifact', grizzlyBears, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});
