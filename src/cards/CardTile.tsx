import { Badge, Group, Stack, Text, UnstyledButton } from '@mantine/core';

import type { Card } from '../api/types';
import { CardImage } from './CardImage';

interface CardTileProps {
  card: Card;
  imageUrl: string | undefined;
  imageLoading: boolean;
  onOpen: (card: Card) => void;
}

export function CardTile({ card, imageUrl, imageLoading, onOpen }: CardTileProps) {
  return (
    <UnstyledButton onClick={() => onOpen(card)} aria-label={card.name}>
      <Stack gap={6}>
        <CardImage name={card.name} url={imageUrl} loading={imageLoading} />
        <div>
          <Text size="sm" fw={500} lineClamp={1}>
            {card.name}
          </Text>
          <Group gap={6} wrap="nowrap">
            <Text size="xs" c="dimmed">
              {card.set_code.toUpperCase()} · #{card.collector_number}
            </Text>
            {card.foil && (
              <Badge size="xs" variant="light">
                Foil
              </Badge>
            )}
          </Group>
        </div>
      </Stack>
    </UnstyledButton>
  );
}
