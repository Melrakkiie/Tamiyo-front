import { Badge } from '@mantine/core';

export const BRACKETS = [1, 2, 3, 4, 5] as const;

const bracketNames: Record<number, string> = {
  1: 'Exhibition',
  2: 'Core',
  3: 'Upgraded',
  4: 'Optimized',
  5: 'cEDH',
};

const bracketColors: Record<number, string> = {
  1: 'teal',
  2: 'green',
  3: 'yellow',
  4: 'orange',
  5: 'red',
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

interface BracketBadgeProps {
  bracket: number | null | undefined;
  onImage?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export function BracketBadge({ bracket, onImage = false, size = 'sm' }: BracketBadgeProps) {
  if (!bracket) {
    return null;
  }
  return (
    <Badge
      size={size}
      variant={onImage ? 'white' : 'light'}
      color={bracketColors[bracket]}
      leftSection={<GaugeIcon size={size === 'md' ? 14 : 12} />}
      title={`Bracket ${bracket} · ${bracketNames[bracket]}`}
      style={{ flexShrink: 0 }}
    >
      Bracket {bracket}
    </Badge>
  );
}
