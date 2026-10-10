import { Alert, Anchor, Center, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

import { errorMessage } from '../api/errors';
import { deckArtId } from '../decks/art';
import { useLikedDecks } from '../decks/likes';
import { PublicDeckTile } from '../decks/PublicDeckTile';
import { capitalize, groupByRecent } from '../layout/groupByRecent';
import { useCardArts } from '../scryfall/hooks';

export function LikedDecksPage() {
  const liked = useLikedDecks();
  const decks = liked.data ?? [];
  const arts = useCardArts(decks.map(deckArtId));

  return (
    <Stack gap="xl">
      <Title order={2}>
        Decks aimés{' '}
        {liked.data && (
          <Text span size="lg" c="dimmed">
            ({decks.length})
          </Text>
        )}
      </Title>
      {liked.isLoading ? (
        <Center p="lg">
          <Loader />
        </Center>
      ) : liked.error ? (
        <Alert color="red">{errorMessage(liked.error)}</Alert>
      ) : decks.length === 0 ? (
        <Text size="sm" c="dimmed">
          Tu n'as encore aimé aucun deck : clique sur le cœur d'un deck pour le retrouver ici, par exemple depuis{' '}
          <Anchor component={Link} to="/explorer" size="sm">
            l'explorateur
          </Anchor>
          .
        </Text>
      ) : (
        <Stack gap="xl">
          {groupByRecent(decks, (deck) => deck.format, capitalize).map((group) => (
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
                  return <PublicDeckTile key={deck.id} deck={deck} art={artId ? (arts.data?.[artId] ?? null) : null} />;
                })}
              </SimpleGrid>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
