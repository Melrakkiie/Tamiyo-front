import type { DeckBoard } from '../api/types';

export const BOARDS: DeckBoard[] = ['main', 'sideboard', 'considering'];

export type CollapsibleBoard = Exclude<DeckBoard, 'main'>;

export const COLLAPSIBLE_BOARDS: CollapsibleBoard[] = ['sideboard', 'considering'];

export const DEFAULT_COLLAPSED_BOARDS: CollapsibleBoard[] = ['considering'];

export const boardLabels: Record<DeckBoard, string> = {
  main: 'Deck principal',
  sideboard: 'Sideboard',
  considering: 'Considering',
};

export const boardOptions = BOARDS.map((board) => ({ value: board, label: boardLabels[board] }));

const listHeaders: Record<DeckBoard, string> = {
  main: 'Deck',
  sideboard: 'Sideboard',
  considering: 'Considering',
};

export function withBoardHeader(line: string, board: DeckBoard) {
  return board === 'main' ? line : `${listHeaders[board]}\n${line}`;
}

export function inBoard<T extends { board: DeckBoard }>(items: T[], board: DeckBoard): T[] {
  return items.filter((item) => item.board === board);
}

const boardDestinations: Record<DeckBoard, string> = {
  main: 'le deck principal',
  sideboard: 'le sideboard',
  considering: 'la section Considering',
};

export function movedMessage(name: string, count: number, board: DeckBoard) {
  return count > 1
    ? `${count} exemplaires de ${name} sont maintenant dans ${boardDestinations[board]}.`
    : `${name} est maintenant dans ${boardDestinations[board]}.`;
}
