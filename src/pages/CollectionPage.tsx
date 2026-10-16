import { Button, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';

import { CollectionExportMenu } from '../bulk/CollectionExportMenu';
import { CollectionImportModal } from '../bulk/CollectionImportModal';
import { useCards, useCollectionValue } from '../cards/api';
import { CardBrowser } from '../cards/CardBrowser';
import { formatPrice, PriceText, usePriceCurrency } from '../cards/price';
import { usePageTitle } from '../layout/usePageTitle';

function formatCardCount(count: number) {
  return `${count.toLocaleString('fr-FR')} carte${count > 1 ? 's' : ''}`;
}

export function CollectionPage() {
  usePageTitle('Collection');
  const [importOpened, setImportOpened] = useState(false);
  const currency = usePriceCurrency();
  const value = useCollectionValue(currency !== null);
  const copies = useCards({ page: 1, limit: 1, sort: '-updated', name: '', storageId: undefined, advanced: {} });
  const total = copies.data?.total;
  const valueText = currency && value.data ? `Valeur : ${formatPrice(value.data[currency], currency)}` : undefined;
  const summary = [total !== undefined ? formatCardCount(total) : undefined, valueText].filter(Boolean).join(' · ');

  return (
    <Stack>
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Collection</Title>
          {summary && <PriceText>{summary}</PriceText>}
        </div>
        <Group gap="xs" ml="auto">
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
