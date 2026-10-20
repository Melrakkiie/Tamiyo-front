import type { Card, DeckBoard, DeckCardSort } from '../api/types';
import { copyCount, copyIds, totalCopies } from '../cards/copies';
import { type CardGroup, groupCards, sortIntoGroups, typeLabels } from '../cards/grouping';
import type { FaceTypes } from '../scryfall/classify';
import { inBoard } from './boards';
import { sortDeckCards, stackCards } from './pendingCards';
import { type DeckCardGrouping, groupByStorage, groupBySubtype, groupByTag } from './storageGrouping';

export type BoardCard = Card & { board: DeckBoard; price?: number | null };

export interface DeckBoardsInput {
  cards: BoardCard[];
  sort: DeckCardSort;
  grouping: DeckCardGrouping | null;
  commanderIds: number[];
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
  commanders: Set<number>;
  groups: CardGroup[] | null;
  count: number;
  backFaces: Map<string, BackFaceEntry[]>;
}

export type DeckBoardsData = Record<DeckBoard, BoardData>;

type GroupingInput = Pick<DeckBoardsInput, 'grouping' | 'faceTypes' | 'subtypes' | 'storageNames' | 'tagsOf'>;

interface GroupedStacks {
  groups: CardGroup[] | null;
  backFaces: Map<string, BackFaceEntry[]>;
}

function commanderRank(card: Card, commanderIds: DeckBoardsInput['commanderIds']): number | null {
  const ids = copyIds(card);
  const rank = commanderIds.findIndex((id) => ids.includes(id));
  return rank === -1 ? null : rank;
}

function commandersFirst(stacks: BoardCard[], commanderIds: DeckBoardsInput['commanderIds']) {
  const ranked = stacks.map((card) => ({ card, rank: commanderRank(card, commanderIds) }));
  const commanders = ranked
    .filter((entry): entry is { card: BoardCard; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank);
  return [...commanders, ...ranked.filter((entry) => entry.rank === null)].map(({ card }) => card);
}

function backFacesOf(cards: Card[], faceTypes: GroupingInput['faceTypes']) {
  const byLabel = new Map<string, Map<string, number>>();
  for (const card of cards) {
    const types = faceTypes[card.scryfall_id];
    if (types?.back && types.back !== types.front) {
      const label = typeLabels[types.back];
      const entries = byLabel.get(label) ?? new Map<string, number>();
      entries.set(card.name, (entries.get(card.name) ?? 0) + copyCount(card));
      byLabel.set(label, entries);
    }
  }
  return new Map(
    [...byLabel].map(([label, entries]) => [
      label,
      [...entries].map(([name, quantity]) => ({ name, quantity })).sort((a, b) => a.name.localeCompare(b.name)),
    ]),
  );
}

function groupStacks(stacks: Card[], input: GroupingInput): GroupedStacks {
  const { grouping } = input;
  if (grouping === null) {
    return { groups: null, backFaces: new Map() };
  }
  if (grouping === 'type') {
    const typed = stacks.map((card) => {
      const types = input.faceTypes[card.scryfall_id];
      return types ? { ...card, card_type: types.front } : card;
    });
    return {
      groups: groupCards(sortIntoGroups(typed, 'type'), 'type'),
      backFaces: backFacesOf(typed, input.faceTypes),
    };
  }
  const groups =
    grouping === 'storage'
      ? groupByStorage(stacks, input.storageNames)
      : grouping === 'tag'
        ? groupByTag(stacks, input.tagsOf)
        : grouping === 'subtype'
          ? groupBySubtype(stacks, (card) => input.subtypes[card.scryfall_id] ?? [])
          : groupCards(sortIntoGroups(stacks, grouping), grouping);
  return { groups, backFaces: new Map() };
}

function buildBoard(board: DeckBoard, input: DeckBoardsInput): BoardData {
  const sorted = sortDeckCards(inBoard(input.cards, board), input.sort);
  const stacks = commandersFirst(stackCards(sorted, input.commanderIds, !input.separateByStorage), input.commanderIds);
  const commanders = new Set(
    stacks.filter((card) => commanderRank(card, input.commanderIds) !== null).map((card) => card.id),
  );
  return { board, stacks, commanders, count: totalCopies(stacks), ...groupStacks(stacks, input) };
}

export function buildDeckBoards(input: DeckBoardsInput): DeckBoardsData {
  return {
    main: buildBoard('main', input),
    sideboard: buildBoard('sideboard', input),
    considering: buildBoard('considering', input),
  };
}
