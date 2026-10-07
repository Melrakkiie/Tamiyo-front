import { useSyncExternalStore } from 'react';

export interface PreviewCard {
  name: string;
  scryfallId: string;
  imageUrl: string | undefined;
}

let current: PreviewCard | null = null;
let fallback: PreviewCard | null = null;
const listeners = new Set<() => void>();

function sameCard(a: PreviewCard | null, b: PreviewCard | null) {
  return a === b || (!!a && !!b && a.scryfallId === b.scryfallId && a.imageUrl === b.imageUrl && a.name === b.name);
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

export function setDefaultCardPreview(card: PreviewCard | null) {
  if (!sameCard(fallback, card)) {
    fallback = card;
    notify();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCardPreview() {
  return useSyncExternalStore(subscribe, () => current ?? fallback);
}
