import { Stack, Text, UnstyledButton } from '@mantine/core';
import { useLocation } from 'react-router';

import { CardImage } from '../cards/CardImage';
import { useCardImages } from '../scryfall/hooks';
import { useCardPreview } from './cardPreview';

export function CardPreviewPanel() {
  const { pathname } = useLocation();
  const card = useCardPreview(pathname);
  const fallback = useCardImages(card && !card.imageUrl ? [card.scryfallId] : []);

  if (!card) {
    return (
      <Text size="sm" c="dimmed">
        Survole une carte pour l'afficher ici.
      </Text>
    );
  }

  const image = (
    <CardImage
      name={card.name}
      url={card.imageUrl ?? fallback.data?.[card.scryfallId]}
      loading={!card.imageUrl && fallback.isLoading}
    />
  );

  return (
    <Stack gap="xs">
      {card.open ? (
        <UnstyledButton onClick={card.open} aria-label={`Ouvrir ${card.name}`} style={{ cursor: 'pointer' }}>
          {image}
        </UnstyledButton>
      ) : (
        image
      )}
      {card.open && (
        <Text size="xs" c="dimmed" ta="center">
          Clique pour ouvrir la carte
        </Text>
      )}
    </Stack>
  );
}
