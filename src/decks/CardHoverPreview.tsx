import { Box, HoverCard, Image, Skeleton, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import { useCardImageByName, useCardImages } from '../scryfall/hooks';
import { FoilSparkles } from '../theme/FoilSparkles';

const PREVIEW_WIDTH = 244;
const PREVIEW_HEIGHT = Math.round((PREVIEW_WIDTH * 680) / 488);

interface CardHoverPreviewProps {
  scryfallId?: string;
  name: string;
  foil?: boolean;
  children: ReactNode;
}

export function CardHoverPreview({ scryfallId, name, foil = false, children }: CardHoverPreviewProps) {
  return (
    <HoverCard position="left" shadow="md" openDelay={100}>
      <HoverCard.Target>{children}</HoverCard.Target>
      <HoverCard.Dropdown p={4}>
        {scryfallId ? <PreviewById scryfallId={scryfallId} name={name} foil={foil} /> : <PreviewByName name={name} />}
      </HoverCard.Dropdown>
    </HoverCard>
  );
}

function PreviewById({ scryfallId, name, foil }: { scryfallId: string; name: string; foil: boolean }) {
  const images = useCardImages([scryfallId]);
  return <Preview src={images.data[scryfallId]} loading={images.isLoading} name={name} foil={foil} />;
}

function PreviewByName({ name }: { name: string }) {
  const image = useCardImageByName(name);
  return <Preview src={image.data ?? undefined} loading={image.isLoading} name={name} foil={false} />;
}

function Preview({
  src,
  loading,
  name,
  foil,
}: {
  src: string | undefined;
  loading: boolean;
  name: string;
  foil: boolean;
}) {
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
  return (
    <Box pos="relative" w={PREVIEW_WIDTH}>
      <Image src={src} alt={name} w={PREVIEW_WIDTH} radius="md" />
      {foil && <FoilSparkles />}
    </Box>
  );
}
