import type { DeckBoard, DeckCardSort } from '../api/types';
import { copyCount, totalCopies } from '../cards/copies';
import { type CardGroup, groupCards, sortIntoGroups, typeLabels } from '../cards/grouping';
import type { FaceTypes } from '../scryfall/classify';
import { inBoard } from './boards';
import type { SlotTarget } from './commanders';
import { type DeckEntry, entryMatches, stackEntries, type Taggable } from './deckEntries';
import { sortDeckCards } from './pendingCards';
import { type DeckCardGrouping, groupByStorage, groupBySubtype, groupByTag } from './storageGrouping';

export interface DeckBoardsInput<E extends DeckEntry = DeckEntry> {
  entries: E[];
  sort: DeckCardSort;
  grouping: DeckCardGrouping | null;
  commanders: SlotTarget[];
  separateByStorage: boolean;
  faceTypes: Record<string, FaceTypes | undefined>;
  subtypes: Record<string, string[] | undefined>;
  storageNames: ReadonlyMap<number, string>;
  tagsOf: (entry: Taggable) => string[];
}

export interface BackFaceEntry {
  name: string;
  quantity: number;
}

export interface BoardData<E extends DeckEntry = DeckEntry> {
  board: DeckBoard;
  stacks: E[];
  commanders: Set<string>;
  groups: CardGroup<E>[] | null;
  count: number;
  backFaces: Map<string, BackFaceEntry[]>;
}

export type DeckBoardsData<E extends DeckEntry = DeckEntry> = Record<DeckBoard, BoardData<E>>;

type GroupingInput = Pick<DeckBoardsInput, 'grouping' | 'faceTypes' | 'subtypes' | 'storageNames' | 'tagsOf'>;

interface GroupedStacks<E extends DeckEntry> {
  groups: CardGroup<E>[] | null;
  backFaces: Map<string, BackFaceEntry[]>;
}

function commanderRank(entry: DeckEntry, commanders: SlotTarget[]): number | null {
  const rank = commanders.findIndex((target) => entryMatches(entry, target));
  return rank === -1 ? null : rank;
}

function commandersFirst<E extends DeckEntry>(stacks: E[], commanders: SlotTarget[]) {
  const ranked = stacks.map((entry) => ({ entry, rank: commanderRank(entry, commanders) }));
  const first = ranked
    .filter((ranking): ranking is { entry: E; rank: number } => ranking.rank !== null)
    .sort((a, b) => a.rank - b.rank);
  return [...first, ...ranked.filter((ranking) => ranking.rank === null)].map(({ entry }) => entry);
}

function backFacesOf(cards: DeckEntry[], faceTypes: GroupingInput['faceTypes']) {
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

function groupStacks<E extends DeckEntry>(stacks: E[], input: GroupingInput): GroupedStacks<E> {
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

function buildBoard<E extends DeckEntry>(board: DeckBoard, input: DeckBoardsInput<E>): BoardData<E> {
  const sorted = sortDeckCards(inBoard(input.entries, board), input.sort);
  const stacks = commandersFirst(stackEntries(sorted, input.commanders, !input.separateByStorage), input.commanders);
  const commanders = new Set(
    stacks.filter((entry) => commanderRank(entry, input.commanders) !== null).map((entry) => entry.key),
  );
  return { board, stacks, commanders, count: totalCopies(stacks), ...groupStacks(stacks, input) };
}

export function buildDeckBoards<E extends DeckEntry>(input: DeckBoardsInput<E>): DeckBoardsData<E> {
  return {
    main: buildBoard('main', input),
    sideboard: buildBoard('sideboard', input),
    considering: buildBoard('considering', input),
  };
}
