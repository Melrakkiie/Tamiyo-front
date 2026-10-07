import { Alert, Anchor, Center, Group, Loader, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Link, useParams } from 'react-router';

import { errorMessage } from '../api/errors';
import { useAccount } from '../auth/account';
import { ProfileAvatar, useAvatarArt } from '../auth/UserAvatar';
import { artCredit, deckArtId } from '../decks/art';
import { DeckTile } from '../decks/DeckTile';
import { sharedDeckPath } from '../decks/shared';
import { capitalize, groupByRecent } from '../layout/groupByRecent';
import { useCardArts } from '../scryfall/hooks';
import { usePublicDecks, useProfile } from '../users/api';

export function ProfilePage() {
  const { id } = useParams();
  const account = useAccount();
  const profile = useProfile(id);
  const decks = usePublicDecks(id);
  const deckArts = useCardArts((decks.data ?? []).map(deckArtId));
  const avatarArt = useAvatarArt(profile.data?.avatar_scryfall_id);
  const own = !!account.data && account.data.id === id;

  if (profile.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  if (!profile.data) {
    return (
      <Alert color="orange">
        {errorMessage(profile.error, {
          400: "Ce profil n'existe pas.",
          404: "Ce profil n'existe pas.",
        })}
      </Alert>
    );
  }

  const name = profile.data.display_name || 'Sans pseudo';
  const publicDecks = decks.data ?? [];

  return (
    <Stack gap="xl">
      <Paper withBorder p="lg" radius="md">
        <Group wrap="nowrap" align="center">
          <ProfileAvatar scryfallId={profile.data.avatar_scryfall_id} name={name} size={112} />
          <Stack gap={4} style={{ minWidth: 0 }}>
            <Title order={2} c={profile.data.display_name ? undefined : 'dimmed'} lineClamp={1}>
              {name}
            </Title>
            {own && (
              <Text size="sm" c="dimmed">
                C'est ton profil, tel que les autres le voient.{' '}
                <Anchor component={Link} to="/settings" size="sm">
                  Modifier
                </Anchor>
              </Text>
            )}
            {avatarArt && (
              <Text size="xs" c="dimmed">
                {artCredit(avatarArt.artist)}
              </Text>
            )}
          </Stack>
        </Group>
      </Paper>

      <Stack gap="sm">
        <Title order={3} size="h4">
          Decks publics{' '}
          {decks.data && (
            <Text span size="sm" c="dimmed">
              ({publicDecks.length})
            </Text>
          )}
        </Title>
        {decks.isLoading ? (
          <Center p="lg">
            <Loader />
          </Center>
        ) : decks.error ? (
          <Alert color="red">{errorMessage(decks.error)}</Alert>
        ) : publicDecks.length === 0 ? (
          <Text size="sm" c="dimmed">
            {own
              ? "Aucun deck public pour le moment : passe un deck en « Public » depuis sa page pour qu'il apparaisse ici."
              : 'Aucun deck public pour le moment.'}
          </Text>
        ) : (
          <Stack gap="xl">
            {groupByRecent(publicDecks, (deck) => deck.format, capitalize).map((group) => (
              <Stack key={group.key} gap="sm">
                <Title order={4} size="h5">
                  {group.label}{' '}
                  <Text span size="sm" c="dimmed">
                    ({group.items.length})
                  </Text>
                </Title>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                  {group.items.map((deck) => {
                    const artId = deckArtId(deck);
                    return (
                      <DeckTile
                        key={deck.id}
                        deck={deck}
                        art={artId ? (deckArts.data?.[artId] ?? null) : null}
                        to={own ? `/decks/${deck.id}` : sharedDeckPath(deck.share_id)}
                        showVisibility={false}
                      />
                    );
                  })}
                </SimpleGrid>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
