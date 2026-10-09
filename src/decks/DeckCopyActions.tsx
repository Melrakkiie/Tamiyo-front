import { Alert, Button, Checkbox, Group, Menu, Modal, Radio, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { errorMessage } from '../api/errors';
import type { DeckBoard } from '../api/types';
import { useStorageOptions } from '../storages/api';
import { StorageFieldLabel } from '../storages/StorageLabel';
import { type CollectMode, useCollectDeck, useDuplicateDeck } from './api';
import { BOARDS, boardLabels } from './boards';

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

export function useDeckCopyActions(deckId: string, mine: boolean) {
  const navigate = useNavigate();
  const duplicate = useDuplicateDeck();
  const [collectOpened, setCollectOpened] = useState(false);

  function duplicateDeck() {
    const notification = notifications.show({ loading: true, autoClose: false, message: 'Copie du deck en cours…' });
    duplicate.mutate(deckId, {
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
        navigate(`/decks/${deck_id}`);
      },
      onError: (error) =>
        notifications.update({
          id: notification,
          loading: false,
          autoClose: true,
          color: 'red',
          message: errorMessage(error, { 502: 'Scryfall ne répond pas : réessaie dans un instant.' }),
        }),
    });
  }

  const menuItems = (
    <>
      <Menu.Item onClick={duplicateDeck} disabled={duplicate.isPending}>
        Dupliquer
      </Menu.Item>
      <Menu.Item onClick={() => setCollectOpened(true)}>Ajouter à ma collection</Menu.Item>
    </>
  );
  const modal = (
    <CollectDeckModal
      key={String(mine)}
      deckId={deckId}
      mine={mine}
      opened={collectOpened}
      onClose={() => setCollectOpened(false)}
    />
  );
  return { menuItems, modal };
}
