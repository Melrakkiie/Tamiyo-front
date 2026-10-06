import { Badge, Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';

import type { Card } from '../api/types';
import { CardImage } from './CardImage';

interface CardTileProps {
  card: Card;
  imageUrl: string | undefined;
  imageLoading: boolean;
  storageName?: string | null;
  notOwned?: boolean;
  onOpen: (card: Card) => void;
}

export function CardTile({ card, imageUrl, imageLoading, storageName, notOwned, onOpen }: CardTileProps) {
  return (
    <UnstyledButton onClick={() => onOpen(card)} aria-label={card.name}>
      <Stack gap={6}>
        <Box
          style={
            notOwned
              ? {
                  outline: '3px solid var(--mantine-color-orange-6)',
                  outlineOffset: 2,
                  borderRadius: 'var(--mantine-radius-md)',
                }
              : undefined
          }
        >
          <CardImage name={card.name} url={imageUrl} loading={imageLoading} />
        </Box>
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
          {notOwned ? (
            <Text size="xs" c="orange" lineClamp={1}>
              Pas dans ta collection
            </Text>
          ) : (
            storageName !== undefined && (
              <Text size="xs" c="dimmed" fs={storageName ? undefined : 'italic'} lineClamp={1}>
                {storageName ?? 'Sans rangement'}
              </Text>
            )
          )}
        </div>
      </Stack>
    </UnstyledButton>
  );
}
