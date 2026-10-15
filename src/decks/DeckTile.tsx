import { Card, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';

import type { Deck } from '../api/types';
import type { ContextMenuEvent } from '../cards/CardContextMenu';
import type { CardArt } from '../scryfall/client';
import { isCommanderFormat } from './api';
import { artBackground } from './art';
import { tapeProps } from '../theme/tape';
import { BracketSticker } from './bracket';
import { ColorIdentity } from './ColorIdentity';
import { FavoriteToggle } from './FavoriteStar';
import { FormatSticker } from './FormatSticker';
import { LikeCount } from './LikeButton';
import { VisibilitySticker } from './visibility';

const TILE_HEIGHT = 152;

function totalCards(deck: Deck) {
  return deck.card_count + (deck.pending_count ?? 0);
}

interface DeckTileProps {
  deck: Deck;
  art: CardArt | null;
  to?: string;
  showVisibility?: boolean;
  onToggleFavorite?: () => void;
  onContextMenu?: (event: ContextMenuEvent) => void;
}

export function DeckTile({
  deck,
  art,
  to = `/decks/${deck.id}`,
  showVisibility = true,
  onToggleFavorite,
  onContextMenu,
}: DeckTileProps) {
  const style = art ? { ...artBackground(art.url), color: 'white' } : undefined;
  const content = (
    <Stack justify="space-between" h="100%" gap="xs">
      <div>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4} style={{ minWidth: 0 }}>
            <Group gap={4} wrap="nowrap">
              {onToggleFavorite && (
                <FavoriteToggle favorite={!!deck.favorite} onToggle={onToggleFavorite} onImage={art !== null} />
              )}
              <Text ff="heading" fw={600} size="lg" lineClamp={1}>
                {deck.name}
              </Text>
            </Group>
            {deck.color_identity != null && <ColorIdentity identity={deck.color_identity} />}
          </Stack>
          <Stack gap={6} align="flex-end" style={{ flexShrink: 0 }}>
            <FormatSticker format={deck.format} />
            {isCommanderFormat(deck.format) && <BracketSticker bracket={deck.bracket} />}
            {showVisibility && <VisibilitySticker visibility={deck.visibility} />}
          </Stack>
        </Group>
        <Group gap="xs">
          <Text size="sm" c={art ? 'gray.3' : 'dimmed'}>
            {totalCards(deck)} carte{totalCards(deck) > 1 ? 's' : ''}
          </Text>
          <LikeCount count={deck.likes_count} onImage={art !== null} />
        </Group>
      </div>
      {art?.artist && (
        <Text size="xs" c="gray.4" ta="right" lineClamp={1}>
          Illustration : {art.artist}
        </Text>
      )}
    </Stack>
  );

  return (
    <div {...tapeProps(deck.id)}>
      <Card
        withBorder
        shadow="sm"
        component={Link}
        to={to}
        h={TILE_HEIGHT}
        style={style}
        className="tamiyo-touch-menu"
        onContextMenu={onContextMenu}
      >
        {content}
      </Card>
    </div>
  );
}
