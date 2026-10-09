import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';

import type { PublicDeck } from '../api/types';
import { ProfileAvatar } from '../auth/UserAvatar';
import type { CardArt } from '../scryfall/client';
import { withSymbols } from '../scryfall/manaSymbols';
import { artBackground } from './art';

function identitySymbols(identity: string) {
  return identity === '' ? '{C}' : [...identity].map((letter) => `{${letter}}`).join('');
}

export function PublicDeckTile({ deck, art }: { deck: PublicDeck; art: CardArt | null }) {
  const ownerName = deck.owner.display_name || 'Sans pseudo';
  const style = art ? { ...artBackground(art.url), color: 'white' } : undefined;
  const dimmed = art ? 'gray.3' : 'dimmed';

  return (
    <Card withBorder component={Link} to={`/decks/${deck.id}`} mih={150} style={style}>
      <Stack justify="space-between" h="100%" gap="xs">
        <div>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Text fw={600} lineClamp={1} style={{ minWidth: 0 }}>
              {deck.name}
            </Text>
            <Badge variant={art ? 'white' : 'light'} style={{ flexShrink: 0 }}>
              {deck.format}
            </Badge>
          </Group>
          {deck.commander_name && (
            <Text size="sm" c={dimmed} lineClamp={1}>
              {deck.commander_name}
            </Text>
          )}
          <Group gap="xs" mt={4}>
            <Text span size="sm" title={deck.color_identity === '' ? 'Incolore' : `Identité ${deck.color_identity}`}>
              {withSymbols(identitySymbols(deck.color_identity))}
            </Text>
            <Text size="sm" c={dimmed}>
              {deck.card_count} carte{deck.card_count > 1 ? 's' : ''}
            </Text>
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
