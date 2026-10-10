import { Stack, Text } from '@mantine/core';

import type { ManaCurveBucket, ManaCurveCard } from '../api/types';
import { typeLabels } from '../cards/grouping';
import { showCardPreview } from '../layout/cardPreview';
import { useCardImages } from '../scryfall/hooks';

const TYPE_ORDER = Object.keys(typeLabels);

function typeLabel(type: string) {
  return (typeLabels as Record<string, string>)[type] ?? 'Autres';
}

function byType(cards: ManaCurveCard[]) {
  const groups = new Map<string, ManaCurveCard[]>();
  for (const card of cards) {
    groups.set(card.type, [...(groups.get(card.type) ?? []), card]);
  }
  const rank = (type: string) => (TYPE_ORDER.includes(type) ? TYPE_ORDER.indexOf(type) : TYPE_ORDER.length);
  return [...groups.entries()].sort(([a], [b]) => rank(a) - rank(b));
}

function CardSection({
  title,
  cards,
  images,
}: {
  title: string;
  cards: ManaCurveCard[];
  images: Record<string, string | undefined> | undefined;
}) {
  const count = cards.reduce((total, card) => total + card.quantity, 0);
  return (
    <Stack gap={4}>
      <Text size="xs" fw={600} c="dimmed" tt="uppercase">
        {title} ({count})
      </Text>
      {cards.map((card) => (
        <Text
          key={card.name}
          size="sm"
          onMouseEnter={() =>
            showCardPreview({ name: card.name, scryfallId: card.scryfall_id, imageUrl: images?.[card.scryfall_id] })
          }
        >
          {card.quantity > 1 && (
            <Text span size="sm" fw={600} c="dimmed">
              {card.quantity}×{' '}
            </Text>
          )}
          {card.name}
        </Text>
      ))}
    </Stack>
  );
}

export function CurveCardList({ bucket }: { bucket: ManaCurveBucket }) {
  const images = useCardImages(bucket.cards.map((card) => card.scryfall_id));
  return (
    <Stack gap="sm">
      <Text size="sm" fw={600}>
        Coût {bucket.mana_value} · {bucket.count} carte{bucket.count > 1 ? 's' : ''}
      </Text>
      {byType(bucket.cards).map(([type, cards]) => (
        <CardSection key={type} title={typeLabel(type)} cards={cards} images={images.data} />
      ))}
    </Stack>
  );
}
