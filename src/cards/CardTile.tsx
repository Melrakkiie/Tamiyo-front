import { Badge, Box, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';

import { type ReactNode, useState } from 'react';

import type { Card } from '../api/types';
import { showCardPreview } from '../layout/cardPreview';
import { withSymbols } from '../scryfall/manaSymbols';
import { StorageLabel } from '../storages/StorageLabel';
import type { ContextMenuEvent } from './CardContextMenu';
import { CardImage } from './CardImage';
import { CollectionBadge, PendingBadge, type PendingStatus } from './PendingBadge';

interface CardTileProps {
  card: Card;
  imageUrl: string | undefined;
  backImageUrl?: string;
  imageLoading: boolean;
  storageName?: string | null;
  pendingStatus?: PendingStatus;
  collectionCount?: number;
  compact?: boolean;
  textOnly?: boolean;
  manaCost?: string | null;
  details?: ReactNode;
  onOpen: (card: Card) => void;
  onContextMenu?: (event: ContextMenuEvent, card: Card) => void;
}

function ManaCost({ card, manaCost }: { card: Card; manaCost: string | null | undefined }) {
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

function CardRow({
  card,
  pendingStatus,
  collectionCount,
  manaCost,
  details,
  onOpen,
  onPreview,
  onContextMenu,
}: Pick<
  CardTileProps,
  'card' | 'pendingStatus' | 'collectionCount' | 'manaCost' | 'details' | 'onOpen' | 'onContextMenu'
> & {
  onPreview: () => void;
}) {
  const quantity = card.quantity ?? 1;
  return (
    <UnstyledButton
      onClick={() => onOpen(card)}
      onContextMenu={onContextMenu && ((event) => onContextMenu(event, card))}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      aria-label={quantity > 1 ? `${card.name}, ${quantity} exemplaires` : card.name}
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
            {card.foil && (
              <Badge size="xs" variant="light">
                Foil
              </Badge>
            )}
            {card.proxy && (
              <Badge size="xs" variant="light" color="gray">
                Proxy
              </Badge>
            )}
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

export function CardTile({
  card,
  imageUrl,
  backImageUrl,
  imageLoading,
  storageName,
  pendingStatus,
  collectionCount,
  compact,
  textOnly,
  manaCost,
  details,
  onOpen,
  onContextMenu,
}: CardTileProps) {
  const [shownUrl, setShownUrl] = useState<string | undefined>(undefined);
  const onPreview = () =>
    !document.body.dataset.cardDragging &&
    showCardPreview({
      name: card.name,
      scryfallId: card.scryfall_id,
      imageUrl: shownUrl ?? imageUrl,
      open: () => onOpen(card),
    });
  if (textOnly) {
    return (
      <CardRow
        card={card}
        pendingStatus={pendingStatus}
        collectionCount={collectionCount}
        manaCost={manaCost}
        details={details}
        onOpen={onOpen}
        onPreview={onPreview}
        onContextMenu={onContextMenu}
      />
    );
  }
  const quantity = card.quantity ?? 1;
  return (
    <UnstyledButton
      onClick={() => onOpen(card)}
      onContextMenu={onContextMenu && ((event) => onContextMenu(event, card))}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      aria-label={quantity > 1 ? `${card.name}, ${quantity} exemplaires` : card.name}
    >
      <Stack gap={6}>
        <Box pos="relative">
          <CardImage
            name={card.name}
            url={imageUrl}
            loading={imageLoading}
            backUrl={backImageUrl}
            onFlip={(url) => {
              setShownUrl(url);
              showCardPreview({
                name: card.name,
                scryfallId: card.scryfall_id,
                imageUrl: url,
                open: () => onOpen(card),
              });
            }}
          />
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
          {pendingStatus && (
            <Box pos="absolute" bottom={8} left={8}>
              <PendingBadge status={pendingStatus} compact={compact} />
            </Box>
          )}
          {!pendingStatus && collectionCount !== undefined && collectionCount > 0 && (
            <Box pos="absolute" bottom={8} left={8}>
              <CollectionBadge owned={collectionCount} compact={compact} />
            </Box>
          )}
        </Box>
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
              {card.foil && (
                <Badge size="xs" variant="light">
                  Foil
                </Badge>
              )}
              {card.proxy && (
                <Badge size="xs" variant="light" color="gray">
                  Proxy
                </Badge>
              )}
            </Group>
          )}
          {pendingStatus ? (
            <Text size="xs" c="dimmed" fs="italic" lineClamp={1}>
              En attente
            </Text>
          ) : (
            storageName !== undefined && <StorageLabel name={storageName} />
          )}
        </div>
      </Stack>
    </UnstyledButton>
  );
}
