import { notifications } from '@mantine/notifications';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import { errorMessage } from '../api/errors';
import type { Deck, DeckFolder } from '../api/types';

const FOLDERS_KEY = ['deckFolders', 'mine'];
const ALL_DECKS_KEY = ['decks', 'all'];

export interface FolderLike {
  id: number;
  name: string;
  parent_id: number | null;
}

export function useDeckFolders() {
  return useQuery({
    queryKey: FOLDERS_KEY,
    queryFn: async () => unwrap(await api.GET('/deck-folders')),
    staleTime: 60_000,
  });
}

export function usePublicFolders(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'folders'],
    queryFn: async () => unwrap(await api.GET('/users/{id}/deck-folders', { params: { path: { id: userId ?? '' } } })),
    enabled: !!userId,
  });
}

function invalidateFolders(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['deckFolders'] }),
    queryClient.invalidateQueries({ queryKey: ['users'] }),
  ]);
}

function invalidateDecks(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['decks'] }),
    queryClient.invalidateQueries({ queryKey: ['users'] }),
  ]);
}

function notifyError(err: unknown) {
  notifications.show({ color: 'red', message: errorMessage(err) });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId: number | null }) =>
      unwrap(await api.POST('/deck-folders', { body: { name, parent_id: parentId } })),
    onSettled: () => invalidateFolders(queryClient),
  });
}

export interface FolderChanges {
  name?: string;
  parent_id?: number;
  clear_parent?: boolean;
  collapsed?: boolean;
}

async function patchCache<T>(queryClient: QueryClient, key: unknown[], update: (current: T) => T) {
  await queryClient.cancelQueries({ queryKey: key });
  const previous = queryClient.getQueryData<T>(key);
  if (previous !== undefined) {
    queryClient.setQueryData<T>(key, update(previous));
  }
  return () => queryClient.setQueryData(key, previous);
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, changes }: { id: number; changes: FolderChanges }) =>
      unwrap(await api.PATCH('/deck-folders/{id}', { params: { path: { id } }, body: changes })),
    onMutate: ({ id, changes }) =>
      patchCache<DeckFolder[]>(queryClient, FOLDERS_KEY, (folders) =>
        folders.map((folder) =>
          folder.id !== id
            ? folder
            : {
                ...folder,
                name: changes.name ?? folder.name,
                collapsed: changes.collapsed ?? folder.collapsed,
                parent_id: changes.clear_parent ? null : (changes.parent_id ?? folder.parent_id),
              },
        ),
      ),
    onError: (err, _variables, rollback) => {
      rollback?.();
      notifyError(err);
    },
    onSettled: () => invalidateFolders(queryClient),
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      unwrap(await api.DELETE('/deck-folders/{id}', { params: { path: { id } } }));
    },
    onError: notifyError,
    onSettled: () => Promise.all([invalidateFolders(queryClient), invalidateDecks(queryClient)]),
  });
}

function patchDeck(queryClient: QueryClient, deckId: string, changes: Partial<Deck>) {
  return Promise.all([
    patchCache<Deck[]>(queryClient, ALL_DECKS_KEY, (decks) =>
      decks.map((deck) => (deck.id === deckId ? { ...deck, ...changes } : deck)),
    ),
    patchCache<Deck>(queryClient, ['decks', 'detail', deckId], (deck) => ({ ...deck, ...changes })),
  ]).then((rollbacks) => () => rollbacks.forEach((rollback) => rollback()));
}

export function useMoveDeckToFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deckId, folderId }: { deckId: string; folderId: number | null }) => {
      unwrap(await api.PUT('/deck/{id}/folder', { params: { path: { id: deckId } }, body: { folder_id: folderId } }));
    },
    onMutate: ({ deckId, folderId }) => patchDeck(queryClient, deckId, { folder_id: folderId }),
    onError: (err, _variables, rollback) => {
      rollback?.();
      notifyError(err);
    },
    onSettled: () => invalidateDecks(queryClient),
  });
}

export function useSetFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deckId, favorite }: { deckId: string; favorite: boolean }) => {
      const params = { params: { path: { id: deckId } } };
      unwrap(favorite ? await api.PUT('/deck/{id}/favorite', params) : await api.DELETE('/deck/{id}/favorite', params));
    },
    onMutate: ({ deckId, favorite }) => patchDeck(queryClient, deckId, { favorite }),
    onError: (err, _variables, rollback) => {
      rollback?.();
      notifyError(err);
    },
    onSettled: () => invalidateDecks(queryClient),
  });
}

export interface FolderNode<F extends FolderLike> {
  folder: F;
  children: FolderNode<F>[];
  decks: Deck[];
  deckCount: number;
}

export interface FolderTree<F extends FolderLike> {
  roots: FolderNode<F>[];
  rootDecks: Deck[];
}

function byName(a: FolderLike, b: FolderLike) {
  return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }) || a.id - b.id;
}

export function buildFolderTree<F extends FolderLike>(folders: F[], decks: Deck[]): FolderTree<F> {
  const nodes = new Map<number, FolderNode<F>>();
  for (const folder of [...folders].sort(byName)) {
    nodes.set(folder.id, { folder, children: [], decks: [], deckCount: 0 });
  }
  const roots: FolderNode<F>[] = [];
  for (const node of nodes.values()) {
    const parent = node.folder.parent_id !== null ? nodes.get(node.folder.parent_id) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  const rootDecks: Deck[] = [];
  for (const deck of decks) {
    const node = deck.folder_id != null ? nodes.get(deck.folder_id) : undefined;
    (node ? node.decks : rootDecks).push(deck);
  }
  const count = (node: FolderNode<F>): number =>
    (node.deckCount = node.decks.length + node.children.reduce((total, child) => total + count(child), 0));
  roots.forEach(count);
  return { roots, rootDecks };
}

export function isInsideFolder(folders: FolderLike[], folderId: number, ancestorId: number) {
  const parents = new Map(folders.map((folder) => [folder.id, folder.parent_id]));
  const seen = new Set<number>();
  for (let current: number | null = folderId; current !== null && !seen.has(current); ) {
    if (current === ancestorId) {
      return true;
    }
    seen.add(current);
    current = parents.get(current) ?? null;
  }
  return false;
}

export function folderPath(folders: FolderLike[], folderId: number) {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const names: string[] = [];
  const seen = new Set<number>();
  for (
    let current = byId.get(folderId);
    current && !seen.has(current.id);
    current = byId.get(current.parent_id ?? -1)
  ) {
    seen.add(current.id);
    names.unshift(current.name);
  }
  return names.join(' / ');
}
