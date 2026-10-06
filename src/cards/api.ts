import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { CardSort, CreateCardInput, DetailsRefreshSummary, UpdateCardInput } from '../api/types';

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
      queryClient.invalidateQueries({ queryKey: ['decks'] }),
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

export function useDeleteAllCards() {
  const invalidate = useInvalidateCollection();

  return useMutation({
    mutationFn: async () => unwrap(await api.DELETE('/cards', { params: { query: { confirm: true } } })).deleted,
    onSettled: invalidate,
  });
}

export function useCard(id: number | null | undefined) {
  return useQuery({
    queryKey: ['cards', 'detail', id],
    queryFn: async () => unwrap(await api.GET('/cards/{id}', { params: { path: { id: id ?? 0 } } })),
    enabled: !!id,
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

export interface DetailsRefreshProgress {
  updated: number;
  notFound: number;
  remaining: number;
}

export function useRefreshCardDetails(onProgress: (progress: DetailsRefreshProgress) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const progress: DetailsRefreshProgress = { updated: 0, notFound: 0, remaining: 0 };
      let afterId: number | null = 0;
      while (afterId !== null) {
        const batch: DetailsRefreshSummary = unwrap(
          await api.POST('/cards/refresh-details', { params: { query: { after_id: afterId } } }),
        );
        progress.updated += batch.updated;
        progress.notFound += batch.not_found;
        progress.remaining = batch.remaining;
        onProgress({ ...progress });
        afterId = batch.next_after_id;
      }
      return progress;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cards'] }),
  });
}
