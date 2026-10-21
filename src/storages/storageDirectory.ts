import type { Storage } from '../api/types';

export const UNKNOWN_STORAGE = 'Rangement inconnu';

export interface StorageDirectory {
  names: ReadonlyMap<number, string>;
  nameOf: (storageId: number | null | undefined) => string | null;
  isLocked: (storageId: number | null | undefined) => boolean;
  anyLocked: boolean;
}

function isOpenTo(storage: Storage, deckId: string) {
  return !storage.locked || storage.allowed_deck_ids.includes(deckId);
}

export function storageDirectory(storages: Storage[], deckId?: string): StorageDirectory {
  const names = new Map(storages.map((storage) => [storage.id, storage.name]));
  const locked = new Set(
    deckId === undefined ? [] : storages.filter((storage) => !isOpenTo(storage, deckId)).map((storage) => storage.id),
  );
  return {
    names,
    nameOf: (storageId) => (storageId == null ? null : (names.get(storageId) ?? UNKNOWN_STORAGE)),
    isLocked: (storageId) => storageId != null && locked.has(storageId),
    anyLocked: locked.size > 0,
  };
}
