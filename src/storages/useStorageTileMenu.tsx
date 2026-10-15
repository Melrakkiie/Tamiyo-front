import { Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import type { Storage } from '../api/types';
import { useUpdateStorage } from './api';
import { StorageDeleteModal } from './StorageDeleteModal';
import { StorageFormModal } from './StorageFormModal';
import { StorageLockModal } from './StorageLockModal';
import { StorageTransferModal } from './StorageTransferModal';

export function useStorageTileMenu() {
  const update = useUpdateStorage();
  const [editing, setEditing] = useState<Storage | null>(null);
  const [locking, setLocking] = useState<Storage | null>(null);
  const [transferring, setTransferring] = useState<Storage | null>(null);
  const [deleting, setDeleting] = useState<Storage | null>(null);

  function closeEdit() {
    setEditing(null);
    update.reset();
  }

  function menuFor(storage: Storage) {
    return (
      <>
        <Menu.Item onClick={() => setTransferring(storage)} disabled={storage.card_count === 0}>
          Transférer les cartes…
        </Menu.Item>
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
      {transferring && <StorageTransferModal storage={transferring} opened onClose={() => setTransferring(null)} />}
      {deleting && <StorageDeleteModal storage={deleting} opened onClose={() => setDeleting(null)} />}
    </>
  );

  return { menuFor, modals };
}
