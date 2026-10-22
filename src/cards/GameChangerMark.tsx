import { BoltStickerIcon, Sticker } from '../theme/Sticker';

export function GameChangerBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <Sticker tone="encre" icon={<BoltStickerIcon />} size={size} tilt={6} title="Game changer" />;
}

export function GameChangerInlineMark() {
  return <Sticker tone="encre" icon={<BoltStickerIcon />} size="xs" tilt={6} title="Game changer" />;
}
