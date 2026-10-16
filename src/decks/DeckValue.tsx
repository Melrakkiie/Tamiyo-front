import { Stack, Text, Tooltip } from '@mantine/core';

import type { Value } from '../api/types';
import { formatPrice, PriceText, type PriceCurrency } from '../cards/price';

const valueScope = 'sans les proxys, la réserve ni les cartes envisagées';

interface DeckValueProps {
  value: Value;
  currency: PriceCurrency;
  onImage?: boolean;
  breakdown?: { owned: Value; pending: Value };
}

export function DeckValue({ value, currency, onImage = false, breakdown }: DeckValueProps) {
  const price = (
    <PriceText
      onImage={onImage}
      fz={20}
      lh={1}
      title={breakdown ? undefined : `Valeur des cartes du deck, ${valueScope}`}
      style={{ flexShrink: 0 }}
    >
      {formatPrice(value[currency], currency)}
    </PriceText>
  );
  if (!breakdown) {
    return price;
  }
  return (
    <Tooltip
      multiline
      withArrow
      label={
        <Stack gap={2}>
          <Text size="sm">Cartes possédées : {formatPrice(breakdown.owned[currency], currency)}</Text>
          <Text size="sm">Cartes en attente : {formatPrice(breakdown.pending[currency], currency)}</Text>
          <Text size="xs" c="dimmed">
            {valueScope}
          </Text>
        </Stack>
      }
    >
      {price}
    </Tooltip>
  );
}
