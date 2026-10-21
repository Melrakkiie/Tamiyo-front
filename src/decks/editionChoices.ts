import type { Card } from '../api/types';
import type { ScryfallCard } from '../scryfall/client';
import { matchesEdition } from '../scryfall/printing';
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

export function editionChoices({
  source,
  copies,
  printings,
  deckCardIds,
  isLocked,
  showLocked,
  query,
}: EditionChoicesInput): EditionChoices {
  const sourceIds = new Set(source.kind === 'owned' ? source.copy_ids : []);
  const available = copies.filter((copy) => !sourceIds.has(copy.id) && !deckCardIds.has(copy.id));
  const offered = showLocked ? available : available.filter((copy) => !isLocked(copy.storage_id));
  const offeredPrintings = new Set(offered.map((copy) => copy.scryfall_id));
  const others = printings.filter(
    (printing) => printing.id !== source.scryfall_id && !offeredPrintings.has(printing.id),
  );
  const setNames = new Map(printings.map((printing) => [printing.id, printing.set_name]));
  const shown = offered.filter((copy) => matchesEdition(query, setNames.get(copy.scryfall_id), copy.set_code));
  return { offered, copies: shown, others, hiddenLocked: available.length - offered.length };
}
