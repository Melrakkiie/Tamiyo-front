import type { DeckBoardsData } from './boardLayout';
import { BOARDS } from './boards';
import type { SlotTarget } from './commanders';
import { type DeckEntry, entryMatches, entryTargets } from './deckEntries';

export interface OpenedEntryState {
  session: number;
  opened: { targets: SlotTarget[]; entry: DeckEntry } | null;
}

export const closedEntry: OpenedEntryState = { session: 0, opened: null };

export function openEntry(state: OpenedEntryState, entry: DeckEntry): OpenedEntryState {
  return { session: state.session + 1, opened: { targets: entryTargets(entry), entry } };
}

export function closeEntry(state: OpenedEntryState): OpenedEntryState {
  return { session: state.session + 1, opened: null };
}

export function showSwapResult(state: OpenedEntryState, session: number, entry: DeckEntry): OpenedEntryState {
  if (session !== state.session) {
    return state;
  }
  return { session: state.session, opened: { targets: entryTargets(entry), entry } };
}

export function resolveOpenedEntry(state: OpenedEntryState, boards: DeckBoardsData): DeckEntry | null {
  if (!state.opened) {
    return null;
  }
  const stacks = BOARDS.flatMap((board) => boards[board].stacks);
  for (const target of state.opened.targets) {
    const entry = stacks.find((stack) => entryMatches(stack, target));
    if (entry) {
      return entry;
    }
  }
  return null;
}

export function forgetVanishedEntry(state: OpenedEntryState, boards: DeckBoardsData): OpenedEntryState {
  return state.opened && !resolveOpenedEntry(state, boards) ? { session: state.session, opened: null } : state;
}
