import type { DeckBoard } from '../api/types';

// Scryfall ids of the main-board cards (commander and partner included), each once.
export function mainBoardScryfallIds(entries: { board: DeckBoard; scryfall_id: string }[]): string[] {
  return [...new Set(entries.filter((entry) => entry.board === 'main').map((entry) => entry.scryfall_id))];
}
