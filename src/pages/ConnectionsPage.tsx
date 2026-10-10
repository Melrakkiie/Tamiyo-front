import { Alert, Anchor, Center, Group, Loader, Pagination, Paper, Stack, Tabs, Text, Title } from '@mantine/core';
import { Link, useParams, useSearchParams } from 'react-router';

import { errorMessage } from '../api/errors';
import type { Connection } from '../api/types';
import { useAccount } from '../auth/account';
import { ProfileAvatar } from '../auth/UserAvatar';
import { type ConnectionKind, connectionTabKeys, useConnections, useFollowStatus, useProfile } from '../users/api';
import { FollowButton } from '../users/FollowButton';

function parseKind(raw: string | null): ConnectionKind {
  return raw === connectionTabKeys.following ? 'following' : 'followers';
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function ConnectionsPage() {
  const id = useParams().id ?? '';
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = parseKind(searchParams.get('onglet'));
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const account = useAccount();
  const profile = useProfile(id);
  const status = useFollowStatus(id);
  const own = account.data?.id === id;

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
        {errorMessage(profile.error, { 400: "Ce profil n'existe pas.", 404: "Ce profil n'existe pas." })}
      </Alert>
    );
  }

  const name = profile.data.display_name || 'Sans pseudo';

  function changeTab(value: string | null) {
    setSearchParams({ onglet: connectionTabKeys[value === 'following' ? 'following' : 'followers'] });
  }

  return (
    <Stack>
      <Anchor component={Link} to={`/users/${id}`} size="sm">
        ← {name}
      </Anchor>
      <Group wrap="nowrap">
        <ProfileAvatar scryfallId={profile.data.avatar_scryfall_id} name={name} size={48} />
        <Title order={2} lineClamp={1}>
          {own ? 'Mes connexions' : `Connexions de ${name}`}
        </Title>
      </Group>
      <Tabs value={kind} onChange={changeTab}>
        <Tabs.List>
          <Tabs.Tab value="followers">Abonnés{status.data ? ` (${status.data.followers_count})` : ''}</Tabs.Tab>
          <Tabs.Tab value="following">Suivis{status.data ? ` (${status.data.following_count})` : ''}</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      <ConnectionList
        userId={id}
        kind={kind}
        page={page}
        own={own}
        viewerId={account.data?.id}
        onPage={(next) =>
          setSearchParams({ onglet: connectionTabKeys[kind], ...(next > 1 ? { page: String(next) } : {}) })
        }
      />
    </Stack>
  );
}

interface ConnectionListProps {
  userId: string;
  kind: ConnectionKind;
  page: number;
  own: boolean;
  viewerId: string | undefined;
  onPage: (page: number) => void;
}

const emptyMessages: Record<ConnectionKind, { own: string; other: string }> = {
  followers: {
    own: 'Personne ne te suit pour le moment.',
    other: 'Personne ne suit ce profil pour le moment.',
  },
  following: {
    own: 'Tu ne suis personne pour le moment : clique sur « Suivre » sur un profil pour le retrouver ici.',
    other: 'Ce profil ne suit personne pour le moment.',
  },
};

function ConnectionList({ userId, kind, page, own, viewerId, onPage }: ConnectionListProps) {
  const connections = useConnections(userId, kind, page);

  if (connections.isLoading) {
    return (
      <Center p="lg">
        <Loader />
      </Center>
    );
  }
  if (connections.error || !connections.data) {
    return <Alert color="red">{errorMessage(connections.error)}</Alert>;
  }
  if (connections.data.data.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {own ? emptyMessages[kind].own : emptyMessages[kind].other}
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {connections.data.data.map((connection) => (
        <ConnectionRow key={connection.id} connection={connection} kind={kind} isViewer={connection.id === viewerId} />
      ))}
      {connections.data.total_pages > 1 && (
        <Center mt="sm">
          <Pagination total={connections.data.total_pages} value={page} onChange={onPage} />
        </Center>
      )}
    </Stack>
  );
}

function ConnectionRow({
  connection,
  kind,
  isViewer,
}: {
  connection: Connection;
  kind: ConnectionKind;
  isViewer: boolean;
}) {
  const name = connection.display_name || 'Sans pseudo';
  const since = dateFormat.format(new Date(connection.since));
  return (
    <Paper withBorder p="sm" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <ProfileAvatar scryfallId={connection.avatar_scryfall_id} name={name} size={40} />
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Anchor
              component={Link}
              to={`/users/${connection.id}`}
              fw={500}
              c={connection.display_name ? undefined : 'dimmed'}
              lineClamp={1}
            >
              {name}
            </Anchor>
            <Text size="xs" c="dimmed">
              {kind === 'followers' ? `Abonné depuis le ${since}` : `Suivi depuis le ${since}`}
            </Text>
          </Stack>
        </Group>
        {!isViewer && (
          <FollowButton userId={connection.id} name={name} followed={connection.followed_by_me} size="xs" />
        )}
      </Group>
    </Paper>
  );
}
