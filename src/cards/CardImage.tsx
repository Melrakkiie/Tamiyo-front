import { AspectRatio, Box, Center, Image, Paper, Skeleton, Text } from '@mantine/core';
import { useState } from 'react';

import { FoilFrame } from '../theme/FoilSparkles';

const CARD_RATIO = 488 / 680;

interface CardImageProps {
  name: string;
  url: string | undefined;
  loading: boolean;
  backUrl?: string;
  onFlip?: (url: string | undefined) => void;
  foil?: boolean;
}

export function CardImage({ name, url, loading, backUrl, onFlip, foil = false }: CardImageProps) {
  const [showBack, setShowBack] = useState(false);
  const flipped = showBack && !!backUrl;
  const shown = flipped ? backUrl : url;
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  const failed = !!shown && failedUrl === shown;

  function flip(event: { preventDefault: () => void; stopPropagation: () => void }) {
    event.preventDefault();
    event.stopPropagation();
    const next = !flipped;
    setShowBack(next);
    onFlip?.(next ? backUrl : url);
  }

  return (
    <FoilFrame foil={foil}>
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
      {backUrl && (
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
    </FoilFrame>
  );
}
