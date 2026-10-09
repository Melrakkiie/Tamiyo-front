import type { Card } from '../api/types';
import { type CardGroup, type CardGrouping, groupingOptions } from '../cards/grouping';
import { isPendingCard } from './pendingCards';

export type DeckCardGrouping = CardGrouping | 'storage' | 'tag';

export type SharedCardGrouping = CardGrouping | 'tag';

export const sharedGroupingOptions: { value: SharedCardGrouping; label: string }[] = [
  ...groupingOptions,
  { value: 'tag', label: 'Tag' },
];

export const deckGroupingOptions: { value: DeckCardGrouping; label: string }[] = [
  ...groupingOptions,
  { value: 'storage', label: 'Rangement' },
  { value: 'tag', label: 'Tag' },
];

export function parseDeckGrouping(raw: string | null): DeckCardGrouping | null {
  return deckGroupingOptions.find((option) => option.value === raw)?.value ?? null;
}

export function parseSharedGrouping(raw: string | null): SharedCardGrouping | null {
  return sharedGroupingOptions.find((option) => option.value === raw)?.value ?? null;
}

export function groupByTag(cards: Card[], tagsOf: (card: Card) => string[]): CardGroup[] {
  const byTag = new Map<string, Card[]>();
  const untagged: Card[] = [];
  for (const card of cards) {
    const tags = tagsOf(card);
    if (tags.length === 0) {
      untagged.push(card);
    }
    for (const tag of tags) {
      byTag.set(tag, [...(byTag.get(tag) ?? []), card]);
    }
  }
  const groups: CardGroup[] = [...byTag.entries()]
    .map(([label, tagCards]) => ({ label, cards: tagCards, tag: label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  if (untagged.length > 0) {
    groups.push({ label: 'Sans tag', cards: untagged, tag: null });
  }
  return groups;
}

export function groupByStorage(cards: Card[], storageNames: Map<number, string>): CardGroup[] {
  const byStorage = new Map<number, Card[]>();
  const unknownStorage: Card[] = [];
  const withoutStorage: Card[] = [];
  const notOwned: Card[] = [];
  for (const card of cards) {
    if (isPendingCard(card)) {
      notOwned.push(card);
    } else if (card.storage_id == null) {
      withoutStorage.push(card);
    } else if (storageNames.has(card.storage_id)) {
      byStorage.set(card.storage_id, [...(byStorage.get(card.storage_id) ?? []), card]);
    } else {
      unknownStorage.push(card);
    }
  }
  const groups: CardGroup[] = [...byStorage.entries()]
    .map(([storageId, storageCards]) => ({
      label: storageNames.get(storageId) ?? '',
      cards: storageCards,
      storage: true,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  if (unknownStorage.length > 0) {
    groups.push({ label: 'Rangement inconnu', cards: unknownStorage, storage: true });
  }
  if (withoutStorage.length > 0) {
    groups.push({ label: 'Sans rangement', cards: withoutStorage, storage: true });
  }
  if (notOwned.length > 0) {
    groups.push({ label: 'Pas encore dans ta collection', cards: notOwned });
  }
  return groups;
}
