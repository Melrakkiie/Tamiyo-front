import { Box } from '@mantine/core';

import { CardImage } from '../cards/CardImage';
import { MAGIC_CARD_BACK_URL } from '../scryfall/client';

export function CardBack({ width }: { width: number }) {
  return (
    <Box w={width}>
      <CardImage name="Dos de carte" frontUrl={MAGIC_CARD_BACK_URL} loading={false} />
    </Box>
  );
}
