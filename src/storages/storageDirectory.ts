import type { Storage } from '../api/types';

export const UNKNOWN_STORAGE = 'Rangement inconnu';

export interface StorageDirectory {
  names: ReadonlyMap<number, string>;
  nameOf: (storageId: number | null | undefined) => string | null;
}

export function storageDirectory(storages: Storage[]): StorageDirectory {
  const names = new Map(storages.map((storage) => [storage.id, storage.name]));
  return {
    names,
    nameOf: (storageId) => (storageId == null ? null : (names.get(storageId) ?? UNKNOWN_STORAGE)),
  };
}
