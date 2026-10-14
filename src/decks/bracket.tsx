import { GaugeStickerIcon, Sticker, type StickerTone } from '../theme/Sticker';

export const BRACKETS = [1, 2, 3, 4, 5] as const;

const bracketNames: Record<number, string> = {
  1: 'Exhibition',
  2: 'Core',
  3: 'Upgraded',
  4: 'Optimized',
  5: 'cEDH',
};

const bracketTones: Record<number, StickerTone> = {
  1: 'paper',
  2: 'lune',
  3: 'ocelle',
  4: 'prune',
  5: 'prune',
};

export function bracketName(bracket: number) {
  return bracketNames[bracket] ?? '';
}

export const bracketOptions = BRACKETS.map((bracket) => ({
  value: String(bracket),
  label: `${bracket} · ${bracketNames[bracket]}`,
}));

export function GaugeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M13.41 10.59l2.59 -2.59" />
      <path d="M7 12a5 5 0 0 1 5 -5" />
    </svg>
  );
}

interface BracketStickerProps {
  bracket: number | null | undefined;
  size?: 'xs' | 'sm' | 'md';
}

export function BracketSticker({ bracket, size = 'sm' }: BracketStickerProps) {
  if (!bracket) {
    return null;
  }
  return (
    <Sticker
      tone={bracketTones[bracket] ?? 'paper'}
      icon={<GaugeStickerIcon level={bracket} />}
      size={size}
      tilt={2}
      title={`Bracket ${bracket} · ${bracketNames[bracket]}`}
    >
      bracket {bracket}
    </Sticker>
  );
}
