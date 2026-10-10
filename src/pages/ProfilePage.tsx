import { Alert, Anchor, Badge, Center, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { errorMessage } from '../api/errors';
import { useAccount } from '../auth/account';
import { ProfileAvatar, useAvatarArt } from '../auth/UserAvatar';
import { artCredit, deckArtId } from '../decks/art';
import type { Deck } from '../api/types';
import { DeckFormatGroups, FolderTreeView } from '../decks/DeckFolderTree';
import { DeckTile } from '../decks/DeckTile';
import { buildFolderTree, usePublicFolders } from '../decks/folders';
import { useCardArts } from '../scryfall/hooks';
import { connectionsUrl, useFollowStatus, usePublicDecks, useProfile } from '../users/api';
import { FollowButton } from '../users/FollowButton';

export function ProfilePage() {
  const { id } = useParams();
  const account = useAccount();
  const profile = useProfile(id);
  const decks = usePublicDecks(id);
  const folders = usePublicFolders(id);
  const [collapsedFolders, setCollapsedFolders] = useState<ReadonlySet<number>>(new Set());
  const deckArts = useCardArts((decks.data ?? []).map(deckArtId));
  const avatarArt = useAvatarArt(profile.data?.avatar_scryfall_id);
  const follow = useFollowStatus(id);
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
  const favorites = publicDecks.filter((deck) => deck.favorite);
  const publicFolders = folders.data ?? [];

  const tile = (deck: Deck) => {
    const artId = deckArtId(deck);
    return (
      <DeckTile
        key={deck.id}
        deck={deck}
        art={artId ? (deckArts.data?.[artId] ?? null) : null}
        showVisibility={false}
      />
    );
  };

  function toggleFolder(folderId: number) {
    setCollapsedFolders((current) => {
      const next = new Set(current);
      if (!next.delete(folderId)) {
        next.add(folderId);
      }
      return next;
    });
  }

  return (
    <Stack gap="xl">
      <Paper withBorder p="lg" radius="md">
        <Group wrap="nowrap" align="center">
          <ProfileAvatar scryfallId={profile.data.avatar_scryfall_id} name={name} size={112} />
          <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
            <Group gap="sm" wrap="nowrap">
              <Title order={2} c={profile.data.display_name ? undefined : 'dimmed'} lineClamp={1}>
                {name}
              </Title>
              {!own && follow.data?.follows_me && (
                <Badge variant="light" color="gray">
                  Te suit
                </Badge>
              )}
            </Group>
            {follow.data && (
              <Group gap="md">
                <Anchor component={Link} to={connectionsUrl(profile.data.id, 'followers')} size="sm" c="dimmed">
                  <Text span fw={600} c="var(--mantine-color-text)">
                    {follow.data.followers_count}
                  </Text>{' '}
                  abonné{follow.data.followers_count > 1 ? 's' : ''}
                </Anchor>
                <Anchor component={Link} to={connectionsUrl(profile.data.id, 'following')} size="sm" c="dimmed">
                  <Text span fw={600} c="var(--mantine-color-text)">
                    {follow.data.following_count}
                  </Text>{' '}
                  suivi{follow.data.following_count > 1 ? 's' : ''}
                </Anchor>
              </Group>
            )}
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
          {!own && follow.data && (
            <FollowButton userId={profile.data.id} name={name} followed={follow.data.followed_by_me} />
          )}
        </Group>
      </Paper>

      {favorites.length > 0 && (
        <Stack gap="sm">
          <Title order={3} size="h4">
            Favoris{' '}
            <Text span size="sm" c="dimmed">
              ({favorites.length})
            </Text>
          </Title>
          <DeckFormatGroups decks={favorites} renderDeck={tile} />
        </Stack>
      )}

      <Stack gap="sm">
        <Title order={3} size="h4">
          Tous les decks{' '}
          {decks.data && (
            <Text span size="sm" c="dimmed">
              ({publicDecks.length})
            </Text>
          )}
        </Title>
        {decks.isLoading || folders.isLoading ? (
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
        ) : publicFolders.length > 0 ? (
          <FolderTreeView
            tree={buildFolderTree(publicFolders, publicDecks)}
            renderDeck={tile}
            isCollapsed={(folder) => collapsedFolders.has(folder.id)}
            onToggle={(folder) => toggleFolder(folder.id)}
          />
        ) : (
          <DeckFormatGroups decks={publicDecks} renderDeck={tile} />
        )}
      </Stack>
    </Stack>
  );
}
