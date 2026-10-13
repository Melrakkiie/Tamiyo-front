import { CrownStickerIcon, Sticker } from '../theme/Sticker';

export function CommanderBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <Sticker tone="ocelle" icon={<CrownStickerIcon />} size={size} tilt={-6} title="Commandant" />;
}

export function CommanderInlineMark() {
  return <Sticker tone="ocelle" icon={<CrownStickerIcon />} size="xs" tilt={-6} title="Commandant" />;
}
