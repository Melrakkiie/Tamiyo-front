import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';

import type { Deck } from '../api/types';
import type { CardArt } from '../scryfall/client';
import { artBackground } from './art';
import { visibilityOption } from './visibility';

function totalCards(deck: Deck) {
  return deck.card_count + (deck.pending_count ?? 0);
}

interface DeckTileProps {
  deck: Deck;
  art: CardArt | null;
  to?: string;
  showVisibility?: boolean;
}

export function DeckTile({ deck, art, to = `/decks/${deck.id}`, showVisibility = true }: DeckTileProps) {
  const style = art ? { ...artBackground(art.url), color: 'white' } : undefined;
  const content = (
    <Stack justify="space-between" h="100%" gap="xs">
      <div>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text fw={600} lineClamp={1} style={{ minWidth: 0 }}>
            {deck.name}
          </Text>
          <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
            <Badge variant={art ? 'white' : 'light'}>{deck.format}</Badge>
            {showVisibility && (
              <Badge
                variant={art ? 'white' : 'light'}
                color={visibilityOption(deck.visibility).color}
                size="sm"
                title={visibilityOption(deck.visibility).description}
              >
                {visibilityOption(deck.visibility).label}
              </Badge>
            )}
          </Stack>
        </Group>
        <Text size="sm" c={art ? 'gray.3' : 'dimmed'}>
          {totalCards(deck)} carte{totalCards(deck) > 1 ? 's' : ''}
        </Text>
      </div>
      {art?.artist && (
        <Text size="xs" c="gray.4" ta="right" lineClamp={1}>
          Illustration : {art.artist}
        </Text>
      )}
    </Stack>
  );

  return (
    <Card withBorder component={Link} to={to} mih={128} style={style}>
      {content}
    </Card>
  );
}
