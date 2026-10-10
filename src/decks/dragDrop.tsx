import { Box, Image, Paper, Text } from '@mantine/core';

import type { Card, DeckBoard } from '../api/types';
import { createDragDrop } from '../layout/dragDrop';

export interface DragItem {
  card: Card;
  board: DeckBoard;
  tag: string | null;
  imageUrl: string | undefined;
}

function CardGhost({ item }: { item: DragItem }) {
  const { card, imageUrl } = item;
  const quantity = card.quantity ?? 1;
  return imageUrl ? (
    <Box w={110}>
      <Image src={imageUrl} alt={card.name} radius="md" style={{ boxShadow: 'var(--mantine-shadow-lg)' }} />
    </Box>
  ) : (
    <Paper shadow="lg" px="sm" py={6} radius="md" withBorder>
      <Text size="sm" fw={500}>
        {quantity > 1 ? `${quantity}× ` : ''}
        {card.name}
      </Text>
    </Paper>
  );
}

const cardDrag = createDragDrop<DragItem>({
  sameItem: (a, b) => a.card.id === b.card.id && a.board === b.board && a.tag === b.tag,
  Ghost: CardGhost,
});

export const DeckDragProvider = cardDrag.DragProvider;
export const DraggableCard = cardDrag.Draggable;
export const useDraggedCard = cardDrag.useDraggedItem;
export const useDropTarget = cardDrag.useDropTarget;
