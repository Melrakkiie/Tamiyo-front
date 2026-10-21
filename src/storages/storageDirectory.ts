import type { Storage } from '../api/types';

export const UNKNOWN_STORAGE = 'Rangement inconnu';

export type StorageName =
  { kind: 'none' } | { kind: 'loading' } | { kind: 'unknown' } | { kind: 'named'; name: string };

export interface StorageDirectory {
  names: ReadonlyMap<number, string>;
  nameOf: (storageId: number | null | undefined) => StorageName;
  isLocked: (storageId: number | null | undefined) => boolean;
  anyLocked: boolean;
  loaded: boolean;
  has: (storageId: number) => boolean;
}

function isOpenTo(storage: Storage, deckId: string) {
  return !storage.locked || storage.allowed_deck_ids.includes(deckId);
}

export function storageDirectory(storages: Storage[] | undefined, deckId?: string): StorageDirectory {
  const list = storages ?? [];
  const names = new Map(list.map((storage) => [storage.id, storage.name]));
  const locked = new Set(
    deckId === undefined ? [] : list.filter((storage) => !isOpenTo(storage, deckId)).map((storage) => storage.id),
  );
  return {
    names,
    nameOf: (storageId) => {
      if (storageId == null) {
        return { kind: 'none' };
      }
      if (storages === undefined) {
        return { kind: 'loading' };
      }
      const name = names.get(storageId);
      return name === undefined ? { kind: 'unknown' } : { kind: 'named', name };
    },
    isLocked: (storageId) => storageId != null && locked.has(storageId),
    anyLocked: locked.size > 0,
    loaded: storages !== undefined,
    has: (storageId) => names.has(storageId),
  };
}
