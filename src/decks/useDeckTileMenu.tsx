import { Button, Group, Menu, Modal, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck, DeckFolder } from '../api/types';
import { useDeleteDeck, useUpdateDeck } from './api';
import { DeckFormModal } from './DeckFormModal';
import { type FolderEdit, FolderEditModal } from './FolderModals';
import { folderPath, useMoveDeckToFolder } from './folders';
import { visibilityOptions } from './visibility';

function notifyError(err: unknown) {
  notifications.show({ color: 'red', message: errorMessage(err) });
}

export function useDeckTileMenu(folders: DeckFolder[]) {
  const update = useUpdateDeck();
  const remove = useDeleteDeck();
  const move = useMoveDeckToFolder();
  const [editing, setEditing] = useState<Deck | null>(null);
  const [deleting, setDeleting] = useState<Deck | null>(null);
  const [folderEdit, setFolderEdit] = useState<FolderEdit | null>(null);

  const targets = folders
    .map((folder) => ({ folder, path: folderPath(folders, folder.id) }))
    .sort((a, b) => a.path.localeCompare(b.path, 'fr', { sensitivity: 'base' }));

  function moveTo(deck: Deck, folderId: number | null) {
    move.mutate(
      { deckId: deck.id, folderId },
      {
        onSuccess: () =>
          notifications.show({
            color: 'green',
            message:
              folderId === null
                ? `${deck.name} n'est plus dans un dossier.`
                : `${deck.name} est maintenant dans ${folderPath(folders, folderId)}.`,
          }),
      },
    );
  }

  function closeEdit() {
    setEditing(null);
    update.reset();
  }

  function menuFor(deck: Deck) {
    const current = folders.find((folder) => folder.id === deck.folder_id);
    return (
      <>
        {visibilityOptions
          .filter((option) => option.value !== deck.visibility)
          .map((option) => (
            <Menu.Item
              key={option.value}
              onClick={() =>
                update.mutate(
                  { id: deck.id, changes: { visibility: option.value } },
                  {
                    onSuccess: () =>
                      notifications.show({
                        color: 'green',
                        message: `${deck.name} est maintenant ${option.label.toLowerCase()}.`,
                      }),
                    onError: notifyError,
                  },
                )
              }
            >
              Passer en {option.label.toLowerCase()}
            </Menu.Item>
          ))}
        <Menu.Item onClick={() => setEditing(deck)}>Paramètres</Menu.Item>
        <Menu.Divider />
        <Menu.Item color="red" onClick={() => setDeleting(deck)}>
          Supprimer le deck
        </Menu.Item>
        {current && (
          <Menu.Item color="red" onClick={() => moveTo(deck, current.parent_id)}>
            Retirer de {current.name}
          </Menu.Item>
        )}
        <Menu.Divider />
        {targets
          .filter(({ folder }) => folder.id !== deck.folder_id)
          .map(({ folder, path }) => (
            <Menu.Item key={folder.id} onClick={() => moveTo(deck, folder.id)}>
              Déplacer vers {path}
            </Menu.Item>
          ))}
        {targets.length > (current ? 1 : 0) && <Menu.Divider />}
        <Menu.Item onClick={() => setFolderEdit({ kind: 'create', parent: null, deck })}>
          Déplacer vers un nouveau dossier
        </Menu.Item>
      </>
    );
  }

  const modals = (
    <>
      <DeckFormModal
        opened={editing !== null}
        onClose={closeEdit}
        title={editing ? `Paramètres de ${editing.name}` : ''}
        submitLabel="Enregistrer"
        initial={editing ?? undefined}
        pending={update.isPending}
        error={update.error}
        onSubmit={(values) =>
          editing &&
          update.mutate(
            { id: editing.id, changes: { ...values, clear_bracket: values.bracket === undefined } },
            {
              onSuccess: () => {
                notifications.show({ color: 'green', message: 'Deck mis à jour.' });
                closeEdit();
              },
            },
          )
        }
      />
      <Modal
        opened={deleting !== null}
        onClose={() => setDeleting(null)}
        title={deleting ? `Supprimer ${deleting.name} ?` : undefined}
      >
        <Text size="sm">Ses cartes ne sont pas supprimées : elles restent dans ta collection.</Text>
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
                onError: notifyError,
              })
            }
          >
            Supprimer le deck
          </Button>
        </Group>
      </Modal>
      <FolderEditModal edit={folderEdit} onClose={() => setFolderEdit(null)} />
    </>
  );

  return { menuFor, modals };
}
