import { Alert, Button, Group, Modal, Select, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck, DeckFolder } from '../api/types';
import {
  folderPath,
  useCreateFolder,
  useDeckFolders,
  useDeleteFolder,
  useMoveDeckToFolder,
  useUpdateFolder,
} from './folders';

export type FolderEdit =
  | { kind: 'create'; parent: DeckFolder | null; deck?: Deck }
  | { kind: 'rename'; folder: DeckFolder }
  | { kind: 'delete'; folder: DeckFolder };

function editTitle(edit: FolderEdit) {
  switch (edit.kind) {
    case 'create':
      if (edit.deck) {
        return `Nouveau dossier pour ${edit.deck.name}`;
      }
      return edit.parent ? `Nouveau dossier dans ${edit.parent.name}` : 'Nouveau dossier';
    case 'rename':
      return `Renommer ${edit.folder.name}`;
    case 'delete':
      return `Supprimer ${edit.folder.name}`;
  }
}

export function FolderEditModal({ edit, onClose }: { edit: FolderEdit | null; onClose: () => void }) {
  return (
    <Modal opened={edit !== null} onClose={onClose} title={edit ? editTitle(edit) : undefined}>
      {edit?.kind === 'delete' ? (
        <DeleteFolderForm folder={edit.folder} onClose={onClose} />
      ) : (
        edit && <FolderNameForm key={edit.kind === 'rename' ? edit.folder.id : 'new'} edit={edit} onClose={onClose} />
      )}
    </Modal>
  );
}

function FolderNameForm({ edit, onClose }: { edit: Exclude<FolderEdit, { kind: 'delete' }>; onClose: () => void }) {
  const create = useCreateFolder();
  const update = useUpdateFolder();
  const move = useMoveDeckToFolder();
  const [name, setName] = useState(edit.kind === 'rename' ? edit.folder.name : '');
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    if (edit.kind === 'create') {
      const deck = edit.deck;
      create.mutate(
        { name: trimmed, parentId: edit.parent?.id ?? null },
        {
          onSuccess: (folder) => {
            if (deck) {
              move.mutate({ deckId: deck.id, folderId: folder.id });
            }
            onClose();
          },
        },
      );
    } else {
      update.mutate({ id: edit.folder.id, changes: { name: trimmed } }, { onSuccess: onClose });
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Stack>
        <TextInput
          label="Nom"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          maxLength={100}
          data-autofocus
        />
        {error && <Alert color="red">{errorMessage(error)}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={pending} disabled={!name.trim()}>
            {edit.kind === 'create' ? 'Créer' : 'Renommer'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

function DeleteFolderForm({ folder, onClose }: { folder: DeckFolder; onClose: () => void }) {
  const remove = useDeleteFolder();
  return (
    <Stack>
      <Text size="sm">
        Les decks et les sous-dossiers de {folder.name} ne sont pas supprimés : ils remontent{' '}
        {folder.parent_id === null ? 'à la racine' : 'dans le dossier parent'}.
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Annuler
        </Button>
        <Button color="red" loading={remove.isPending} onClick={() => remove.mutate(folder.id, { onSuccess: onClose })}>
          Supprimer le dossier
        </Button>
      </Group>
    </Stack>
  );
}

const ROOT = 'root';

export function MoveDeckToFolderModal({ deck, opened, onClose }: { deck: Deck; opened: boolean; onClose: () => void }) {
  const folders = useDeckFolders();
  const move = useMoveDeckToFolder();
  const [value, setValue] = useState<string | null>(null);
  const all = folders.data ?? [];
  const options = [
    { value: ROOT, label: 'Aucun dossier' },
    ...all
      .map((folder) => ({ value: String(folder.id), label: folderPath(all, folder.id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' })),
  ];
  const current = deck.folder_id != null ? String(deck.folder_id) : ROOT;
  const selected = value ?? current;

  function close() {
    setValue(null);
    onClose();
  }

  function submit() {
    const folderId = selected === ROOT ? null : Number(selected);
    move.mutate(
      { deckId: deck.id, folderId },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message:
              folderId === null
                ? `${deck.name} n'est plus dans un dossier.`
                : `${deck.name} est maintenant dans ${folderPath(all, folderId)}.`,
          });
          close();
        },
      },
    );
  }

  return (
    <Modal opened={opened} onClose={close} title={`Ranger ${deck.name}`}>
      <Stack>
        <Select
          label="Dossier"
          data={options}
          value={selected}
          onChange={setValue}
          allowDeselect={false}
          searchable
          nothingFoundMessage="Aucun dossier"
          data-autofocus
        />
        {all.length === 0 && !folders.isLoading && (
          <Text size="sm" c="dimmed">
            Tu n'as pas encore de dossier : crée-en un depuis la page Decks.
          </Text>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Annuler
          </Button>
          <Button onClick={submit} loading={move.isPending} disabled={selected === current}>
            Déplacer
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
