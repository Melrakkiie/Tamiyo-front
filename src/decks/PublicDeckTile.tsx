import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';

import type { PublicDeck } from '../api/types';
import { ProfileAvatar } from '../auth/UserAvatar';
import type { CardArt } from '../scryfall/client';
import { isCommanderFormat } from './api';
import { artBackground } from './art';
import { BracketBadge } from './bracket';
import { ColorIdentity } from './ColorIdentity';
import { LikeCount } from './LikeButton';

export function PublicDeckTile({ deck, art }: { deck: PublicDeck; art: CardArt | null }) {
  const ownerName = deck.owner.display_name || 'Sans pseudo';
  const style = art ? { ...artBackground(art.url), color: 'white' } : undefined;
  const dimmed = art ? 'gray.3' : 'dimmed';

  return (
    <Card withBorder component={Link} to={`/decks/${deck.id}`} mih={150} style={style}>
      <Stack justify="space-between" h="100%" gap="xs">
        <div>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={4} style={{ minWidth: 0 }}>
              <Text fw={600} lineClamp={1}>
                {deck.name}
              </Text>
              <ColorIdentity identity={deck.color_identity} />
            </Stack>
            <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
              <Badge variant={art ? 'white' : 'light'}>{deck.format}</Badge>
              {isCommanderFormat(deck.format) && <BracketBadge bracket={deck.bracket} onImage={art !== null} />}
            </Stack>
          </Group>
          {deck.commander_name && (
            <Text size="sm" c={dimmed} lineClamp={1}>
              {deck.commander_name}
            </Text>
          )}
          <Group gap="xs" mt={4}>
            <Text size="sm" c={dimmed}>
              {deck.card_count} carte{deck.card_count > 1 ? 's' : ''}
            </Text>
            <LikeCount count={deck.likes_count} onImage={art !== null} />
          </Group>
        </div>
        <Group gap="xs" wrap="nowrap" justify="space-between">
          <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            <ProfileAvatar scryfallId={deck.owner.avatar_scryfall_id} name={ownerName} size={22} />
            <Text size="xs" c={dimmed} lineClamp={1}>
              {ownerName}
            </Text>
          </Group>
          {art?.artist && (
            <Text size="xs" c="gray.4" lineClamp={1} style={{ flexShrink: 1, minWidth: 0 }}>
              Illustration : {art.artist}
            </Text>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
