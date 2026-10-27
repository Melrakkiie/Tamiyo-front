import { Stack, Text, UnstyledButton } from '@mantine/core';
import { useLocation } from 'react-router';

import { CardImage } from '../cards/CardImage';
import { PrintPrice } from '../cards/price';
import { usePrintingFaces } from '../scryfall/hooks';
import { useCardPreview } from './cardPreview';

export function CardPreviewPanel() {
  const { pathname } = useLocation();
  const card = useCardPreview(pathname);
  const faces = usePrintingFaces(card ? [card.scryfallId] : []);

  if (!card) {
    return (
      <Text size="sm" c="dimmed">
        Survole une carte pour l'afficher ici.
      </Text>
    );
  }

  const printing = faces.data[card.scryfallId];
  const face = card.face ?? 'front';
  const image = (
    <CardImage
      key={`${card.scryfallId}:${face}`}
      name={card.name}
      frontUrl={card.imageUrl ?? printing?.front.images.normal}
      loading={!card.imageUrl && faces.isLoading}
      back={printing?.back}
      initialFace={face}
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
      <PrintPrice scryfallId={card.scryfallId} foil={card.foil} ta="center" />
      {card.open && (
        <Text size="xs" c="dimmed" ta="center">
          Clique pour ouvrir la carte
        </Text>
      )}
    </Stack>
  );
}
