import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { Card, CardSort, CreateCardInput, DetailsRefreshSummary, UpdateCardInput } from '../api/types';
import type { CardGrouping } from './grouping';

export interface CardFilters {
  page: number;
  limit: number;
  sort: CardSort;
  group?: CardGrouping;
  name: string;
  storageId: number | undefined;
  colorIdentity?: string;
  stack?: boolean;
}

export function copyIds(card: Card): number[] {
  return card.copy_ids && card.copy_ids.length > 0 ? card.copy_ids : [card.id];
}

export function copyCount(card: Card): number {
  return card.quantity ?? 1;
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
              group: filters.group,
              name: filters.name || undefined,
              storage_id: filters.storageId,
              color_identity: filters.colorIdentity,
              stack: filters.stack,
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

export async function createCopies(card: CreateCardInput, quantity: number): Promise<Card[]> {
  const created: Card[] = [];
  while (created.length < quantity) {
    try {
      created.push(unwrap(await api.POST('/cards', { body: card })));
    } catch (err) {
      throw created.length > 0 ? new PartialCreationError(created.length, quantity, err) : err;
    }
  }
  return created;
}

export function useCreateCards() {
  const invalidate = useInvalidateCollection();

  return useMutation({
    mutationFn: async ({ card, quantity }: { card: CreateCardInput; quantity: number }) => createCopies(card, quantity),
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

export function useUpdateCopies() {
  const invalidate = useInvalidateCollection();

  return useMutation({
    mutationFn: async ({ ids, changes }: { ids: number[]; changes: UpdateCardInput }) => {
      for (const id of ids) {
        unwrap(await api.PATCH('/cards/{id}', { params: { path: { id } }, body: changes }));
      }
    },
    onSettled: invalidate,
  });
}

export function useDeleteCopies() {
  const invalidate = useInvalidateCollection();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        unwrap(await api.DELETE('/cards/{id}', { params: { path: { id } } }));
      }
    },
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
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cards'] }),
        queryClient.invalidateQueries({ queryKey: ['decks'] }),
      ]),
  });
}

export function useCollectionCopies(name: string | null) {
  return useQuery({
    queryKey: ['cards', 'copies', name],
    queryFn: async () => {
      const result = unwrap(
        await api.GET('/cards', { params: { query: { name: name ?? '', limit: 100, sort: 'name' } } }),
      );
      const wanted = (name ?? '').toLowerCase();
      return result.data.filter((card) => card.name.toLowerCase() === wanted);
    },
    enabled: !!name,
  });
}
