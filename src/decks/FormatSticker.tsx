import { CardsIcon, Sticker } from '../theme/Sticker';

export function FormatSticker({ format, size = 'sm' }: { format: string; size?: 'xs' | 'sm' | 'md' }) {
  return (
    <Sticker tone="lune" icon={<CardsIcon />} size={size} tilt={-2} title={format}>
      {format.toLocaleLowerCase('fr')}
    </Sticker>
  );
}
