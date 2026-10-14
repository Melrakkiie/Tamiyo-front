import { Box, Center, Stack, Text } from '@mantine/core';

import { LunaMoth } from '../theme/LunaMoth';
import { CARD_HEIGHT } from './engine';
import { DraggableCard, useDropTarget } from './dragDrop';
import { PlaytestCard } from './PlaytestCard';
import { useTable } from './table';

const MARGIN = 16;

export function Battlefield() {
  const { state, act, surfaceRef, scale, cardWidth } = useTable();
  const cardHeight = CARD_HEIGHT * scale;
  const ids = state.zones.battlefield;
  const target = useDropTarget('battlefield', {
    accepts: () => true,
    onDrop: (item, point) => {
      const field = surfaceRef.current;
      if (!field) {
        return;
      }
      const rect = field.getBoundingClientRect();
      const maxX = field.scrollLeft + field.clientWidth - cardWidth;
      const maxY = field.scrollTop + field.clientHeight - cardHeight;
      const x = point.x - cardWidth / 2 - rect.left + field.scrollLeft;
      const y = point.y - cardHeight / 2 - rect.top + field.scrollTop;
      act({
        type: 'move',
        id: item.id,
        to: 'battlefield',
        x: Math.max(0, Math.min(x, maxX)) / scale,
        y: Math.max(0, Math.min(y, maxY)) / scale,
      });
    },
  });

  const width = Math.max(0, ...ids.map((id) => (state.cards[id].x + CARD_HEIGHT + MARGIN) * scale));
  const height = Math.max(0, ...ids.map((id) => (state.cards[id].y + CARD_HEIGHT + MARGIN) * scale));

  return (
    <Box
      ref={surfaceRef}
      className="tamiyo-playtest-field"
      data-over={target.over || undefined}
      {...target.targetProps}
      pos="relative"
      h="100%"
      style={{ overflow: 'auto' }}
    >
      {ids.length === 0 ? (
        <Center h="100%" p="md">
          <Stack align="center" gap="xs" style={{ opacity: 0.85 }}>
            <LunaMoth size={44} />
            <Text className="tamiyo-hand" size="lg" c="dimmed" ta="center" style={{ transform: 'rotate(-1.5deg)' }}>
              Le champ de bataille t'attend : glisse une carte ici, ou double-clique une carte de ta main.
            </Text>
          </Stack>
        </Center>
      ) : (
        <Box pos="relative" miw="100%" mih="100%" w={width} h={height}>
          {ids.map((id, index) => {
            const card = state.cards[id];
            return (
              <Box key={id} pos="absolute" left={card.x * scale} top={card.y * scale} style={{ zIndex: index + 1 }}>
                <DraggableCard item={{ id, from: 'battlefield' }}>
                  <PlaytestCard card={card} width={cardWidth} onActivate={() => act({ type: 'tap', id })} />
                </DraggableCard>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
