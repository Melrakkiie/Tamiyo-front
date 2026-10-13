import { Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

import { LunaMoth } from './LunaMoth';

type Arrow = 'up' | 'up-right';

const arrowPaths: Record<Arrow, string> = {
  up: 'M30 58 C14 46 22 22 34 8 M24 14 L34 7 L38 19',
  'up-right': 'M6 56 C26 58 40 40 52 12 M42 16 L52 10 L56 22',
};

function ScribbledArrow({ direction }: { direction: Arrow }) {
  return (
    <svg width={60} height={62} viewBox="0 0 60 62" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path
        d={arrowPaths[direction]}
        fill="none"
        stroke="var(--mantine-color-prune-filled)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface EmptyNoteProps {
  title: ReactNode;
  note?: ReactNode;
  arrow?: Arrow;
  children?: ReactNode;
}

export function EmptyNote({ title, note, arrow, children }: EmptyNoteProps) {
  return (
    <Stack align="center" gap="sm" py="xl" px="md" ta="center">
      {arrow && note && (
        <div className="tamiyo-margin-note" data-arrow={arrow}>
          <ScribbledArrow direction={arrow} />
        </div>
      )}
      <LunaMoth size={52} />
      <Title order={3}>{title}</Title>
      {note && (
        <Text className="tamiyo-hand" size="xl" c="prune" maw={420} style={{ transform: 'rotate(-1.5deg)' }}>
          {note}
        </Text>
      )}
      {children}
    </Stack>
  );
}
