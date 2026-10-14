import { Button, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';

import { CollectionExportMenu } from '../bulk/CollectionExportMenu';
import { CollectionImportModal } from '../bulk/CollectionImportModal';
import { useCollectionValue } from '../cards/api';
import { CardBrowser } from '../cards/CardBrowser';
import { formatPrice, PriceText, usePriceCurrency } from '../cards/price';
import { usePageTitle } from '../layout/usePageTitle';

export function CollectionPage() {
  usePageTitle('Collection');
  const [importOpened, setImportOpened] = useState(false);
  const currency = usePriceCurrency();
  const value = useCollectionValue(currency !== null);

  return (
    <Stack>
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Collection</Title>
          {currency && value.data && <PriceText>Valeur : {formatPrice(value.data[currency], currency)}</PriceText>}
        </div>
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
