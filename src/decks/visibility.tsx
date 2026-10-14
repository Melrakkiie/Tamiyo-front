import type { ReactNode } from 'react';

import type { components } from '../api/schema';
import { GlobeIcon, LinkIcon, LockStickerIcon, Sticker, type StickerTone } from '../theme/Sticker';

export type DeckVisibility = components['schemas']['DeckVisibility'];

interface VisibilityOption {
  value: DeckVisibility;
  label: string;
  description: string;
  tone: StickerTone;
  icon: ReactNode;
}

export const visibilityOptions: VisibilityOption[] = [
  {
    value: 'private',
    label: 'Privé',
    description: 'Toi seul peux voir ce deck.',
    tone: 'paper',
    icon: <LockStickerIcon />,
  },
  {
    value: 'unlisted',
    label: 'Non répertorié',
    description: 'Visible par toute personne qui a son lien.',
    tone: 'ocelle',
    icon: <LinkIcon />,
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Visible par toute personne qui a son lien, et listé sur ton profil.',
    tone: 'prune',
    icon: <GlobeIcon />,
  },
];

export function visibilityOption(visibility: DeckVisibility | undefined) {
  return visibilityOptions.find((option) => option.value === (visibility ?? 'unlisted')) ?? visibilityOptions[1];
}

interface VisibilityStickerProps {
  visibility: DeckVisibility | undefined;
  size?: 'xs' | 'sm' | 'md';
}

export function VisibilitySticker({ visibility, size = 'sm' }: VisibilityStickerProps) {
  const option = visibilityOption(visibility);
  return (
    <Sticker tone={option.tone} icon={option.icon} size={size} tilt={-1} title={option.description}>
      {option.label.toLocaleLowerCase('fr')}
    </Sticker>
  );
}
