import { HoverCard, Image, Skeleton, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import { useCardByName, useCardImages } from '../scryfall/hooks';

const PREVIEW_WIDTH = 244;
const PREVIEW_HEIGHT = Math.round((PREVIEW_WIDTH * 680) / 488);

type Printing = { set: string; number: string };

interface CardHoverPreviewProps {
  scryfallId?: string;
  /** Without a scryfallId, the printing to show instead of the card's default one. */
  printing?: Printing;
  name: string;
  children: ReactNode;
}

export function CardHoverPreview({ scryfallId, printing, name, children }: CardHoverPreviewProps) {
  return (
    <HoverCard position="left" shadow="md" openDelay={100}>
      <HoverCard.Target>{children}</HoverCard.Target>
      <HoverCard.Dropdown p={4}>
        {scryfallId ? (
          <PreviewById scryfallId={scryfallId} name={name} />
        ) : (
          <PreviewByName name={name} printing={printing} />
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  );
}

function PreviewById({ scryfallId, name }: { scryfallId: string; name: string }) {
  const images = useCardImages([scryfallId]);
  return <Preview src={images.data[scryfallId]} loading={images.isLoading} name={name} />;
}

function PreviewByName({ name, printing }: { name: string; printing?: Printing }) {
  const card = useCardByName(name, printing);
  return <Preview src={card.data?.image} loading={card.isLoading} name={name} />;
}

function Preview({ src, loading, name }: { src: string | undefined; loading: boolean; name: string }) {
  if (loading) {
    return <Skeleton w={PREVIEW_WIDTH} h={PREVIEW_HEIGHT} radius="md" />;
  }
  if (!src) {
    return (
      <Text size="sm" c="dimmed" p="xs">
        Aperçu indisponible
      </Text>
    );
  }
  return <Image src={src} alt={name} w={PREVIEW_WIDTH} radius="md" />;
}
