import { Alert, Badge, Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { useDeckTags, useDeleteDeckTag, useRenameDeckTag } from './tags';

interface DeckTagsModalProps {
  deckId: string;
  opened: boolean;
  onClose: () => void;
}

export function DeckTagsModal({ deckId, opened, onClose }: DeckTagsModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Tags du deck">
      {opened && <DeckTagsList deckId={deckId} />}
    </Modal>
  );
}

function DeckTagsList({ deckId }: { deckId: string }) {
  const deckTags = useDeckTags(deckId);
  const tags = deckTags.data?.tags ?? [];
  const cards = deckTags.data?.cards ?? [];

  if (deckTags.error) {
    return <Alert color="red">{errorMessage(deckTags.error)}</Alert>;
  }

  return (
    <Stack>
      <Text size="sm" c="dimmed">
        Ajoute des tags depuis le détail d'une carte du deck, puis groupe les cartes par tag. Renommer un tag avec le
        nom d'un autre les fusionne.
      </Text>
      {!deckTags.isLoading && tags.length === 0 && <Text size="sm">Aucun tag dans ce deck pour le moment.</Text>}
      {tags.map((tag) => (
        <TagRow key={tag} deckId={deckId} tag={tag} count={cards.filter((card) => card.tags.includes(tag)).length} />
      ))}
    </Stack>
  );
}

function TagRow({ deckId, tag, count }: { deckId: string; tag: string; count: number }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const rename = useRenameDeckTag();
  const remove = useDeleteDeckTag();
  const trimmed = name.trim();

  function submitRename() {
    if (!trimmed || trimmed === tag) {
      setEditing(false);
      return;
    }
    rename.mutate({ deckId, from: tag, to: trimmed }, { onSuccess: () => setEditing(false) });
  }

  if (editing) {
    return (
      <Stack gap={4}>
        <Group gap="xs" wrap="nowrap">
          <TextInput
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && submitRename()}
            maxLength={40}
            style={{ flex: 1 }}
            aria-label={`Nouveau nom pour ${tag}`}
            autoFocus
          />
          <Button onClick={submitRename} loading={rename.isPending} disabled={!trimmed}>
            Renommer
          </Button>
          <Button variant="default" onClick={() => setEditing(false)}>
            Annuler
          </Button>
        </Group>
        {rename.error && (
          <Text size="xs" c="red">
            {errorMessage(rename.error)}
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
          <Badge variant="light" size="lg" style={{ textTransform: 'none' }} maw={240}>
            {tag}
          </Badge>
          <Text size="sm" c="dimmed">
            {count} carte{count > 1 ? 's' : ''}
          </Text>
        </Group>
        {confirmingDelete ? (
          <Group gap="xs" wrap="nowrap">
            <Button
              size="xs"
              color="red"
              loading={remove.isPending}
              onClick={() => remove.mutate({ deckId, tag }, { onSuccess: () => setConfirmingDelete(false) })}
            >
              Supprimer
            </Button>
            <Button size="xs" variant="default" onClick={() => setConfirmingDelete(false)}>
              Annuler
            </Button>
          </Group>
        ) : (
          <Group gap={4} wrap="nowrap">
            <Button size="xs" variant="subtle" onClick={() => setEditing(true)}>
              Renommer
            </Button>
            <Button size="xs" variant="subtle" color="red" onClick={() => setConfirmingDelete(true)}>
              Supprimer
            </Button>
          </Group>
        )}
      </Group>
      {remove.error && (
        <Text size="xs" c="red">
          {errorMessage(remove.error)}
        </Text>
      )}
    </Stack>
  );
}
