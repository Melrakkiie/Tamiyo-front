import type { DeckCard } from '../api/types';
import { colorCode, faceTypes, type FaceTypes, primaryType, subtypes } from '../scryfall/classify';
import type { ScryfallCard } from '../scryfall/client';
import type { BoardCard, DeckBoardsInput } from './deckBoards';

let nextId = 1;

export function deckCard(printing: ScryfallCard, changes: Partial<DeckCard> = {}): DeckCard {
  const faceColors = printing.colors ?? printing.card_faces?.[0]?.colors ?? [];
  return {
    id: nextId++,
    name: printing.name,
    scryfall_id: printing.id,
    set_code: printing.set,
    collector_number: printing.collector_number,
    foil: false,
    proxy: false,
    storage_id: null,
    mana_value: printing.cmc ?? 0,
    colors: colorCode(faceColors),
    card_type: primaryType(printing.card_faces?.[0]?.type_line ?? printing.type_line ?? ''),
    color_identity: colorCode(printing.color_identity ?? []),
    added: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
    board: 'main',
    price: null,
    ...changes,
  };
}

export function copies(count: number, printing: ScryfallCard, changes: Partial<DeckCard> = {}): DeckCard[] {
  return Array.from({ length: count }, () => deckCard(printing, changes));
}

export function boardsInput(
  cards: BoardCard[],
  printings: ScryfallCard[],
  changes: Partial<DeckBoardsInput> = {},
): DeckBoardsInput {
  return {
    cards,
    sort: 'name',
    grouping: null,
    commanderIds: [],
    separateByStorage: false,
    faceTypes: Object.fromEntries(printings.map((printing) => [printing.id, faceTypes(printing)])) as Record<
      string,
      FaceTypes
    >,
    subtypes: Object.fromEntries(printings.map((printing) => [printing.id, subtypes(printing)])),
    storageNames: new Map(),
    tagsOf: () => [],
    ...changes,
  };
}
