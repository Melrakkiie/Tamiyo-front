import { Stack, Text, UnstyledButton } from '@mantine/core';
import { useLocation } from 'react-router';

import { CardImage } from '../cards/CardImage';
import { useCardBackImages, useCardImages } from '../scryfall/hooks';
import { useCardPreview } from './cardPreview';

export function CardPreviewPanel() {
  const { pathname } = useLocation();
  const card = useCardPreview(pathname);
  const ids = card ? [card.scryfallId] : [];
  const fronts = useCardImages(ids);
  const backs = useCardBackImages(ids);

  if (!card) {
    return (
      <Text size="sm" c="dimmed">
        Survole une carte pour l'afficher ici.
      </Text>
    );
  }

  const front = fronts.data?.[card.scryfallId];
  const back = backs.data?.[card.scryfallId];
  const shown = card.imageUrl ?? front;
  const image = (
    <CardImage
      key={`${card.scryfallId}:${shown ?? ''}`}
      name={card.name}
      url={shown}
      loading={!card.imageUrl && fronts.isLoading}
      backUrl={back && shown === back ? front : back}
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
