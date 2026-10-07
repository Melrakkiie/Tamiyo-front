import { Badge, Box, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';

import { useState } from 'react';

import type { Card } from '../api/types';
import { showCardPreview } from '../layout/cardPreview';
import { withSymbols } from '../scryfall/manaSymbols';
import { CardImage } from './CardImage';

interface CardTileProps {
  card: Card;
  imageUrl: string | undefined;
  backImageUrl?: string;
  imageLoading: boolean;
  storageName?: string | null;
  notOwned?: boolean;
  textOnly?: boolean;
  manaCost?: string | null;
  onOpen: (card: Card) => void;
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
  notOwned,
  manaCost,
  onOpen,
  onPreview,
}: Pick<CardTileProps, 'card' | 'notOwned' | 'manaCost' | 'onOpen'> & { onPreview: () => void }) {
  const quantity = card.quantity ?? 1;
  return (
    <UnstyledButton
      onClick={() => onOpen(card)}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      aria-label={quantity > 1 ? `${card.name}, ${quantity} exemplaires` : card.name}
    >
      <Paper
        withBorder
        px="sm"
        py={6}
        radius="md"
        style={notOwned ? { borderColor: 'var(--mantine-color-orange-6)', borderWidth: 2 } : undefined}
      >
        <Group gap="xs" wrap="nowrap" justify="space-between">
          <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            {quantity > 1 && (
              <Text size="sm" fw={600} c={notOwned ? 'orange' : 'dimmed'}>
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
          </Group>
          <ManaCost card={card} manaCost={manaCost} />
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
  notOwned,
  textOnly,
  manaCost,
  onOpen,
}: CardTileProps) {
  const [shownUrl, setShownUrl] = useState<string | undefined>(undefined);
  const onPreview = () =>
    showCardPreview({ name: card.name, scryfallId: card.scryfall_id, imageUrl: shownUrl ?? imageUrl });
  if (textOnly) {
    return <CardRow card={card} notOwned={notOwned} manaCost={manaCost} onOpen={onOpen} onPreview={onPreview} />;
  }
  const quantity = card.quantity ?? 1;
  return (
    <UnstyledButton
      onClick={() => onOpen(card)}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      aria-label={quantity > 1 ? `${card.name}, ${quantity} exemplaires` : card.name}
    >
      <Stack gap={6}>
        <Box
          pos="relative"
          style={
            notOwned
              ? {
                  outline: '3px solid var(--mantine-color-orange-6)',
                  outlineOffset: 2,
                  borderRadius: 'var(--mantine-radius-md)',
                }
              : undefined
          }
        >
          <CardImage
            name={card.name}
            url={imageUrl}
            loading={imageLoading}
            backUrl={backImageUrl}
            onFlip={(url) => {
              setShownUrl(url);
              showCardPreview({ name: card.name, scryfallId: card.scryfall_id, imageUrl: url });
            }}
          />
          {quantity > 1 && (
            <Badge
              pos="absolute"
              top={8}
              right={8}
              size="lg"
              variant="filled"
              color={notOwned ? 'orange' : 'dark'}
              style={{ boxShadow: 'var(--mantine-shadow-sm)' }}
            >
              ×{quantity}
            </Badge>
          )}
        </Box>
        <div>
          <Text size="sm" fw={500} lineClamp={1}>
            {card.name}
          </Text>
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
          {notOwned ? (
            <Text size="xs" c="orange" lineClamp={1}>
              Pas dans ta collection
            </Text>
          ) : (
            storageName !== undefined && (
              <Text size="xs" c="dimmed" fs={storageName ? undefined : 'italic'} lineClamp={1}>
                {storageName ?? 'Sans rangement'}
              </Text>
            )
          )}
        </div>
      </Stack>
    </UnstyledButton>
  );
}
