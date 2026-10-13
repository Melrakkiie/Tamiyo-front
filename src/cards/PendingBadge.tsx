import type { ReactNode } from 'react';

import { CheckIcon, HourglassIcon, Sticker, type StickerTone, SwapIcon } from '../theme/Sticker';

export type PendingStatus =
  | { kind: 'missing' }
  | { kind: 'other-printing'; owned: number }
  | { kind: 'owned'; owned: number };

const labels: Record<PendingStatus['kind'], string> = {
  missing: 'Manquante',
  'other-printing': 'Autre édition',
  owned: 'Dans ta collection',
};

const tones: Record<PendingStatus['kind'], StickerTone> = {
  missing: 'prune',
  'other-printing': 'ocelle',
  owned: 'lune',
};

const icons: Record<PendingStatus['kind'], () => ReactNode> = {
  missing: HourglassIcon,
  'other-printing': SwapIcon,
  owned: CheckIcon,
};

function copies(count: number) {
  return `${count} exemplaire${count > 1 ? 's' : ''}`;
}

export function pendingStatusDescription(status: PendingStatus) {
  switch (status.kind) {
    case 'missing':
      return 'Pas dans ta collection, dans aucune édition';
    case 'other-printing':
      return `Tu en as ${copies(status.owned)} dans une autre édition, hors de ce deck`;
    case 'owned':
      return `Tu as ${copies(status.owned)} de cette édition, hors de ce deck`;
  }
}

interface PendingBadgeProps {
  status: PendingStatus;
  compact?: boolean;
  size?: 'xs' | 'sm';
}

export function PendingBadge({ status, compact = false, size = 'sm' }: PendingBadgeProps) {
  const description = pendingStatusDescription(status);
  const Icon = icons[status.kind];
  return (
    <Sticker tone={tones[status.kind]} icon={<Icon />} size={size} tilt={-3} title={description}>
      {compact ? null : labels[status.kind]}
    </Sticker>
  );
}

interface CollectionBadgeProps {
  owned: number;
  compact?: boolean;
  size?: 'xs' | 'sm';
}

export function CollectionBadge({ owned, compact = false, size = 'sm' }: CollectionBadgeProps) {
  const description = `Tu en as ${copies(owned)} dans ta collection, toutes éditions confondues`;
  return (
    <Sticker tone="lune" icon={<CheckIcon />} size={size} tilt={2} title={description}>
      {compact ? null : owned > 1 ? `${owned} dans ta collection` : 'Dans ta collection'}
    </Sticker>
  );
}
