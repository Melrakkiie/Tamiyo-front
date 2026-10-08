import { Button, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';

import { CollectionExportMenu } from '../bulk/CollectionExportMenu';
import { CollectionImportModal } from '../bulk/CollectionImportModal';
import { CardBrowser } from '../cards/CardBrowser';

export function CollectionPage() {
  const [importOpened, setImportOpened] = useState(false);

  return (
    <Stack>
      <Group justify="space-between" align="flex-start">
        <Title order={2}>Collection</Title>
        <Group gap="xs">
          <Button variant="default" onClick={() => setImportOpened(true)}>
            Importer
          </Button>
          <CollectionExportMenu />
        </Group>
      </Group>
      <CardBrowser />
      <CollectionImportModal opened={importOpened} onClose={() => setImportOpened(false)} />
    </Stack>
  );
}
