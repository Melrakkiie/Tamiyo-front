import type { ScryfallCard } from './client';
import { matchesScryfallQuery, parseScryfallQuery, type QueryNode } from './query';

export interface Case {
  search: string;
  card: ScryfallCard;
  matches: boolean;
}

export function parsedQuery(search: string): QueryNode | null {
  const parsed = parseScryfallQuery(search);
  if (parsed.error !== null) {
    throw new Error(`« ${search} » failed to parse: ${parsed.error}`);
  }
  return parsed.node;
}

export function matches(search: string, card: ScryfallCard, name = card.name) {
  return matchesScryfallQuery(parsedQuery(search), card, name);
}

export function cases(rows: [string, ScryfallCard, boolean][]): Case[] {
  return rows.map(([search, card, expected]) => ({ search, card, matches: expected }));
}
