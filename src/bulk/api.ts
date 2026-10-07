import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  return useImport((file: File) => postForm('/import/manabox', { file }));
}

export function useImportMoxfieldCollection() {
  return useImport(({ file, storageId }: { file: File; storageId: number }) =>
    postForm('/import/moxfield/collection', { file, storage_id: String(storageId) }),
  );
}

export interface MoxfieldDeckImport {
  file: File;
  name: string;
  format: string;
  commanderFromFirstLine: boolean;
  storageId: number | null;
}

export function useImportMoxfieldDeck() {
  return useImport((input: MoxfieldDeckImport) =>
    postForm('/import/moxfield/deck', {
      file: input.file,
      name: input.name,
      format: input.format,
      commander_from_first_line: String(input.commanderFromFirstLine),
      storage_id: input.storageId ? String(input.storageId) : undefined,
    }),
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

export function useExportCollection() {
  return useMutation({
    mutationFn: (kind: CollectionExport) =>
      kind === 'manabox'
        ? download('/export/manabox', 'ManaBox_Collection_export.csv')
        : download('/export/moxfield/collection', 'Moxfield_Collection_export.csv'),
  });
}

export function useExportDeck() {
  return useMutation({
    mutationFn: (deckId: string) => download(`/export/moxfield/deck/${deckId}`, 'Moxfield_Deck_export.txt'),
  });
}
