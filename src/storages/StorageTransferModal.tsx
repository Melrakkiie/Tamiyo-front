import { Alert, Button, Group, Modal, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Storage } from '../api/types';
import { useAllStorages, useCreateStorage, useStorageOptions, useTransferStorage } from './api';
import { StorageFormModal } from './StorageFormModal';
import { StorageFieldLabel } from './StorageLabel';

interface StorageTransferModalProps {
  storage: Storage;
  opened: boolean;
  onClose: () => void;
}

export function StorageTransferModal({ storage, opened, onClose }: StorageTransferModalProps) {
  const storages = useAllStorages();
  const storageOptions = useStorageOptions().filter((option) => option.value !== String(storage.id));
  const transfer = useTransferStorage();
  const createStorage = useCreateStorage();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function close() {
    transfer.reset();
    setTargetId(null);
    onClose();
  }

  function closeCreate() {
    setCreating(false);
    createStorage.reset();
  }

  function submit() {
    if (!targetId) {
      return;
    }
    const targetName = storages.data?.find((candidate) => String(candidate.id) === targetId)?.name ?? 'ce rangement';
    transfer.mutate(
      { fromId: storage.id, toId: Number(targetId) },
      {
        onSuccess: ({ cards_moved }) => {
          notifications.show({
            color: 'green',
            message:
              cards_moved === 0
                ? 'Ce rangement est déjà vide.'
                : `${cards_moved} carte${cards_moved > 1 ? 's' : ''} transférée${cards_moved > 1 ? 's' : ''} dans ${targetName}.`,
          });
          close();
        },
      },
    );
  }

  return (
    <Modal opened={opened} onClose={close} title={`Transférer les cartes de ${storage.name}`}>
      <Stack>
        <Stack gap={4}>
          <Select
            label={<StorageFieldLabel>Vers le rangement</StorageFieldLabel>}
            placeholder="Choisis un rangement"
            data={storageOptions}
            value={targetId}
            onChange={setTargetId}
            searchable
            required
          />
          <Group justify="flex-end">
            <Button variant="subtle" size="compact-sm" onClick={() => setCreating(true)}>
              Nouveau rangement…
            </Button>
          </Group>
        </Stack>
        <Text size="xs" c="dimmed">
          Le rangement d'origine est conservé, vide.
        </Text>
        {transfer.error && (
          <Alert color="red">
            {errorMessage(transfer.error, { 400: "Le rangement choisi n'existe plus. Choisis-en un autre." })}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Annuler
          </Button>
          <Button onClick={submit} loading={transfer.isPending} disabled={!targetId}>
            Transférer
          </Button>
        </Group>
      </Stack>
      <StorageFormModal
        opened={creating}
        onClose={closeCreate}
        title="Nouveau rangement"
        submitLabel="Créer"
        pending={createStorage.isPending}
        error={createStorage.error}
        onSubmit={(values) =>
          createStorage.mutate(values, {
            onSuccess: (created) => {
              setTargetId(String(created.id));
              closeCreate();
            },
          })
        }
      />
    </Modal>
  );
}
