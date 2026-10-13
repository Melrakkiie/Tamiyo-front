import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { Storage } from '../api/types';

export const DEFAULT_STORAGE_TYPES = ['binder', 'box', 'deckbox'];

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

export function isOpenTo(storage: Storage, deckId: string) {
  return !storage.locked || storage.allowed_deck_ids.includes(deckId);
}

export function useStorageOptions() {
  const { data } = useAllStorages();
  return (data ?? []).map((storage) => ({
    value: String(storage.id),
    label: `${storage.name} (${storage.type})`,
  }));
}

export function useStorageTypes() {
  const { data } = useAllStorages();
  return [
    ...new Set([...DEFAULT_STORAGE_TYPES, ...(data ?? []).map((storage) => storage.type.toLowerCase())]),
  ].sort();
}

export function useStorage(id: number) {
  return useQuery({
    queryKey: ['storages', 'detail', id],
    queryFn: async () => unwrap(await api.GET('/storage/{id}', { params: { path: { id } } })),
  });
}

function useInvalidateStorages() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['storages'] });
}

export interface StorageInput {
  name: string;
  type: string;
}

export type StorageChanges = Partial<StorageInput & Pick<Storage, 'locked' | 'allowed_deck_ids'>>;

export function useCreateStorage() {
  const invalidate = useInvalidateStorages();

  return useMutation({
    mutationFn: async (input: StorageInput) => unwrap(await api.POST('/storage', { body: input })),
    onSettled: invalidate,
  });
}

export function useUpdateStorage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, changes }: { id: number; changes: StorageChanges }) =>
      unwrap(await api.PATCH('/storage/{id}', { params: { path: { id } }, body: changes })),
    onSettled: (_data, _error, { changes }) => {
      void queryClient.invalidateQueries({ queryKey: ['storages'] });
      if (changes.locked !== undefined || changes.allowed_deck_ids !== undefined) {
        void queryClient.invalidateQueries({ queryKey: ['cards'] });
        void queryClient.invalidateQueries({ queryKey: ['decks', 'pending'] });
      }
    },
  });
}

export function useDeleteStorage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      unwrap(await api.DELETE('/storage/{id}', { params: { path: { id } } }));
    },
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({
        queryKey: ['storages'],
        predicate: (query) => !(query.queryKey[1] === 'detail' && query.queryKey[2] === id),
      });
      void queryClient.invalidateQueries({ queryKey: ['cards'], refetchType: 'inactive' });
    },
  });
}
