import type { Card, DeckBoard, DeckCardSort } from '../api/types';
import type { CardGroup } from '../cards/grouping';
import type { FaceTypes } from '../scryfall/classify';
import { inBoard } from './boards';
import { sortDeckCards, stackCards } from './pendingCards';
import type { DeckCardGrouping } from './storageGrouping';

export type BoardCard = Card & { board: DeckBoard; price?: number | null };

export interface DeckBoardsInput {
  cards: BoardCard[];
  sort: DeckCardSort;
  grouping: DeckCardGrouping | null;
  commanderIds: (number | null | undefined)[];
  separateByStorage: boolean;
  faceTypes: Record<string, FaceTypes | undefined>;
  subtypes: Record<string, string[] | undefined>;
  storageNames: Map<number, string>;
  tagsOf: (card: Card) => string[];
}

export interface BackFaceEntry {
  name: string;
  quantity: number;
}

export interface BoardData {
  board: DeckBoard;
  stacks: BoardCard[];
  groups: CardGroup[] | null;
  count: number;
  backFaces: Map<string, BackFaceEntry[]>;
}

export type DeckBoardsData = Record<DeckBoard, BoardData>;

function copies(cards: Card[]) {
  return cards.reduce((total, card) => total + (card.quantity ?? 1), 0);
}

export function commanderRank(card: Card, commanderIds: DeckBoardsInput['commanderIds']): number | null {
  const ids = card.copy_ids?.length ? card.copy_ids : [card.id];
  const rank = commanderIds.findIndex((id) => id != null && ids.includes(id));
  return rank === -1 ? null : rank;
}

function commandersFirst(stacks: BoardCard[], commanderIds: DeckBoardsInput['commanderIds']) {
  const ranked = stacks.map((card) => ({ card, rank: commanderRank(card, commanderIds) }));
  const commanders = ranked
    .filter((entry): entry is { card: BoardCard; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank);
  return [...commanders, ...ranked.filter((entry) => entry.rank === null)].map(({ card }) => card);
}

function buildBoard(board: DeckBoard, input: DeckBoardsInput): BoardData {
  const sorted = sortDeckCards(inBoard(input.cards, board), input.sort);
  const stacks = commandersFirst(stackCards(sorted, input.commanderIds, !input.separateByStorage), input.commanderIds);
  return { board, stacks, groups: null, count: copies(stacks), backFaces: new Map() };
}

export function buildDeckBoards(input: DeckBoardsInput): DeckBoardsData {
  return {
    main: buildBoard('main', input),
    sideboard: buildBoard('sideboard', input),
    considering: buildBoard('considering', input),
  };
}
