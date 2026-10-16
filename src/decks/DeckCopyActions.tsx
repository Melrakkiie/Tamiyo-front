import { Alert, Button, Checkbox, Group, Menu, Modal, Radio, Select, Stack, Text, TextInput } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { errorMessage } from '../api/errors';
import type { DeckBoard } from '../api/types';
import { useAllStorages, useCreateStorage, useStorageOptions } from '../storages/api';
import { StorageFormModal } from '../storages/StorageFormModal';
import { StorageFieldLabel } from '../storages/StorageLabel';
import { type CollectMode, useCollectDeck, useDuplicateDeck, useStoreDeck } from './api';
import { BOARDS, boardLabels } from './boards';
import { FolderIcon } from './DeckFolderTree';
import { useFolderOptions } from './folders';
import { type DeckVisibility, visibilityOption, visibilityOptions } from './visibility';

const DEFAULT_BOARDS: DeckBoard[] = ['main', 'sideboard'];

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? 's' : ''}`;
}

function failedMessage(count: number) {
  return count > 1 ? `${count} cartes n'ont pas pu être ajoutées.` : "Une carte n'a pas pu être ajoutée.";
}

function modeOptions(mine: boolean): { value: CollectMode; label: string; description: string }[] {
  return mine
    ? [
        {
          value: 'pending',
          label: 'Seulement les cartes en attente',
          description: 'Les cartes manquantes du deck sont créées dans ta collection et rangées dans le deck.',
        },
        {
          value: 'all',
          label: 'Toutes les cartes du deck',
          description:
            'Les cartes en attente, plus un exemplaire de plus de chaque carte déjà dans le deck, qui reste hors de tout deck.',
        },
      ]
    : [
        {
          value: 'missing',
          label: 'Seulement celles qui me manquent',
          description:
            "Comptées par nom, quelle que soit l'édition : il n'est ajouté que les exemplaires que tu n'as pas déjà.",
        },
        {
          value: 'all',
          label: 'Toutes',
          description: 'Chaque exemplaire du deck, même ceux que tu as déjà.',
        },
      ];
}

interface CollectDeckModalProps {
  deckId: string;
  mine: boolean;
  opened: boolean;
  onClose: () => void;
}

