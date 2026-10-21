import { useMemo } from 'react';

import { useAllStorages } from './api';
import { storageDirectory, type StorageDirectory } from './storageDirectory';

export function useStorageDirectory(deckId?: string): StorageDirectory {
  const { data } = useAllStorages();
  return useMemo(() => storageDirectory(data, deckId), [data, deckId]);
}
