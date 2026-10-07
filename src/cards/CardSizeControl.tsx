import { Input, SegmentedControl } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';

export type CardSize = 'text' | 'small' | 'medium' | 'large';

const sizes: { value: CardSize; label: string }[] = [
  { value: 'text', label: 'Texte' },
  { value: 'small', label: 'Petites' },
  { value: 'medium', label: 'Moyennes' },
  { value: 'large', label: 'Grandes' },
];

const gridColumns: Record<CardSize, { base: number; xs: number; sm: number; lg: number }> = {
  text: { base: 1, xs: 1, sm: 2, lg: 3 },
  small: { base: 3, xs: 4, sm: 6, lg: 8 },
  medium: { base: 2, xs: 3, sm: 4, lg: 6 },
  large: { base: 1, xs: 2, sm: 3, lg: 4 },
};

function isCardSize(value: string): value is CardSize {
  return sizes.some((size) => size.value === value);
}

export function useCardSize() {
  const [size, setSize] = useLocalStorage<CardSize>({
    key: 'tamiyo-card-size',
    defaultValue: 'medium',
    deserialize: (value) => (value && isCardSize(value) ? value : 'medium'),
    serialize: (value) => value,
  });
  return {
    size,
    setSize,
    textOnly: size === 'text',
    gridProps:
      size === 'text'
        ? { cols: gridColumns[size], spacing: 'xs', verticalSpacing: 'xs' }
        : { cols: gridColumns[size], spacing: 'md', verticalSpacing: 'lg' },
  };
}

export function CardSizeControl({ value, onChange }: { value: CardSize; onChange: (size: CardSize) => void }) {
  return (
    <Input.Wrapper label="Affichage des cartes">
      <div>
        <SegmentedControl
          data={sizes}
          value={value}
          onChange={(next) => isCardSize(next) && onChange(next)}
          size="sm"
        />
      </div>
    </Input.Wrapper>
  );
}
