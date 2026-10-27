import { AspectRatio, Box, Center, Image, Paper, Skeleton, Text } from '@mantine/core';
import { useState } from 'react';

import type { CardFace } from '../scryfall/client';
import type { PrintingFace } from '../scryfall/faces';

const CARD_RATIO = 488 / 680;

interface CardImageProps {
  name: string;
  // The front face's image.
  url: string | undefined;
  loading: boolean;
  // The flip button shows only when there is a back face.
  back?: PrintingFace;
  initialFace?: CardFace;
  onFlip?: (shown: CardFace) => void;
}

export function CardImage({ name, url, loading, back, initialFace = 'front', onFlip }: CardImageProps) {
  const [showBack, setShowBack] = useState(initialFace === 'back');
  const hasBack = !!back;
  const flipped = showBack && hasBack;
  const shown = flipped ? back?.images.normal : url;
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  const failed = !!shown && failedUrl === shown;

  function flip(event: { preventDefault: () => void; stopPropagation: () => void }) {
    event.preventDefault();
    event.stopPropagation();
    const next = !flipped;
    setShowBack(next);
    onFlip?.(next ? 'back' : 'front');
  }

  return (
    <Box pos="relative">
      <AspectRatio ratio={CARD_RATIO}>
        {shown && !failed ? (
          <Image src={shown} alt={name} radius="md" loading="lazy" onError={() => setFailedUrl(shown)} />
        ) : loading ? (
          <Skeleton radius="md" />
        ) : (
          <Paper withBorder radius="md">
            <Center h="100%" p="xs">
              <Text size="sm" c="dimmed" ta="center">
                {name}
              </Text>
            </Center>
          </Paper>
        )}
      </AspectRatio>
      {hasBack && (
        <Box
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Voir le recto' : 'Voir le verso'}
          title={flipped ? 'Voir le recto' : 'Voir le verso'}
          onClick={flip}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              flip(event);
            }
          }}
          pos="absolute"
          bottom={10}
          right={10}
          w={34}
          h={34}
          style={{
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.65)',
            color: 'white',
            fontSize: 20,
            lineHeight: 1,
            cursor: 'pointer',
            boxShadow: 'var(--mantine-shadow-sm)',
            userSelect: 'none',
          }}
        >
          ⟲
        </Box>
      )}
    </Box>
  );
}
