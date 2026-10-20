import { Stack, Text } from '@mantine/core';
import { Fragment, type ReactNode } from 'react';

import type { Card, DeckBoard, DeckStats } from '../api/types';
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

export type DeckBoardsOptions = Pick<DeckBoardsInput, 'cards' | 'sort' | 'grouping'> &
  Partial<Pick<DeckBoardsInput, 'commanderIds' | 'separateByStorage' | 'storageNames' | 'tagsOf'>>;

const noCollapsedBoards: CollapsibleBoard[] = [];
const noStorageNames = new Map<number, string>();

export function useDeckBoards({
  cards,
  sort,
  grouping,
  commanderIds = [],
  separateByStorage = false,
  storageNames = noStorageNames,
  tagsOf = () => [],
}: DeckBoardsOptions): DeckBoardsData {
  const ids = cards.map((card) => card.scryfall_id);
  const faceTypes = useCardFaceTypes(ids);
  const subtypes = useCardSubtypes(ids);
  return buildDeckBoards({
    cards,
    sort,
    grouping,
    commanderIds,
    separateByStorage,
    faceTypes: faceTypes.data ?? {},
    subtypes: subtypes.data ?? {},
    storageNames,
    tagsOf,
  });
}

export interface TileContext {
  board: DeckBoard;
  group: CardGroup | null;
  imageUrl: string | undefined;
}

export interface TileExtras {
  props?: Partial<
    Pick<CardTileProps, 'storageName' | 'pendingStatus' | 'collectionCount' | 'commander' | 'details' | 'onContextMenu'>
  >;
  wrap?: (tile: ReactNode) => ReactNode;
}

export interface DeckBoardsExtras {
  tile?: (card: Card, context: TileContext) => TileExtras;
  groupDrop?: (board: DeckBoard) => GroupDrop | undefined;
}

interface DeckBoardsProps {
  boards: DeckBoardsData;
  display: CardDisplay;
  collapsed?: CollapsibleBoard[];
  onToggleBoard?: (board: CollapsibleBoard) => void;
  boardValues?: DeckStats['board_values'];
  emptyDeck: ReactNode;
  emptyBoardMessages?: Record<CollapsibleBoard, string>;
  extras?: DeckBoardsExtras;
  onOpen: (card: Card, board: DeckBoard) => void;
}

export function DeckBoards({
  boards,
  display,
  collapsed = noCollapsedBoards,
  onToggleBoard,
  boardValues,
  emptyDeck,
  emptyBoardMessages,
  extras = {},
  onOpen,
}: DeckBoardsProps) {
  const visuals = useCardVisuals(
    BOARDS.flatMap((board) => boards[board].stacks),
    display,
  );
  const currency = usePriceCurrency();

  function renderBoard({ board, stacks, commanders, groups, backFaces }: BoardData) {
    const renderTile = (card: Card, group: CardGroup | null) => {
      const imageUrl = visuals.imageUrl(card);
      const { props, wrap } = extras.tile?.(card, { board, group, imageUrl }) ?? {};
      const tile = (
        <CardTile
          card={card}
          imageUrl={imageUrl}
          backImageUrl={visuals.backImageUrl(card)}
          imageLoading={visuals.imageLoading}
          display={display}
          commander={commanders.has(card.id)}
          manaCost={visuals.manaCost(card)}
          onOpen={(clicked) => onOpen(clicked, board)}
          {...props}
        />
      );
      return <Fragment key={card.id}>{wrap ? wrap(tile) : tile}</Fragment>;
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
      <CardGrid display={display} cards={stacks} renderTile={(card) => renderTile(card, null)} />
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
