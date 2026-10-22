import { CrownStickerIcon } from '../theme/Sticker';
import { CardInlineMark, CardMarkBadge } from './CardMark';

const mark = { tone: 'ocelle', icon: <CrownStickerIcon />, tilt: -6, title: 'Commandant' } as const;

export function CommanderBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <CardMarkBadge {...mark} size={size} />;
}

export function CommanderInlineMark() {
  return <CardInlineMark {...mark} />;
}
