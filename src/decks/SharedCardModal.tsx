import { Badge, Grid, Group, Modal, Stack, Text, Title } from '@mantine/core';
import { useRef } from 'react';

import type { Card } from '../api/types';
import { CardImage } from '../cards/CardImage';
import { CardRulesText } from '../scryfall/CardRulesText';
import { useBackImage } from '../scryfall/hooks';

interface SharedCardModalProps {
  card: Card | null;
  imageUrl: string | undefined;
  onClose: () => void;
}

export function SharedCardModal({ card, imageUrl, onClose }: SharedCardModalProps) {
  const lastShown = useRef<{ card: Card; imageUrl: string | undefined } | null>(null);
  if (card) {
    lastShown.current = { card, imageUrl };
  }
  const shown = lastShown.current;

  return (
    <Modal opened={card !== null} onClose={onClose} title={shown?.card.name} size="xl">
      {shown && <SharedCardDetail key={shown.card.id} card={shown.card} imageUrl={shown.imageUrl} />}
    </Modal>
  );
}

function SharedCardDetail({ card, imageUrl }: { card: Card; imageUrl: string | undefined }) {
  const backImage = useBackImage(card.scryfall_id);
  const quantity = card.quantity ?? 1;

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, sm: 5 }}>
        <CardImage name={card.name} url={imageUrl} backUrl={backImage} loading={false} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 7 }}>
        <Stack>
          <div>
            <Title order={3} size="h4">
              {card.name}
            </Title>
            <Group gap={6}>
              <Text size="sm" c="dimmed">
                {card.set_code.toUpperCase()} · #{card.collector_number}
                {quantity > 1 ? ` · ${quantity} exemplaires` : ''}
              </Text>
              {card.foil && (
                <Badge size="xs" variant="light">
                  Foil
                </Badge>
              )}
            </Group>
          </div>
          <CardRulesText scryfallId={card.scryfall_id} />
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
