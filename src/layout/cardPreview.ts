import { useSyncExternalStore } from 'react';

export interface PreviewCard {
  name: string;
  scryfallId: string;
  imageUrl: string | undefined;
  open?: () => void;
}

let current: PreviewCard | null = null;
let fallback: PreviewCard | null = null;
let fallbackPath: string | null = null;
const listeners = new Set<() => void>();

function sameCard(a: PreviewCard | null, b: PreviewCard | null) {
  return (
    a === b ||
    (!!a && !!b && a.scryfallId === b.scryfallId && a.imageUrl === b.imageUrl && a.name === b.name && a.open === b.open)
  );
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function showCardPreview(card: PreviewCard | null) {
  if (!sameCard(current, card)) {
    current = card;
    notify();
  }
}

export function setDefaultCardPreview(card: PreviewCard | null, path: string | null = null) {
  if (!sameCard(fallback, card) || fallbackPath !== path) {
    fallback = card;
    fallbackPath = card ? path : null;
    notify();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCardPreview(path: string) {
  return useSyncExternalStore(subscribe, () => current ?? (fallbackPath === path ? fallback : null));
}
