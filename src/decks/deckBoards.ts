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

function buildBoard(board: DeckBoard, input: DeckBoardsInput): BoardData {
  const sorted = sortDeckCards(inBoard(input.cards, board), input.sort);
  const stacks = stackCards(sorted, input.commanderIds, !input.separateByStorage);
  return { board, stacks, groups: null, count: copies(stacks), backFaces: new Map() };
}

export function buildDeckBoards(input: DeckBoardsInput): DeckBoardsData {
  return {
    main: buildBoard('main', input),
    sideboard: buildBoard('sideboard', input),
    considering: buildBoard('considering', input),
  };
}
