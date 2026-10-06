import { Alert, Badge, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { errorMessage } from '../api/errors';
import { useAllDecks, useCreateDeck } from '../decks/api';
import { DeckFormModal } from '../decks/DeckFormModal';

export function DecksPage() {
  const navigate = useNavigate();
  const decks = useAllDecks();
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
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {decks.data?.map((deck) => (
            <Card key={deck.id} withBorder component={Link} to={`/decks/${deck.id}`}>
              <Group justify="space-between" wrap="nowrap">
                <Text fw={600} lineClamp={1}>
                  {deck.name}
                </Text>
                <Badge variant="light">{deck.format}</Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {deck.card_count} carte{deck.card_count > 1 ? 's' : ''}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
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
