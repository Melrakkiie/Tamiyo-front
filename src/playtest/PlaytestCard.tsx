import { Box, Group } from '@mantine/core';
import type { MouseEvent, PointerEvent } from 'react';
import { useRef } from 'react';

import { CardImage } from '../cards/CardImage';
import { Sticker } from '../theme/Sticker';
import { CardBack } from './CardBack';
import type { CardInstance } from './engine';
import { useTable } from './table';

export function CardFace({ card, width, hidden = false }: { card: CardInstance; width: number; hidden?: boolean }) {
  const { frontOf, backOf, imagesLoading } = useTable();
  if (hidden || card.faceDown) {
    return <CardBack width={width} />;
  }
  const back = card.flipped ? backOf(card) : undefined;
  return (
    <Box w={width}>
      <CardImage name={card.name} frontUrl={back ?? frontOf(card)} loading={imagesLoading} />
    </Box>
  );
}

function CounterStickers({ counters }: { counters: Record<string, number> }) {
  const entries = Object.entries(counters);
  if (entries.length === 0) {
    return null;
  }
  return (
    <Group gap={4} pos="absolute" left={4} bottom={6} style={{ pointerEvents: 'none' }}>
      {entries.map(([kind, value]) => (
        <Sticker key={kind} tone={kind === '-1/-1' ? 'prune' : 'lune'} size="xs">
          {kind === '+1/+1' || kind === '-1/-1' ? `${kind} ×${value}` : `${kind} ${value}`}
        </Sticker>
      ))}
    </Group>
  );
}

interface PlaytestCardProps {
  card: CardInstance;
  width: number;
  hidden?: boolean;
  onActivate?: () => void;
  onTap?: () => void;
}

export function PlaytestCard({ card, width, hidden = false, onActivate, onTap }: PlaytestCardProps) {
  const { openMenu, preview } = useTable();
  const pointerType = useRef('mouse');

  function onContextMenu(event: MouseEvent) {
    const touch = (event.nativeEvent as Partial<globalThis.PointerEvent>).pointerType === 'touch';
    if (event.shiftKey || touch) {
      return;
    }
    event.preventDefault();
    openMenu(event.clientX, event.clientY, card.id);
  }

  function onClick(event: MouseEvent) {
    if (onTap) {
      onTap();
    } else if (pointerType.current === 'touch') {
      openMenu(event.clientX, event.clientY, card.id);
    }
  }

  return (
    <Box
      pos="relative"
      w={width}
      onPointerDown={(event: PointerEvent) => (pointerType.current = event.pointerType)}
      onDoubleClick={onActivate}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => !hidden && preview(card)}
      onMouseLeave={() => preview(null)}
      style={{
        transform: card.tapped ? 'rotate(90deg)' : undefined,
        transition: 'transform 140ms ease',
      }}
    >
      <CardFace card={card} width={width} hidden={hidden} />
      <CounterStickers counters={card.counters} />
      {card.copy && (
        <Box pos="absolute" top={6} right={4} style={{ pointerEvents: 'none' }}>
          <Sticker tone="paper" size="xs" tilt={3}>
            jeton
          </Sticker>
        </Box>
      )}
    </Box>
  );
}
