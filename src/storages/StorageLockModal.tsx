import { Alert, Button, Group, Modal, MultiSelect, Stack, Switch, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Storage } from '../api/types';
import { useAllDecks } from '../decks/api';
import { useUpdateStorage } from './api';

interface StorageLockModalProps {
  storage: Storage;
  opened: boolean;
  onClose: () => void;
}

export function StorageLockModal({ storage, opened, onClose }: StorageLockModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Verrouiller pour les decks">
      {opened && <StorageLockForm storage={storage} onClose={onClose} />}
    </Modal>
  );
}

function StorageLockForm({ storage, onClose }: { storage: Storage; onClose: () => void }) {
  const decks = useAllDecks();
  const update = useUpdateStorage();
  const [locked, setLocked] = useState(storage.locked);
  const [allowed, setAllowed] = useState<string[]>(storage.allowed_deck_ids);
  const options = (decks.data ?? []).map((deck) => ({ value: deck.id, label: deck.name }));

  function save() {
    update.mutate(
      { id: storage.id, changes: { locked, allowed_deck_ids: allowed } },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: locked ? `${storage.name} est verrouillé.` : `${storage.name} est ouvert à tous les decks.`,
          });
          onClose();
        },
      },
    );
  }

  return (
    <Stack>
      <Text size="sm" c="dimmed">
        Les decks ne piochent plus dans un rangement verrouillé : ses cartes ne comptent plus comme possédées pour leurs
        cartes en attente, et les imports ou duplications de decks ne les prennent pas. Tu peux toujours y ajouter une
        carte à la main, et les cartes déjà dans un deck y restent.
      </Text>
      {update.error && <Alert color="red">{errorMessage(update.error)}</Alert>}
      {decks.error && <Alert color="red">{errorMessage(decks.error)}</Alert>}
      <Switch
        label="Verrouiller ce rangement"
        checked={locked}
        onChange={(event) => setLocked(event.currentTarget.checked)}
      />
      <MultiSelect
        label="Decks autorisés à piocher dedans"
        description="Laisse vide pour le fermer à tous les decks."
        placeholder={allowed.length === 0 ? 'Aucun deck' : undefined}
        data={options}
        value={allowed}
        onChange={setAllowed}
        disabled={!locked}
        searchable
        clearable
        nothingFoundMessage="Aucun deck"
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={save} loading={update.isPending}>
          Enregistrer
        </Button>
      </Group>
    </Stack>
  );
}
