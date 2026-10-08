import { Button, Menu, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { errorMessage } from '../api/errors';
import { type CollectionExport, useExportCollection } from './api';

interface CollectionExportMenuProps {
  storageId?: number;
}

export function CollectionExportMenu({ storageId }: CollectionExportMenuProps) {
  const exportCollection = useExportCollection(storageId);
  const scope = storageId === undefined ? 'Toute ta collection' : 'Les cartes de ce rangement';

  function run(kind: CollectionExport) {
    exportCollection.mutate(kind, {
      onError: (err) => notifications.show({ color: 'red', message: errorMessage(err) }),
    });
  }

  return (
    <Menu position="bottom-end" width={300}>
      <Menu.Target>
        <Button variant="default" loading={exportCollection.isPending}>
          Exporter
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{scope}, en CSV</Menu.Label>
        <Menu.Item onClick={() => run('manabox')}>
          <Text size="sm">Pour ManaBox</Text>
          <Text size="xs" c="dimmed">
            {storageId === undefined
              ? 'Garde les rangements (les cartes sans rangement vont dans « Unsorted »).'
              : 'Le rangement devient un classeur ManaBox.'}
          </Text>
        </Menu.Item>
        <Menu.Item onClick={() => run('moxfield')}>
          <Text size="sm">Pour Moxfield</Text>
          {storageId === undefined && (
            <Text size="xs" c="dimmed">
              Tout regroupé, Moxfield ne connaissant pas les rangements.
            </Text>
          )}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
