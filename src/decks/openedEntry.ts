import type { DeckBoardsData } from './boardLayout';
import { BOARDS } from './boards';
import type { SlotTarget } from './commanders';
import { type DeckEntry, entryMatches } from './deckEntries';

export interface OpenedEntryState {
  session: number;
  opened: { targets: SlotTarget[]; entry: DeckEntry } | null;
}

export const closedEntry: OpenedEntryState = { session: 0, opened: null };

function targetsOf(entry: DeckEntry): SlotTarget[] {
  return entry.kind === 'pending' ? [{ pendingId: entry.pending.id }] : entry.copy_ids.map((cardId) => ({ cardId }));
}

export function openEntry(state: OpenedEntryState, entry: DeckEntry): OpenedEntryState {
  return { session: state.session + 1, opened: { targets: targetsOf(entry), entry } };
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
