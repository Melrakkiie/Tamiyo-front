import type { Value } from '../api/types';
import { formatPrice, PriceText, type PriceCurrency } from '../cards/price';

interface DeckValueProps {
  value: Value;
  currency: PriceCurrency;
  onImage?: boolean;
}

export function DeckValue({ value, currency, onImage = false }: DeckValueProps) {
  return (
    <PriceText
      onImage={onImage}
      fz={20}
      lh={1}
      title="Valeur des cartes du deck, sans les proxys, la réserve ni les cartes envisagées"
      style={{ flexShrink: 0 }}
    >
      {formatPrice(value[currency], currency)}
    </PriceText>
  );
}
