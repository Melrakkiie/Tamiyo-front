import type { DeckCard, PendingCard } from '../api/types';
import { colorCode, faceTypes, type FaceTypes, primaryType, subtypes } from '../scryfall/classify';
import type { ScryfallCard } from '../scryfall/client';
import type { DeckBoardsInput } from './boardLayout';
import { deckEntries } from './deckEntries';

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
    game_changer: false,
    ...changes,
  };
}

export function copies(count: number, printing: ScryfallCard, changes: Partial<DeckCard> = {}): DeckCard[] {
  return Array.from({ length: count }, () => deckCard(printing, changes));
}

export function pendingCard(printing: ScryfallCard, changes: Partial<PendingCard> = {}): PendingCard {
  const card = deckCard(printing);
  return {
    id: nextId++,
    deck_id: 'deck',
    name: card.name,
    scryfall_id: card.scryfall_id,
    set_code: card.set_code,
    collector_number: card.collector_number,
    foil: false,
    proxy: false,
    quantity: 1,
    mana_value: card.mana_value,
    colors: card.colors,
    card_type: card.card_type,
    color_identity: card.color_identity,
    board: 'main',
    price: null,
    game_changer: false,
    added: card.added,
    owned_copies: 0,
    owned_same_printing: 0,
    ...changes,
  };
}

export function boardsInput(
  cards: DeckCard[],
  printings: ScryfallCard[],
  { pending = [], ...changes }: Partial<DeckBoardsInput> & { pending?: PendingCard[] } = {},
): DeckBoardsInput {
  return {
    entries: deckEntries(cards, pending),
    sort: 'name',
    grouping: null,
    commanders: [],
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
