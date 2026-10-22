import { Badge, Box, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';

import { type ReactNode, useState } from 'react';

import type { Card } from '../api/types';
import { showCardPreview } from '../layout/cardPreview';
import { withSymbols } from '../scryfall/manaSymbols';
import { StorageLabel } from '../storages/StorageLabel';
import type { StorageName } from '../storages/storageDirectory';
import { FoilSticker, ProxySticker } from '../theme/Sticker';
import type { ContextMenuEvent, ShownFace } from './CardContextMenu';
import type { CardDisplay } from './CardDisplay';
import { CardImage } from './CardImage';
import { cardTileLabel } from './cardTileLabel';
import { CommanderBadge, CommanderInlineMark } from './CommanderMark';
import { GameChangerBadge, GameChangerInlineMark } from './GameChangerMark';
import { CollectionBadge, PendingBadge, type PendingStatus } from './PendingBadge';

export type TileCard = Pick<
  Card,
  'name' | 'scryfall_id' | 'set_code' | 'collector_number' | 'foil' | 'proxy' | 'card_type' | 'mana_value' | 'quantity'
>;

export interface CardTileProps<T extends TileCard = Card> {
  card: T;
  imageUrl: string | undefined;
  backImageUrl?: string;
  imageLoading: boolean;
  storageName?: StorageName;
  pendingStatus?: PendingStatus;
  collectionCount?: number;
  display: Pick<CardDisplay, 'textOnly' | 'compact' | 'stacked' | 'overlapped' | 'showDetails'>;
  commander?: boolean;
  gameChanger?: boolean;
  manaCost?: string | null;
  details?: ReactNode;
  onOpen: (card: T) => void;
  onContextMenu?: (event: ContextMenuEvent, card: T, shown: ShownFace) => void;
}

function ManaCost({ card, manaCost }: { card: TileCard; manaCost: string | null | undefined }) {
  if (manaCost === undefined) {
    return null;
  }
  if (manaCost !== null) {
    return manaCost ? (
      <Text span size="sm" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
        {withSymbols(manaCost)}
      </Text>
    ) : null;
  }
  if (card.card_type === 'Land') {
    return null;
  }
  const manaValue = String(Math.floor(card.mana_value));
  return (
    <Badge size="md" variant="light" color="gray" circle title={`Valeur de mana ${manaValue}`}>
      {manaValue}
    </Badge>
  );
}

function CardRow<T extends TileCard>({
  card,
  commander,
  gameChanger,
  pendingStatus,
  collectionCount,
  manaCost,
  details,
  onOpen,
  onPreview,
  onContextMenu,
}: Pick<
  CardTileProps<T>,
  'card' | 'commander' | 'gameChanger' | 'pendingStatus' | 'collectionCount' | 'manaCost' | 'details' | 'onOpen'
> & {
  onPreview: () => void;
  onContextMenu?: (event: ContextMenuEvent) => void;
}) {
  const quantity = card.quantity ?? 1;
  return (
    <UnstyledButton
      onClick={() => onOpen(card)}
      className="tamiyo-touch-menu"
      onContextMenu={onContextMenu}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      aria-label={cardTileLabel({ name: card.name, quantity, foil: card.foil })}
      display="block"
      w="100%"
    >
      <Paper withBorder px="sm" py={6} radius="md">
        <Group gap="xs" wrap="nowrap" justify="space-between">
          <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            {quantity > 1 && (
              <Text size="sm" fw={600} c={pendingStatus ? 'orange' : 'dimmed'}>
                {quantity}×
              </Text>
            )}
            <Text size="sm" fw={500} truncate>
              {card.name}
            </Text>
            {commander && <CommanderInlineMark />}
            {gameChanger && <GameChangerInlineMark />}
            {card.foil && <FoilSticker />}
            {card.proxy && <ProxySticker />}
            {pendingStatus && <PendingBadge status={pendingStatus} size="xs" />}
            {!pendingStatus && collectionCount !== undefined && collectionCount > 0 && (
              <CollectionBadge owned={collectionCount} size="xs" compact />
            )}
          </Group>
          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            {details}
            <ManaCost card={card} manaCost={manaCost} />
          </Group>
        </Group>
      </Paper>
    </UnstyledButton>
  );
}

export function CardTile<T extends TileCard = Card>({
  card,
  imageUrl,
  backImageUrl,
  imageLoading,
  storageName,
  pendingStatus,
  collectionCount,
  display,
  commander = false,
  gameChanger = false,
  manaCost,
  details,
  onOpen,
  onContextMenu,
}: CardTileProps<T>) {
  const [shownUrl, setShownUrl] = useState<string | undefined>(undefined);
  const onPreview = () =>
    !document.body.dataset.cardDragging &&
    showCardPreview({
      name: card.name,
      scryfallId: card.scryfall_id,
      foil: card.foil,
      imageUrl: shownUrl ?? imageUrl,
      open: () => onOpen(card),
    });
  const shown: ShownFace =
    backImageUrl && shownUrl === backImageUrl ? { face: 'back', imageUrl: backImageUrl } : { face: 'front', imageUrl };
  const openMenu = onContextMenu && ((event: ContextMenuEvent) => onContextMenu(event, card, shown));
  const { textOnly, compact, stacked, overlapped, showDetails } = display;
  if (textOnly) {
    return (
      <CardRow
        card={card}
        commander={commander}
        gameChanger={gameChanger}
        pendingStatus={pendingStatus}
        collectionCount={collectionCount}
        manaCost={manaCost}
        details={details}
        onOpen={onOpen}
        onPreview={onPreview}
        onContextMenu={openMenu}
      />
    );
  }
  const quantity = card.quantity ?? 1;
  const hasCollection = collectionCount !== undefined && collectionCount > 0;
  return (
    <UnstyledButton
      onClick={() => onOpen(card)}
      className="tamiyo-touch-menu tamiyo-card-tile"
      data-stacked={stacked || undefined}
      onContextMenu={openMenu}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      aria-label={cardTileLabel({ name: card.name, quantity, foil: card.foil })}
      display="block"
      w="100%"
    >
      <Stack gap={6}>
        <Box pos="relative">
          <CardImage
            name={card.name}
            url={imageUrl}
            loading={imageLoading}
            backUrl={backImageUrl}
            foil={card.foil}
            onFlip={(url) => {
              setShownUrl(url);
              showCardPreview({
                name: card.name,
                scryfallId: card.scryfall_id,
                foil: card.foil,
                imageUrl: url,
                open: () => onOpen(card),
              });
            }}
          />
          {overlapped && (pendingStatus || hasCollection || commander || gameChanger) && (
            <Group pos="absolute" top={4} left={4} gap={4} wrap="nowrap">
              {pendingStatus ? (
                <PendingBadge status={pendingStatus} size="sm" compact />
              ) : (
                hasCollection && <CollectionBadge owned={collectionCount} size="sm" compact />
              )}
              {commander && <CommanderBadge size="sm" />}
              {gameChanger && <GameChangerBadge size="sm" />}
            </Group>
          )}
          {stacked ? (
            <Group
              pos="absolute"
              top={4}
              right={card.foil ? 'calc(var(--tamiyo-foil-inset) + 4px)' : 4}
              gap={4}
              wrap="nowrap"
            >
              {quantity > 1 && (
                <Badge
                  size="sm"
                  variant="filled"
                  color={pendingStatus ? 'orange' : 'dark'}
                  style={{ boxShadow: 'var(--mantine-shadow-sm)' }}
                >
                  ×{quantity}
                </Badge>
              )}
            </Group>
          ) : (
            <>
              {(commander || gameChanger) && !overlapped && (
                <Group pos="absolute" top={8} left={8} gap={4} wrap="nowrap">
                  {commander && <CommanderBadge />}
                  {gameChanger && <GameChangerBadge />}
                </Group>
              )}
              {quantity > 1 && (
                <Badge
                  pos="absolute"
                  top={8}
                  right={8}
                  size="lg"
                  variant="filled"
                  color={pendingStatus ? 'orange' : 'dark'}
                  style={{ boxShadow: 'var(--mantine-shadow-sm)' }}
                >
                  ×{quantity}
                </Badge>
              )}
            </>
          )}
          {!overlapped && pendingStatus && (
            <Box pos="absolute" bottom={8} left={8}>
              <PendingBadge status={pendingStatus} compact={compact} />
            </Box>
          )}
          {!overlapped && !pendingStatus && hasCollection && (
            <Box pos="absolute" bottom={8} left={8}>
              <CollectionBadge owned={collectionCount} compact={compact} />
            </Box>
          )}
        </Box>
        {showDetails && (
          <div>
            <Text size="sm" fw={500} lineClamp={1}>
              {card.name}
            </Text>
            {details !== undefined ? (
              details
            ) : (
              <Group gap={6} wrap="nowrap">
                <Text size="xs" c="dimmed">
                  {card.set_code.toUpperCase()} · #{card.collector_number}
                </Text>
                {card.foil && <FoilSticker />}
                {card.proxy && <ProxySticker />}
              </Group>
            )}
            {pendingStatus ? (
              <Text size="xs" c="dimmed" fs="italic" lineClamp={1}>
                En attente
              </Text>
            ) : (
              storageName !== undefined && <StorageLabel storage={storageName} />
            )}
          </div>
        )}
      </Stack>
    </UnstyledButton>
  );
}
