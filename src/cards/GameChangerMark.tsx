import { BoltStickerIcon } from '../theme/Sticker';
import { CardInlineMark, CardMarkBadge } from './CardMark';

const mark = { tone: 'encre', icon: <BoltStickerIcon />, tilt: 6, title: 'Game changer' } as const;

export function GameChangerBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <CardMarkBadge {...mark} size={size} />;
}

export function GameChangerInlineMark() {
  return <CardInlineMark {...mark} />;
}
