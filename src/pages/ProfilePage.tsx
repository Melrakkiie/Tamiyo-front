import { Alert, Anchor, Center, Flex, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';

import { errorMessage } from '../api/errors';
import { useAccount } from '../auth/account';
import { ProfileAvatar, useAvatarArt } from '../auth/UserAvatar';
import { artCredit, useDeckArts } from '../decks/art';
import type { Deck } from '../api/types';
import { DeckFormatGroups, FolderTreeView } from '../decks/DeckFolderTree';
import { DeckTile } from '../decks/DeckTile';
import { buildFolderTree, usePublicFolders } from '../decks/folders';
import { CheckIcon, Sticker } from '../theme/Sticker';
import { connectionsUrl, useFollowStatus, usePublicDecks, useProfile } from '../users/api';
import { FollowButton } from '../users/FollowButton';
import { usePageTitle } from '../layout/usePageTitle';

export function ProfilePage() {
  const { id } = useParams();
  const account = useAccount();
  const profile = useProfile(id);
  usePageTitle(profile.data ? profile.data.display_name || 'Sans pseudo' : 'Profil');
  const decks = usePublicDecks(id);
  const folders = usePublicFolders(id);
  const [collapsedFolders, setCollapsedFolders] = useState<ReadonlySet<number>>(new Set());
  useEffect(() => {
    if (folders.data?.length) {
      setCollapsedFolders(new Set(folders.data.map((f) => f.id)));
    }
  }, [folders.data]);
  const artOf = useDeckArts(decks.data ?? []);
  const avatarArt = useAvatarArt(profile.data?.avatar_scryfall_id);
  const follow = useFollowStatus(id);
  const own = !!account.data && account.data.id === id;
  const compact = useMediaQuery('(max-width: 36em)') ?? false;

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
    return <DeckTile key={deck.id} deck={deck} art={artOf(deck)} showVisibility={false} />;
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
        <Flex direction={{ base: 'column', xs: 'row' }} align={{ base: 'stretch', xs: 'center' }} gap="md">
          <Group wrap="nowrap" align="center" style={{ flex: 1, minWidth: 0 }}>
            <ProfileAvatar scryfallId={profile.data.avatar_scryfall_id} name={name} size={compact ? 80 : 112} />
            <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
              <Group gap="sm" wrap="wrap">
                <Title order={2} c={profile.data.display_name ? undefined : 'dimmed'} lineClamp={2}>
                  {name}
                </Title>
                {!own && follow.data?.follows_me && (
                  <Sticker tone="lune" icon={<CheckIcon />} tilt={-2}>
                    te suit
                  </Sticker>
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
          </Group>
          {!own && follow.data && (
            <FollowButton userId={profile.data.id} name={name} followed={follow.data.followed_by_me} />
          )}
        </Flex>
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