function CollectDeckModal({ deckId, mine, opened, onClose }: CollectDeckModalProps) {
  const options = modeOptions(mine);
  const storageOptions = useStorageOptions();
  const collect = useCollectDeck();
  const [mode, setMode] = useState<CollectMode>(options[0].value);
  const [boards, setBoards] = useState<DeckBoard[]>(DEFAULT_BOARDS);
  const [storageId, setStorageId] = useState<string | null>(null);

  function close() {
    collect.reset();
    onClose();
  }

  function submit() {
    collect.mutate(
      { deckId, mode, boards, storageId: storageId ? Number(storageId) : null },
      {
        onSuccess: ({ cards_created = 0, warnings }) => {
          notifications.show({
            color: warnings?.length ? 'orange' : 'green',
            message:
              cards_created === 0
                ? 'Aucune carte à ajouter : tu les as déjà toutes.'
                : `${plural(cards_created, 'carte')} ajoutée${cards_created > 1 ? 's' : ''} à ta collection.${
                    warnings?.length ? ` ${failedMessage(warnings.length)}` : ''
                  }`,
          });
          close();
        },
      },
    );
  }

  return (
    <Modal opened={opened} onClose={close} title="Ajouter à ma collection">
      <Stack>
        <Radio.Group value={mode} onChange={(value) => setMode(value as CollectMode)} label="Cartes à ajouter">
          <Stack gap="xs" mt="xs">
            {options.map((option) => (
              <Radio key={option.value} value={option.value} label={option.label} description={option.description} />
            ))}
          </Stack>
        </Radio.Group>
        <Checkbox.Group
          value={boards}
          onChange={(value) => setBoards(value as DeckBoard[])}
          label="Sections du deck"
          error={boards.length === 0 ? 'Choisis au moins une section.' : undefined}
        >
          <Group gap="md" mt="xs">
            {BOARDS.map((board) => (
              <Checkbox key={board} value={board} label={boardLabels[board]} />
            ))}
          </Group>
        </Checkbox.Group>
        <Select
          label={<StorageFieldLabel>Rangement des nouvelles cartes</StorageFieldLabel>}
          placeholder="Aucun rangement"
          data={storageOptions}
          value={storageId}
          onChange={setStorageId}
          clearable
          searchable
        />
        <Text size="xs" c="dimmed">
          Les cartes sont créées dans l'édition et la finition indiquées dans le deck.
        </Text>
        {collect.error && (
          <Alert color="red">
            {errorMessage(collect.error, { 400: "Le rangement choisi n'existe plus. Choisis-en un autre." })}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Annuler
          </Button>
          <Button onClick={submit} loading={collect.isPending} disabled={boards.length === 0}>
            Ajouter
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

interface StoreDeckModalProps {
  deckId: string;
  opened: boolean;
  onClose: () => void;
}

function StoreDeckModal({ deckId, opened, onClose }: StoreDeckModalProps) {
  const storages = useAllStorages();
  const storageOptions = useStorageOptions();
  const store = useStoreDeck();
  const createStorage = useCreateStorage();
  const [boards, setBoards] = useState<DeckBoard[]>(DEFAULT_BOARDS);
  const [storageId, setStorageId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function close() {
    store.reset();
    onClose();
  }

  function closeCreate() {
    setCreating(false);
    createStorage.reset();
  }

  function submit() {
    if (!storageId) {
      return;
    }
    const storageName = storages.data?.find((storage) => String(storage.id) === storageId)?.name ?? 'ce rangement';
    store.mutate(
      { deckId, boards, storageId: Number(storageId) },
      {
        onSuccess: ({ cards_moved }) => {
          notifications.show({
            color: 'green',
            message:
              cards_moved === 0
                ? 'Toutes ces cartes sont déjà dans ce rangement.'
                : `${plural(cards_moved, 'carte')} rangée${cards_moved > 1 ? 's' : ''} dans ${storageName}.`,
          });
          close();
        },
      },
    );
  }

  return (
    <Modal opened={opened} onClose={close} title="Ranger les cartes du deck">
      <Stack>
        <Checkbox.Group
          value={boards}
          onChange={(value) => setBoards(value as DeckBoard[])}
          label="Sections du deck"
          error={boards.length === 0 ? 'Choisis au moins une section.' : undefined}
        >
          <Group gap="md" mt="xs">
            {BOARDS.map((board) => (
              <Checkbox key={board} value={board} label={boardLabels[board]} />
            ))}
          </Group>
        </Checkbox.Group>
        <Stack gap={4}>
          <Select
            label={<StorageFieldLabel>Rangement</StorageFieldLabel>}
            placeholder="Choisis un rangement"
            data={storageOptions}
            value={storageId}
            onChange={setStorageId}
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
          Les cartes en attente ne sont pas concernées.
        </Text>
        {store.error && (
          <Alert color="red">
            {errorMessage(store.error, { 400: "Le rangement choisi n'existe plus. Choisis-en un autre." })}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Annuler
          </Button>
          <Button onClick={submit} loading={store.isPending} disabled={boards.length === 0 || !storageId}>
            Ranger
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
              setStorageId(String(created.id));
              closeCreate();
            },
          })
        }
      />
    </Modal>
  );
}

export interface CopiedDeck {
  id: string;
  name: string;
  folderId: number | null;
}

interface DuplicateDeckModalProps {
  deck: CopiedDeck;
  mine: boolean;
  opened: boolean;
  onClose: () => void;
}

function DuplicateDeckModal({ opened, onClose, ...formProps }: DuplicateDeckModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Dupliquer le deck">
      {opened && <DuplicateDeckForm onClose={onClose} {...formProps} />}
    </Modal>
  );
}

function DuplicateDeckForm({ deck, mine, onClose }: Omit<DuplicateDeckModalProps, 'opened'>) {
  const navigate = useNavigate();
  const duplicate = useDuplicateDeck();
  const folderOptions = useFolderOptions();
  const [folderId, setFolderId] = useState<string | null>(mine && deck.folderId ? String(deck.folderId) : null);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { name: `${deck.name} (copie)`, visibility: 'private' as DeckVisibility },
    validate: { name: isNotEmpty('Nom requis') },
    transformValues: (values) => ({ name: values.name.trim(), visibility: values.visibility }),
  });
  const [visibility, setVisibility] = useState(form.getValues().visibility);
  form.watch('visibility', ({ value }) => setVisibility(value));

  function submit({ name, visibility }: { name: string; visibility: DeckVisibility }) {
    const notification = notifications.show({ loading: true, autoClose: false, message: 'Copie du deck en cours…' });
    duplicate.mutate(
      { deckId: deck.id, name, folderId: folderId ? Number(folderId) : null, visibility },
      {
        onSuccess: ({ deck_id, summary }) => {
          const linked = summary.cards_linked ?? 0;
          const pending = summary.cards_pending ?? 0;
          const skipped = summary.cards_skipped ?? 0;
          notifications.update({
            id: notification,
            loading: false,
            autoClose: true,
            color: skipped > 0 ? 'orange' : 'green',
            message: `Copie créée : ${plural(linked, 'carte')} de ta collection, ${plural(pending, 'carte')} en attente${
              skipped > 0 ? `, ${plural(skipped, 'carte')} introuvable${skipped > 1 ? 's' : ''}` : ''
            }.`,
          });
          onClose();
          navigate(`/decks/${deck_id}`);
        },
        onError: (error) =>
          notifications.update({
            id: notification,
            loading: false,
            autoClose: true,
            color: 'red',
            message: errorMessage(error, {
              400: "Le dossier choisi n'existe plus. Choisis-en un autre.",
              502: 'Scryfall ne répond pas : réessaie dans un instant.',
            }),
          }),
      },
    );
  }

  return (
    <form onSubmit={form.onSubmit(submit)}>
      <Stack>
        <TextInput label="Nom" data-autofocus key={form.key('name')} {...form.getInputProps('name')} />
        <Select
          label="Visibilité"
          description={visibilityOption(visibility).description}
          data={visibilityOptions.map(({ value, label }) => ({ value, label }))}
          allowDeselect={false}
          key={form.key('visibility')}
          {...form.getInputProps('visibility')}
        />
        {folderOptions.length > 0 && (
          <Select
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FolderIcon size={14} />
                Dossier
              </span>
            }
            placeholder="Aucun dossier"
            data={folderOptions}
            value={folderId}
            onChange={setFolderId}
            clearable
            searchable
            nothingFoundMessage="Aucun dossier"
          />
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={duplicate.isPending}>
            Dupliquer
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export function useDeckCopyActions(deck: CopiedDeck, mine: boolean) {
  const [duplicateOpened, setDuplicateOpened] = useState(false);
  const [collectOpened, setCollectOpened] = useState(false);
  const [storeOpened, setStoreOpened] = useState(false);

  const menuItems = (
    <>
      <Menu.Item onClick={() => setDuplicateOpened(true)}>Dupliquer</Menu.Item>
      <Menu.Item onClick={() => setCollectOpened(true)}>Ajouter à ma collection</Menu.Item>
      {mine && <Menu.Item onClick={() => setStoreOpened(true)}>Ranger les cartes…</Menu.Item>}
    </>
  );
  const modal = (
    <>
      <DuplicateDeckModal deck={deck} mine={mine} opened={duplicateOpened} onClose={() => setDuplicateOpened(false)} />
      <CollectDeckModal
        key={String(mine)}
        deckId={deck.id}
        mine={mine}
        opened={collectOpened}
        onClose={() => setCollectOpened(false)}
      />
      {mine && <StoreDeckModal deckId={deck.id} opened={storeOpened} onClose={() => setStoreOpened(false)} />}
    </>
  );
  return { menuItems, modal };
}
