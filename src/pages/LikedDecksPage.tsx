import { Alert, Anchor, Center, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

import { errorMessage } from '../api/errors';
import { deckArtId } from '../decks/art';
import { useLikedDecks } from '../decks/likes';
import { PublicDeckTile } from '../decks/PublicDeckTile';
import { capitalize, groupByRecent } from '../layout/groupByRecent';
import { useCardArts } from '../scryfall/hooks';
import { EmptyNote } from '../theme/EmptyNote';
import { usePageTitle } from '../layout/usePageTitle';

export function LikedDecksPage() {
  usePageTitle('Decks aimés');
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
        <EmptyNote title="Tu n'as encore aimé aucun deck" note="clique sur le cœur d'un deck pour le retrouver ici">
          <Anchor component={Link} to="/explorer">
            Aller voir l'explorateur
          </Anchor>
        </EmptyNote>
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
