import { Stack, Text } from '@mantine/core';
import { Fragment, type ReactNode } from 'react';

import type { DeckBoard, DeckStats } from '../api/types';
import type { CardDisplay } from '../cards/CardDisplay';
import { CardGrid } from '../cards/CardLayout';
import { CardTile, type CardTileProps } from '../cards/CardTile';
import type { CardGroup } from '../cards/grouping';
import { formatPrice, PriceText, usePriceCurrency } from '../cards/price';
import { useCardVisuals } from '../cards/useCardVisuals';
import { useCardFaceTypes, useCardSubtypes } from '../scryfall/hooks';
import { BOARDS, COLLAPSIBLE_BOARDS, type CollapsibleBoard } from './boards';
import { BoardSection } from './BoardSection';
import { DeckCardGroups, type GroupDrop } from './DeckCardGroups';
import { type BoardData, buildDeckBoards, type DeckBoardsData, type DeckBoardsInput } from './boardLayout';
import type { DeckEntry } from './deckEntries';

export type DeckBoardsOptions<E extends DeckEntry> = Pick<DeckBoardsInput<E>, 'entries' | 'sort' | 'grouping'> &
  Partial<Pick<DeckBoardsInput<E>, 'commanders' | 'separateByStorage' | 'storageNames' | 'tagsOf'>>;

const noCollapsedBoards: CollapsibleBoard[] = [];
const noStorageNames = new Map<number, string>();

export function useDeckBoards<E extends DeckEntry>({
  entries,
  sort,
  grouping,
  commanders = [],
  separateByStorage = false,
  storageNames = noStorageNames,
  tagsOf = () => [],
}: DeckBoardsOptions<E>): DeckBoardsData<E> {
  const ids = entries.map((entry) => entry.scryfall_id);
  const faceTypes = useCardFaceTypes(ids);
  const subtypes = useCardSubtypes(ids);
  return buildDeckBoards({
    entries,
    sort,
    grouping,
    commanders,
    separateByStorage,
    faceTypes: faceTypes.data ?? {},
    subtypes: subtypes.data ?? {},
    storageNames,
    tagsOf,
  });
}

export interface TileContext<E extends DeckEntry = DeckEntry> {
  board: DeckBoard;
  group: CardGroup<E> | null;
  imageUrl: string | undefined;
}

export interface TileExtras<E extends DeckEntry = DeckEntry> {
  props?: Partial<
    Pick<
      CardTileProps<E>,
      'storageName' | 'pendingStatus' | 'collectionCount' | 'commander' | 'details' | 'onContextMenu'
    >
  >;
  wrap?: (tile: ReactNode) => ReactNode;
}

export interface DeckBoardsExtras<E extends DeckEntry = DeckEntry> {
  tile?: (entry: E, context: TileContext<E>) => TileExtras<E>;
  groupDrop?: (board: DeckBoard) => GroupDrop | undefined;
}

interface DeckBoardsProps<E extends DeckEntry> {
  boards: DeckBoardsData<E>;
  display: CardDisplay;
  collapsed?: CollapsibleBoard[];
  onToggleBoard?: (board: CollapsibleBoard) => void;
  boardValues?: DeckStats['board_values'];
  emptyDeck: ReactNode;
  emptyBoardMessages?: Record<CollapsibleBoard, string>;
  extras?: DeckBoardsExtras<E>;
  showGameChangers?: boolean;
  onOpen: (entry: E, board: DeckBoard) => void;
}

export function DeckBoards<E extends DeckEntry>({
  boards,
  display,
  collapsed = noCollapsedBoards,
  onToggleBoard,
  boardValues,
  emptyDeck,
  emptyBoardMessages,
  extras = {},
  showGameChangers = false,
  onOpen,
}: DeckBoardsProps<E>) {
  const visuals = useCardVisuals(
    BOARDS.flatMap((board) => boards[board].stacks),
    display,
  );
  const currency = usePriceCurrency();

  function renderBoard({ board, stacks, commanders, groups, backFaces }: BoardData<E>) {
    const renderTile = (entry: E, group: CardGroup<E> | null) => {
      const imageUrl = visuals.imageUrl(entry);
      const { props, wrap } = extras.tile?.(entry, { board, group, imageUrl }) ?? {};
      const tile = (
        <CardTile
          card={entry}
          faces={visuals.faces(entry)}
          imageLoading={visuals.imageLoading}
          display={display}
          commander={commanders.has(entry.key)}
          gameChanger={showGameChangers && entry.game_changer}
          manaCost={visuals.manaCost(entry)}
          onOpen={(clicked) => onOpen(clicked, board)}
          {...props}
        />
      );
      return <Fragment key={entry.key}>{wrap ? wrap(tile) : tile}</Fragment>;
    };
    return groups ? (
      <DeckCardGroups
        groups={groups}
        backFaces={backFaces}
        display={display}
        renderTile={renderTile}
        drop={extras.groupDrop?.(board)}
      />
    ) : (
      <CardGrid display={display} cards={stacks} renderTile={(entry) => renderTile(entry, null)} />
    );
  }

  function boardValue(board: CollapsibleBoard) {
    return currency && boardValues ? (
      <PriceText span fz="md">
        {formatPrice(boardValues[board][currency], currency)}
      </PriceText>
    ) : undefined;
  }

  const deckEmpty = BOARDS.every((board) => boards[board].count === 0);

  return (
    <Stack>
      {deckEmpty ? (
        emptyDeck
      ) : boards.main.count === 0 ? (
        <Text size="sm" c="dimmed">
          Aucune carte dans le deck principal.
        </Text>
      ) : (
        renderBoard(boards.main)
      )}
      {COLLAPSIBLE_BOARDS.filter((board) => emptyBoardMessages || boards[board].count > 0).map((board) => (
        <BoardSection
          key={board}
          board={board}
          count={boards[board].count}
          collapsed={collapsed.includes(board)}
          onToggle={() => onToggleBoard?.(board)}
          emptyMessage={emptyBoardMessages?.[board] ?? ''}
          value={boardValue(board)}
        >
          {renderBoard(boards[board])}
        </BoardSection>
      ))}
    </Stack>
  );
}
