import { Stack, Text } from '@mantine/core';

import { CardImage } from '../cards/CardImage';
import { useCardImages } from '../scryfall/hooks';
import { useCardPreview } from './cardPreview';

export function CardPreviewPanel() {
  const card = useCardPreview();
  const fallback = useCardImages(card && !card.imageUrl ? [card.scryfallId] : []);

  if (!card) {
    return (
      <Text size="sm" c="dimmed">
        Survole une carte pour l'afficher ici.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      <CardImage
        name={card.name}
        url={card.imageUrl ?? fallback.data?.[card.scryfallId]}
        loading={!card.imageUrl && fallback.isLoading}
      />
    </Stack>
  );
}
