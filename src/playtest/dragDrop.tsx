import { Box } from '@mantine/core';

import { createDragDrop } from '../layout/dragDrop';
import type { Zone } from './engine';
import { CardFace } from './PlaytestCard';
import { useTable } from './table';

export interface DragItem {
  id: string;
  from: Zone;
}

function CardGhost({ item }: { item: DragItem }) {
  const { state, cardWidth } = useTable();
  const card = state.cards[item.id];
  if (!card) {
    return null;
  }
  return (
    <Box style={{ boxShadow: 'var(--mantine-shadow-lg)', borderRadius: 'var(--mantine-radius-md)' }}>
      <CardFace card={card} width={cardWidth} hidden={item.from === 'library'} />
    </Box>
  );
}

const playtestDrag = createDragDrop<DragItem>({
  sameItem: (a, b) => a.id === b.id,
  Ghost: CardGhost,
  centerGhost: true,
  touch: true,
});

export const PlaytestDragProvider = playtestDrag.DragProvider;
export const DraggableCard = playtestDrag.Draggable;
export const useDropTarget = playtestDrag.useDropTarget;
