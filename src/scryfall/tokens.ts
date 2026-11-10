import type { ScryfallCard } from './client';

export interface DeckToken {
  id: string;
  name: string;
  relatedCards: string[];
}

// Ids of the token parts the given cards list, other than the cards themselves.
export function tokenPartIds(cards: ScryfallCard[]): string[] {
  const ids = new Set<string>();
  for (const card of cards) {
    for (const part of card.all_parts ?? []) {
      if (part.component === 'token' && part.id !== card.id) {
        ids.add(part.id);
      }
    }
  }
  return [...ids];
}

// A deck's tokens: the fetched token parts, printings of one token merged (the first kept), each with
// the sorted names of the cards listing it, sorted by name.
export function deriveTokens(cards: ScryfallCard[], tokenCards: ScryfallCard[]): DeckToken[] {
  const listedBy = new Map<string, Set<string>>();
  for (const card of cards) {
    for (const part of card.all_parts ?? []) {
      if (part.component === 'token' && part.id !== card.id) {
        listedBy.set(part.id, (listedBy.get(part.id) ?? new Set()).add(card.name));
      }
    }
  }

  const byOracle = new Map<string, { token: DeckToken; related: Set<string> }>();
  for (const card of tokenCards) {
    if (!listedBy.has(card.id)) {
      continue;
    }
    const key = card.oracle_id ?? card.id;
    let entry = byOracle.get(key);
    if (!entry) {
      entry = { token: { id: card.id, name: card.name, relatedCards: [] }, related: new Set() };
      byOracle.set(key, entry);
    }
    for (const name of listedBy.get(card.id) ?? []) {
      entry.related.add(name);
    }
  }

  return [...byOracle.values()]
    .map(({ token, related }) => ({ ...token, relatedCards: [...related].sort((a, b) => a.localeCompare(b, 'fr')) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}
