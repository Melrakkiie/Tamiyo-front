import { Stack, Title } from '@mantine/core';

import { CardBrowser } from '../cards/CardBrowser';

export function CollectionPage() {
  return (
    <Stack>
      <Title order={2}>Collection</Title>
      <CardBrowser />
    </Stack>
  );
}
