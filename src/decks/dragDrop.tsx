import { Box, Image, Paper, Text } from '@mantine/core';

import type { DeckBoard } from '../api/types';
import { createDragDrop } from '../layout/dragDrop';
import { FoilSparkles } from '../theme/FoilSparkles';
import type { DeckEntry } from './deckEntries';

export interface DragItem {
  entry: DeckEntry;
  board: DeckBoard;
  tag: string | null;
  imageUrl: string | undefined;
}

function CardGhost({ item }: { item: DragItem }) {
  const { entry, imageUrl } = item;
  const { quantity } = entry;
  return imageUrl ? (
    <Box w={110} pos="relative">
      <Image src={imageUrl} alt={entry.name} radius="md" style={{ boxShadow: 'var(--mantine-shadow-lg)' }} />
      {entry.foil && <FoilSparkles />}
    </Box>
  ) : (
    <Paper shadow="lg" px="sm" py={6} radius="md" withBorder>
      <Text size="sm" fw={500}>
        {quantity > 1 ? `${quantity}× ` : ''}
        {entry.name}
      </Text>
    </Paper>
  );
}

const cardDrag = createDragDrop<DragItem>({
  sameItem: (a, b) => a.entry.key === b.entry.key && a.board === b.board && a.tag === b.tag,
  Ghost: CardGhost,
});

export const DeckDragProvider = cardDrag.DragProvider;
export const DraggableCard = cardDrag.Draggable;
export const useDraggedCard = cardDrag.useDraggedItem;
export const useDropTarget = cardDrag.useDropTarget;
