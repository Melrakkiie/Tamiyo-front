import { useEffect, useState } from 'react';

import type { DeckBoardsData } from './boardLayout';
import type { DeckEntry } from './deckEntries';
import type { EditionSource } from './EditionSwitcher';
import {
  closedEntry,
  closeEntry,
  forgetVanishedEntry,
  openEntry,
  resolveOpenedEntry,
  showSwapResult,
} from './openedEntry';

interface OpenedEntryOptions {
  refreshing: boolean;
  imageUrl: (entry: DeckEntry) => string | undefined;
  imagesFetching: boolean;
}

export interface OpenedEntry {
  entry: DeckEntry | null;
  imageUrl: string | undefined;
  loading: boolean;
  open: (entry: DeckEntry) => void;
  close: () => void;
  showSwapped: (next: EditionSource) => void;
}

export function useOpenedEntry(
  boards: DeckBoardsData,
  { refreshing, imageUrl, imagesFetching }: OpenedEntryOptions,
): OpenedEntry {
  const [state, setState] = useState(closedEntry);
  const live = resolveOpenedEntry(state, boards);
  const vanished = state.opened !== null && live === null && !refreshing;
  useEffect(() => {
    if (vanished) {
      setState((current) => forgetVanishedEntry(current, boards));
    }
  }, [vanished, boards]);

  const entry = live ?? state.opened?.entry ?? null;
  const image = entry ? imageUrl(entry) : undefined;
  const { session } = state;
  return {
    entry,
    imageUrl: image,
    loading: entry !== null && (live === null || (!image && imagesFetching)),
    open: (next) => setState((current) => openEntry(current, next)),
    close: () => setState(closeEntry),
    showSwapped: (next) => setState((current) => showSwapResult(current, session, next)),
  };
}
