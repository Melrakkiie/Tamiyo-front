import { Button, Menu, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { errorMessage } from '../api/errors';
import { type CollectionExport, useExportCollection } from './api';

export function CollectionExportMenu() {
  const exportCollection = useExportCollection();

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
        <Menu.Label>Toute ta collection, en CSV</Menu.Label>
        <Menu.Item onClick={() => run('manabox')}>
          <Text size="sm">Pour ManaBox</Text>
          <Text size="xs" c="dimmed">
            Garde les rangements (les cartes sans rangement vont dans « Unsorted »).
          </Text>
        </Menu.Item>
        <Menu.Item onClick={() => run('moxfield')}>
          <Text size="sm">Pour Moxfield</Text>
          <Text size="xs" c="dimmed">
            Tout regroupé, Moxfield ne connaissant pas les rangements.
          </Text>
        </Menu.Item>
        <Menu.Label>Format Tamiyo (JSON)</Menu.Label>
        <Menu.Item onClick={() => run('tamiyo')}>
          <Text size="sm">Pour Tamiyo</Text>
          <Text size="xs" c="dimmed">
            Tout ce que Tamiyo sait de tes cartes : rangements, éditions exactes, foil et proxys, à réimporter tel quel.
          </Text>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
