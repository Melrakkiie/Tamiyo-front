import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authFetch } from '../api/client';
import { ApiError } from '../api/errors';
import type { ImportSummary } from '../api/types';
import { API_BASE_URL } from '../config';

async function send(path: string, init: RequestInit): Promise<Response> {
  const response = await authFetch(new Request(`${API_BASE_URL}${path}`, init));
  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw ApiError.from(response, body);
  }
  return response;
}

async function postForm(path: string, fields: Record<string, string | Blob | undefined>): Promise<ImportSummary> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      form.append(key, value);
    }
  }
  const response = await send(path, { method: 'POST', body: form });
  return (await response.json()) as ImportSummary;
}

function useImport<T>(toRequest: (input: T) => Promise<ImportSummary>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toRequest,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cards'] }),
        queryClient.invalidateQueries({ queryKey: ['storages'] }),
        queryClient.invalidateQueries({ queryKey: ['decks'] }),
      ]),
  });
}

export function useImportManaBox() {
  return useImport(({ file, storageId }: { file: File; storageId?: number }) =>
    postForm('/import/manabox', { file, storage_id: storageId === undefined ? undefined : String(storageId) }),
  );
}

export function useImportMoxfieldCollection() {
  return useImport(({ file, storageId }: { file: File; storageId: number }) =>
    postForm('/import/moxfield/collection', { file, storage_id: String(storageId) }),
  );
}

export function useImportCardList() {
  return useImport(({ file, storageId }: { file: File; storageId?: number }) =>
    postForm('/import/list', { file, storage_id: storageId === undefined ? undefined : String(storageId) }),
  );
}

export interface DeckListImport {
  deckId: string;
  file: File;
  commanderFromFirstLine: boolean;
}

export function useImportIntoDeck() {
  return useImport(({ deckId, file, commanderFromFirstLine }: DeckListImport) =>
    postForm(`/deck/${deckId}/import`, { file, commander_from_first_line: String(commanderFromFirstLine) }),
  );
}

function filenameFrom(response: Response, fallback: string) {
  const disposition = response.headers.get('Content-Disposition') ?? '';
  return /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallback;
}

async function download(path: string, fallbackName: string) {
  const response = await send(path, { method: 'GET' });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filenameFrom(response, fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type CollectionExport = 'manabox' | 'moxfield';

const collectionExports: Record<CollectionExport, { path: string; filename: string }> = {
  manabox: { path: '/export/manabox', filename: 'ManaBox_Collection_export.csv' },
  moxfield: { path: '/export/moxfield/collection', filename: 'Moxfield_Collection_export.csv' },
};

export function useExportCollection(storageId?: number) {
  return useMutation({
    mutationFn: (kind: CollectionExport) => {
      const { path, filename } = collectionExports[kind];
      return download(storageId === undefined ? path : `${path}?storage_id=${storageId}`, filename);
    },
  });
}

export type DeckExportFormat = 'moxfield' | 'plain' | 'arena';

export const deckExportFilenames: Record<DeckExportFormat, string> = {
  moxfield: 'Deck_moxfield.txt',
  plain: 'Deck_list.txt',
  arena: 'Deck_arena.txt',
};

export function useDeckExport(deckId: string, format: DeckExportFormat, enabled: boolean) {
  return useQuery({
    queryKey: ['decks', 'export', deckId, format],
    queryFn: async () => (await send(`/deck/${deckId}/export?format=${format}`, { method: 'GET' })).text(),
    enabled,
    staleTime: 0,
  });
}

export function saveText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
