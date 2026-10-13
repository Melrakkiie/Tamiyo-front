import type { ReactNode } from 'react';

export type StickerTone = 'prune' | 'lune' | 'ocelle' | 'paper';

interface StickerProps {
  tone: StickerTone;
  icon?: ReactNode;
  children?: ReactNode;
  size?: 'xs' | 'sm' | 'md';
  tilt?: number;
  title?: string;
}

export function Sticker({ tone, icon, children, size = 'sm', tilt = 0, title }: StickerProps) {
  return (
    <span
      className="tamiyo-sticker"
      data-tone={tone}
      data-size={size}
      data-round={children ? undefined : true}
      title={title}
      aria-label={title}
      role={title ? 'img' : undefined}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      {icon}
      {children && <span>{children}</span>}
    </span>
  );
}

function StickerIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="tamiyo-sticker-icon"
    >
      {children}
    </svg>
  );
}

export function HourglassIcon() {
  return (
    <StickerIcon>
      <path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9" />
    </StickerIcon>
  );
}

export function SparkleIcon() {
  return (
    <StickerIcon>
      <path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />
    </StickerIcon>
  );
}

export function CheckIcon() {
  return (
    <StickerIcon>
      <path d="M5 12l5 5 9-10" />
    </StickerIcon>
  );
}

export function SwapIcon() {
  return (
    <StickerIcon>
      <path d="M7 7h11l-3-3M17 17H6l3 3" />
    </StickerIcon>
  );
}

export function PlusIcon() {
  return (
    <StickerIcon>
      <path d="M12 5v14M5 12h14" />
    </StickerIcon>
  );
}

export function ScissorsIcon() {
  return (
    <StickerIcon>
      <path d="M6 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M6 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M8.6 7.6L20 18M8.6 16.4L20 6" />
    </StickerIcon>
  );
}

export function CrownStickerIcon() {
  return (
    <StickerIcon>
      <path d="M12 6l4 6l5 -4l-2 10h-14l-2 -10l5 4z" />
    </StickerIcon>
  );
}

export function FoilSticker({ size = 'xs' }: { size?: 'xs' | 'sm' }) {
  return (
    <Sticker tone="lune" icon={<SparkleIcon />} size={size} tilt={2}>
      foil
    </Sticker>
  );
}

export function ProxySticker({ size = 'xs' }: { size?: 'xs' | 'sm' }) {
  return (
    <Sticker tone="paper" size={size} tilt={-2}>
      proxy
    </Sticker>
  );
}
