import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { Storage } from '../api/types';

async function fetchAllStorages(): Promise<Storage[]> {
  const storages: Storage[] = [];
  for (let page = 1; ; page++) {
    const result = unwrap(await api.GET('/storage', { params: { query: { page, limit: 100, sort: 'name' } } }));
    storages.push(...result.data);
    if (page >= result.total_pages) {
      return storages;
    }
  }
}

export function useAllStorages() {
  return useQuery({
    queryKey: ['storages', 'all'],
    queryFn: fetchAllStorages,
    staleTime: 60_000,
  });
}

export function useStorageOptions() {
  const { data } = useAllStorages();
  return (data ?? []).map((storage) => ({
    value: String(storage.id),
    label: `${storage.name} (${storage.type})`,
  }));
}
