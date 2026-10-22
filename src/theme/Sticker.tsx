import { UnstyledButton } from '@mantine/core';
import type { ReactNode } from 'react';

export type StickerTone = 'prune' | 'lune' | 'ocelle' | 'paper' | 'encre';

interface StickerProps {
  tone: StickerTone;
  icon?: ReactNode;
  children?: ReactNode;
  size?: 'xs' | 'sm' | 'md';
  tilt?: number;
  title?: string;
  action?: ReactNode;
}

export function Sticker({ tone, icon, children, size = 'sm', tilt = 0, title, action }: StickerProps) {
  return (
    <span
      className="tamiyo-sticker"
      data-tone={tone}
      data-size={size}
      data-round={children ? undefined : true}
      title={title}
      aria-label={action ? undefined : title}
      role={title && !action ? 'img' : undefined}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      {icon}
      {children && <span className="tamiyo-sticker-text">{children}</span>}
      {action}
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
      <path d="M5 3h14M5 21h14" />
      <path d="M7 3v3l5 6l-5 6v3h10v-3l-5 -6l5 -6v-3" />
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

export function BoltStickerIcon() {
  return (
    <StickerIcon>
      <path d="M13 3v7h6l-8 11v-7H5l8-11z" />
    </StickerIcon>
  );
}

export function TagIcon() {
  return (
    <StickerIcon>
      <path d="M3 12V4h8l10 10-7 7z" />
      <path d="M7.5 7.5h.01" />
    </StickerIcon>
  );
}

export function CardsIcon() {
  return (
    <StickerIcon>
      <path d="M5.5 8h9a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1 -1.5 1.5h-9a1.5 1.5 0 0 1 -1.5 -1.5v-10a1.5 1.5 0 0 1 1.5 -1.5z" />
      <path d="M8 4h10.5a1.5 1.5 0 0 1 1.5 1.5v11" />
    </StickerIcon>
  );
}

export function LockStickerIcon() {
  return (
    <StickerIcon>
      <path d="M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2z" />
      <path d="M8 11v-4a4 4 0 0 1 8 0v4" />
    </StickerIcon>
  );
}

export function QuestionIcon() {
  return (
    <StickerIcon>
      <path d="M8 8a3.5 3 0 0 1 3.5 -3h1a3.5 3 0 0 1 3.5 3a3 3 0 0 1 -2 3a3 4 0 0 0 -2 4" />
      <path d="M12 19v.01" />
    </StickerIcon>
  );
}

export function LinkIcon() {
  return (
    <StickerIcon>
      <path d="M10 14a4 4 0 0 0 5.66 0l3 -3a4 4 0 0 0 -5.66 -5.66l-1 1" />
      <path d="M14 10a4 4 0 0 0 -5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1 -1" />
    </StickerIcon>
  );
}

export function GlobeIcon() {
  return (
    <StickerIcon>
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </StickerIcon>
  );
}

export function GaugeStickerIcon({ level }: { level: number }) {
  return (
    <StickerIcon>
      <path d="M3 17a9 9 0 0 1 18 0" />
      <path d="M12 17h-6.5" transform={`rotate(${(level - 1) * 45} 12 17)`} />
      <circle cx={12} cy={17} r={1.6} fill={level >= 5 ? 'currentColor' : 'none'} />
    </StickerIcon>
  );
}

function CrossIcon() {
  return (
    <StickerIcon>
      <path d="M7 7l10 10M17 7L7 17" />
    </StickerIcon>
  );
}

const TAG_TONES: StickerTone[] = ['lune', 'ocelle', 'prune', 'paper'];
const TAG_TILTS = [-3, -1, 2, 3];

function tagHash(tag: string) {
  let hash = 0;
  for (const char of tag.toLocaleLowerCase('fr')) {
    hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  }
  return hash;
}

interface TagStickerProps {
  tag: string;
  size?: 'xs' | 'sm' | 'md';
  onRemove?: () => void;
  disabled?: boolean;
}

export function TagSticker({ tag, size = 'sm', onRemove, disabled }: TagStickerProps) {
  const hash = tagHash(tag);
  return (
    <Sticker
      tone={TAG_TONES[hash % 4]}
      tilt={TAG_TILTS[(hash >> 2) % 4]}
      size={size}
      icon={<TagIcon />}
      title={tag}
      action={
        onRemove && (
          <UnstyledButton
            className="tamiyo-sticker-remove"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Retirer le tag ${tag}`}
          >
            <CrossIcon />
          </UnstyledButton>
        )
      }
    >
      {tag}
    </Sticker>
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
