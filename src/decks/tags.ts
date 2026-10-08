import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { DeckTags } from '../api/types';

export function cardNameKey(name: string) {
  return name.replaceAll('//', '/').toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}

export type TagsByName = Map<string, string[]>;

export function tagsByName(cards: { name: string; tags: string[] }[]): TagsByName {
  return new Map(cards.filter((card) => card.tags.length > 0).map((card) => [cardNameKey(card.name), card.tags]));
}

export function tagsOf(byName: TagsByName | undefined, name: string): string[] {
  return byName?.get(cardNameKey(name)) ?? [];
}

const tagsKey = (deckId: string) => ['decks', 'tags', deckId];

export function useDeckTags(deckId: string) {
  return useQuery({
    queryKey: tagsKey(deckId),
    queryFn: async () => unwrap(await api.GET('/deck/{id}/tags', { params: { path: { id: deckId } } })),
  });
}

function sortedTags(tags: Iterable<string>) {
  return [...tags].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

function withCardTags(current: DeckTags, name: string, tags: string[]): DeckTags {
  const key = cardNameKey(name);
  const others = current.cards.filter((card) => cardNameKey(card.name) !== key);
  const cards = tags.length > 0 ? [...others, { name, tags: sortedTags(tags) }] : others;
  return { tags: sortedTags(new Set(cards.flatMap((card) => card.tags))), cards };
}

function useInvalidateTags() {
  const queryClient = useQueryClient();
  return (deckId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tagsKey(deckId) }),
      queryClient.invalidateQueries({ queryKey: ['decks', 'detail', deckId] }),
    ]);
}

export function useSetCardTags() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTags();

  return useMutation({
    mutationFn: async ({ deckId, name, tags }: { deckId: string; name: string; tags: string[] }) =>
      unwrap(await api.PUT('/deck/{id}/tags/cards', { params: { path: { id: deckId } }, body: { name, tags } })),
    onMutate: async ({ deckId, name, tags }) => {
      await queryClient.cancelQueries({ queryKey: tagsKey(deckId) });
      const previous = queryClient.getQueryData<DeckTags>(tagsKey(deckId));
      if (previous) {
        queryClient.setQueryData(tagsKey(deckId), withCardTags(previous, name, tags));
      }
      return { previous };
    },
    onError: (_err, { deckId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tagsKey(deckId), context.previous);
      }
    },
    onSettled: (_data, _err, { deckId }) => invalidate(deckId),
  });
}

export function useRenameDeckTag() {
  const invalidate = useInvalidateTags();

  return useMutation({
    mutationFn: async ({ deckId, from, to }: { deckId: string; from: string; to: string }) =>
      unwrap(await api.PATCH('/deck/{id}/tags', { params: { path: { id: deckId } }, body: { from, to } })),
    onSettled: (_data, _err, { deckId }) => invalidate(deckId),
  });
}

export function useDeleteDeckTag() {
  const invalidate = useInvalidateTags();

  return useMutation({
    mutationFn: async ({ deckId, tag }: { deckId: string; tag: string }) =>
      unwrap(await api.DELETE('/deck/{id}/tags', { params: { path: { id: deckId }, query: { tag } } })),
    onSettled: (_data, _err, { deckId }) => invalidate(deckId),
  });
}
