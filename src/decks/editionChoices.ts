import type { Card } from '../api/types';
import type { ScryfallCard } from '../scryfall/client';
import type { DeckEntry } from './deckEntries';

export interface EditionChoicesInput {
  source: DeckEntry;
  copies: Card[];
  printings: ScryfallCard[];
  deckCardIds: ReadonlySet<number>;
  isLocked: (storageId: number | null | undefined) => boolean;
  showLocked: boolean;
  query: string;
}

export interface EditionChoices {
  offered: Card[];
  copies: Card[];
  others: ScryfallCard[];
  hiddenLocked: number;
}

export function editionChoices({ source, copies, deckCardIds }: EditionChoicesInput): EditionChoices {
  const sourceIds = new Set(source.kind === 'owned' ? source.copy_ids : []);
  const offered = copies.filter((copy) => !sourceIds.has(copy.id) && !deckCardIds.has(copy.id));
  return { offered, copies: offered, others: [], hiddenLocked: 0 };
}
