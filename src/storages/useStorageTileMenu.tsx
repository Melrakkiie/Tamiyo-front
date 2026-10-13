import { Button, Group, Menu, Modal, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Storage } from '../api/types';
import { useDeleteStorage, useUpdateStorage } from './api';
import { StorageFormModal } from './StorageFormModal';
import { StorageLockModal } from './StorageLockModal';

export function useStorageTileMenu() {
  const update = useUpdateStorage();
  const remove = useDeleteStorage();
  const [editing, setEditing] = useState<Storage | null>(null);
  const [locking, setLocking] = useState<Storage | null>(null);
  const [deleting, setDeleting] = useState<Storage | null>(null);

  function closeEdit() {
    setEditing(null);
    update.reset();
  }

  function menuFor(storage: Storage) {
    return (
      <>
        <Menu.Item onClick={() => setEditing(storage)}>Modifier</Menu.Item>
        <Menu.Item onClick={() => setLocking(storage)}>Verrouiller pour les decks…</Menu.Item>
        <Menu.Item color="red" onClick={() => setDeleting(storage)}>
          Supprimer
        </Menu.Item>
      </>
    );
  }

  const modals = (
    <>
      <StorageFormModal
        opened={editing !== null}
        onClose={closeEdit}
        title="Modifier le rangement"
        submitLabel="Enregistrer"
        initial={editing ?? undefined}
        pending={update.isPending}
        error={update.error}
        onSubmit={(values) =>
          editing &&
          update.mutate(
            { id: editing.id, changes: values },
            {
              onSuccess: () => {
                notifications.show({ color: 'green', message: 'Rangement mis à jour.' });
                closeEdit();
              },
            },
          )
        }
      />
      {locking && <StorageLockModal storage={locking} opened onClose={() => setLocking(null)} />}
      <Modal
        opened={deleting !== null}
        onClose={() => setDeleting(null)}
        title={deleting ? `Supprimer ${deleting.name} ?` : undefined}
      >
        <Text size="sm">Ses cartes ne sont pas supprimées : elles restent dans ta collection, sans rangement.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDeleting(null)}>
            Annuler
          </Button>
          <Button
            color="red"
            loading={remove.isPending}
            onClick={() =>
              deleting &&
              remove.mutate(deleting.id, {
                onSuccess: () => {
                  notifications.show({
                    color: 'green',
                    message: `${deleting.name} a été supprimé. Ses cartes restent dans ta collection.`,
                  });
                  setDeleting(null);
                },
                onError: (err) => notifications.show({ color: 'red', message: errorMessage(err) }),
              })
            }
          >
            Supprimer le rangement
          </Button>
        </Group>
      </Modal>
    </>
  );

  return { menuFor, modals };
}
