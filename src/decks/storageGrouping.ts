import { type CardGroup, type CardGrouping, groupingOptions, noSubtypeLabel } from '../cards/grouping';
import { UNKNOWN_STORAGE } from '../storages/storageDirectory';
import type { DeckEntry } from './deckEntries';

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

export function groupByTag<T>(cards: T[], tagsOf: (card: T) => string[]): CardGroup<T>[] {
  const byTag = new Map<string, T[]>();
  const untagged: T[] = [];
  for (const card of cards) {
    const tags = tagsOf(card);
    if (tags.length === 0) {
      untagged.push(card);
    }
    for (const tag of tags) {
      byTag.set(tag, [...(byTag.get(tag) ?? []), card]);
    }
  }
  const groups: CardGroup<T>[] = [...byTag.entries()]
    .map(([label, tagCards]) => ({ label, cards: tagCards, tag: label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  if (untagged.length > 0) {
    groups.push({ label: 'Sans tag', cards: untagged, tag: null });
  }
  return groups;
}

export function groupBySubtype<T>(cards: T[], subtypesOf: (card: T) => string[]): CardGroup<T>[] {
  const bySubtype = new Map<string, T[]>();
  const withoutSubtype: T[] = [];
  for (const card of cards) {
    const subtypes = subtypesOf(card);
    if (subtypes.length === 0) {
      withoutSubtype.push(card);
    }
    for (const subtype of subtypes) {
      bySubtype.set(subtype, [...(bySubtype.get(subtype) ?? []), card]);
    }
  }
  const groups: CardGroup<T>[] = [...bySubtype.entries()]
    .map(([label, subtypeCards]) => ({ label, cards: subtypeCards }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }));
  if (withoutSubtype.length > 0) {
    groups.push({ label: noSubtypeLabel, cards: withoutSubtype });
  }
  return groups;
}

export function groupByStorage<E extends DeckEntry>(
  entries: E[],
  storageNames: ReadonlyMap<number, string>,
): CardGroup<E>[] {
  const byStorage = new Map<number, E[]>();
  const unknownStorage: E[] = [];
  const withoutStorage: E[] = [];
  const notOwned: E[] = [];
  for (const card of entries) {
    if (card.kind === 'pending') {
      notOwned.push(card);
    } else if (card.storage_id == null) {
      withoutStorage.push(card);
    } else if (storageNames.has(card.storage_id)) {
      byStorage.set(card.storage_id, [...(byStorage.get(card.storage_id) ?? []), card]);
    } else {
      unknownStorage.push(card);
    }
  }
  const groups: CardGroup<E>[] = [...byStorage.entries()]
    .map(([storageId, storageCards]) => ({
      label: storageNames.get(storageId) ?? '',
      cards: storageCards,
      storage: true,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  if (unknownStorage.length > 0) {
    groups.push({ label: UNKNOWN_STORAGE, cards: unknownStorage, storage: true });
  }
  if (withoutStorage.length > 0) {
    groups.push({ label: 'Sans rangement', cards: withoutStorage, storage: true });
  }
  if (notOwned.length > 0) {
    groups.unshift({ label: 'Pas encore dans ta collection', cards: notOwned });
  }
  return groups;
}
