import { Alert, Badge, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { errorMessage } from '../api/errors';
import type { Deck } from '../api/types';
import { artBackground, deckArtId } from '../decks/art';
import { capitalize, groupByRecent } from '../layout/groupByRecent';
import { useAllDecks, useCreateDeck } from '../decks/api';
import { DeckFormModal } from '../decks/DeckFormModal';
import type { CardArt } from '../scryfall/client';
import { useCardArts } from '../scryfall/hooks';

export function DecksPage() {
  const navigate = useNavigate();
  const decks = useAllDecks();
  const arts = useCardArts((decks.data ?? []).map(deckArtId));
  const create = useCreateDeck();
  const [createOpened, setCreateOpened] = useState(false);

  function closeCreate() {
    setCreateOpened(false);
    create.reset();
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
        pending={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (created) => {
              notifications.show({ color: 'green', message: `${created.name} a été créé.` });
              closeCreate();
              navigate(`/decks/${created.id}`);
            },
          })
        }
      />
    </Stack>
  );
}

function DeckTile({ deck, art }: { deck: Deck; art: CardArt | null }) {
  return (
    <Card
      withBorder
      component={Link}
      to={`/decks/${deck.id}`}
      mih={128}
      style={art ? { ...artBackground(art.url), color: 'white' } : undefined}
    >
      <Stack justify="space-between" h="100%" gap="xs">
        <div>
          <Group justify="space-between" wrap="nowrap">
            <Text fw={600} lineClamp={1}>
              {deck.name}
            </Text>
            <Badge variant={art ? 'white' : 'light'}>{deck.format}</Badge>
          </Group>
          <Text size="sm" c={art ? 'gray.3' : 'dimmed'}>
            {deck.card_count} carte{deck.card_count > 1 ? 's' : ''}
          </Text>
        </div>
        {art?.artist && (
          <Text size="xs" c="gray.4" ta="right" lineClamp={1}>
            Illustration : {art.artist}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
