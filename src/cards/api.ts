import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { CardSort, CreateCardInput, UpdateCardInput } from '../api/types';

export interface CardFilters {
  page: number;
  limit: number;
  sort: CardSort;
  name: string;
  storageId: number | undefined;
}

export function useCards(filters: CardFilters) {
  return useQuery({
    queryKey: ['cards', 'list', filters],
    queryFn: async () =>
      unwrap(
        await api.GET('/cards', {
          params: {
            query: {
              page: filters.page,
              limit: filters.limit,
              sort: filters.sort,
              name: filters.name || undefined,
              storage_id: filters.storageId,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateCollection() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cards'] }),
      queryClient.invalidateQueries({ queryKey: ['storages'] }),
    ]);
}

export class PartialCreationError extends Error {
  readonly created: number;
  readonly requested: number;
  readonly reason: unknown;

  constructor(created: number, requested: number, reason: unknown) {
    super('only some copies were created');
    this.name = 'PartialCreationError';
    this.created = created;
    this.requested = requested;
    this.reason = reason;
  }
}

export function useCreateCards() {
  const invalidate = useInvalidateCollection();

  return useMutation({
    mutationFn: async ({ card, quantity }: { card: CreateCardInput; quantity: number }) => {
      for (let created = 0; created < quantity; created++) {
        try {
          unwrap(await api.POST('/cards', { body: card }));
        } catch (err) {
          throw created > 0 ? new PartialCreationError(created, quantity, err) : err;
        }
      }
    },
    onSettled: invalidate,
  });
}

export function useUpdateCard() {
  const invalidate = useInvalidateCollection();

  return useMutation({
    mutationFn: async ({ id, changes }: { id: number; changes: UpdateCardInput }) =>
      unwrap(await api.PATCH('/cards/{id}', { params: { path: { id } }, body: changes })),
    onSettled: invalidate,
  });
}

export function useDeleteCard() {
  const invalidate = useInvalidateCollection();

  return useMutation({
    mutationFn: async (id: number) => {
      unwrap(await api.DELETE('/cards/{id}', { params: { path: { id } } }));
    },
    onSettled: invalidate,
  });
}
