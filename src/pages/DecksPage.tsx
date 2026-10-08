import { Alert, Button, Center, Group, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { errorMessage } from '../api/errors';
import { deckArtId } from '../decks/art';
import { capitalize, groupByRecent } from '../layout/groupByRecent';
import { useImportIntoDeck } from '../bulk/api';
import { type DeckInput, useAllDecks, useCreateDeck, useDeleteDeck } from '../decks/api';
import { DeckFormModal, type DeckListSubmission } from '../decks/DeckFormModal';
import { deckListSummary } from '../decks/DeckListInput';
import { DeckTile } from '../decks/DeckTile';
import { useCardArts } from '../scryfall/hooks';

export function DecksPage() {
  const navigate = useNavigate();
  const decks = useAllDecks();
  const arts = useCardArts((decks.data ?? []).map(deckArtId));
  const create = useCreateDeck();
  const importList = useImportIntoDeck();
  const remove = useDeleteDeck();
  const [createOpened, setCreateOpened] = useState(false);
  const [listError, setListError] = useState<unknown>(null);

  function closeCreate() {
    setCreateOpened(false);
    setListError(null);
    create.reset();
    importList.reset();
  }

  function createDeck(values: DeckInput, list?: DeckListSubmission) {
    setListError(null);
    create.mutate(values, {
      onSuccess: (created) => {
        if (!list) {
          notifications.show({ color: 'green', message: `${created.name} a été créé.` });
          closeCreate();
          navigate(`/decks/${created.id}`);
          return;
        }
        importList.mutate(
          { deckId: created.id, ...list },
          {
            onSuccess: (summary) => {
              const skipped = (summary.cards_skipped ?? 0) > 0;
              notifications.show({
                color: skipped ? 'yellow' : 'green',
                autoClose: skipped ? false : undefined,
                title: `${created.name} a été créé`,
                message: `Cartes : ${deckListSummary(summary)}.`,
              });
              closeCreate();
              navigate(`/decks/${created.id}`);
            },
            onError: (err) => {
              setListError(err);
              remove.mutate(created.id);
            },
          },
        );
      },
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Decks</Title>
          {decks.data && (
            <Text size="sm" c="dimmed">
              {decks.data.length} deck{decks.data.length > 1 ? 's' : ''}
            </Text>
          )}
        </div>
        <Button onClick={() => setCreateOpened(true)}>Nouveau deck</Button>
      </Group>

      {decks.error && <Alert color="red">{errorMessage(decks.error)}</Alert>}

      {decks.isLoading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : decks.data?.length === 0 ? (
        <Center p="xl">
          <Text c="dimmed">Aucun deck pour le moment.</Text>
        </Center>
      ) : (
        <Stack gap="xl">
          {groupByRecent(decks.data ?? [], (deck) => deck.format, capitalize).map((group) => (
            <Stack key={group.key} gap="sm">
              <Title order={3} size="h4">
                {group.label}{' '}
                <Text span size="sm" c="dimmed">
                  ({group.items.length})
                </Text>
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {group.items.map((deck) => {
                  const artId = deckArtId(deck);
                  return <DeckTile key={deck.id} deck={deck} art={artId ? (arts.data?.[artId] ?? null) : null} />;
                })}
              </SimpleGrid>
            </Stack>
          ))}
        </Stack>
      )}

      <DeckFormModal
        opened={createOpened}
        onClose={closeCreate}
        title="Nouveau deck"
        submitLabel="Créer"
        pending={create.isPending || importList.isPending}
        error={create.error}
        withList
        listError={listError}
        onSubmit={createDeck}
      />
    </Stack>
  );
}
