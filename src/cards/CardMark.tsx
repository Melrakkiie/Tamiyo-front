import type { ReactNode } from 'react';

import { Sticker, type StickerProps } from '../theme/Sticker';

type CardMarkProps = Pick<StickerProps, 'tone' | 'tilt' | 'title'> & { icon: ReactNode };

export function CardMarkBadge({ size = 'md', ...mark }: CardMarkProps & { size?: 'sm' | 'md' }) {
  return <Sticker {...mark} size={size} />;
}

export function CardInlineMark(mark: CardMarkProps) {
  return <Sticker {...mark} size="xs" />;
}
