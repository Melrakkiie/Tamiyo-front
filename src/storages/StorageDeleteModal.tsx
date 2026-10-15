import { Alert, Button, Checkbox, Group, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Storage } from '../api/types';
import { useDeleteStorage } from './api';

interface StorageDeleteModalProps {
  storage: Storage;
  opened: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function StorageDeleteModal({ storage, opened, onClose, onDeleted }: StorageDeleteModalProps) {
  const remove = useDeleteStorage();
  const [withCards, setWithCards] = useState(false);
  const count = storage.card_count;
  const cards = `${count} carte${count > 1 ? 's' : ''}`;

  function close() {
    remove.reset();
    setWithCards(false);
    onClose();
  }

  function submit() {
    remove.mutate(
      { id: storage.id, withCards },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: withCards
              ? `${storage.name} et ses ${cards} ont été supprimés.`
              : `${storage.name} a été supprimé. Ses cartes restent dans ta collection.`,
          });
          close();
          onDeleted?.();
        },
      },
    );
  }

  return (
    <Modal opened={opened} onClose={close} title={`Supprimer ${storage.name} ?`}>
      <Stack>
        {count > 0 && (
          <Checkbox
            label={`Supprimer aussi ses ${cards}`}
            checked={withCards}
            onChange={(event) => setWithCards(event.currentTarget.checked)}
          />
        )}
        <Text size="sm">
          {withCards
            ? `Ses ${cards} seront supprimées de ta collection. Les decks qui les utilisent les gardent dans leurs cartes à récupérer.`
            : 'Ses cartes ne sont pas supprimées : elles restent dans ta collection, sans rangement.'}
        </Text>
        {remove.error && <Alert color="red">{errorMessage(remove.error)}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Annuler
          </Button>
          <Button color="red" onClick={submit} loading={remove.isPending}>
            {withCards ? 'Supprimer le rangement et ses cartes' : 'Supprimer le rangement'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
