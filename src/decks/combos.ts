import type { DeckBoard } from '../api/types';

export interface ComboDeckList {
  main: string[];
  commanders: string[];
}

function queryLines(names: string[]) {
  return encodeURIComponent(names.join('\n'));
}

export function commanderSpellbookUrl({ main, commanders }: ComboDeckList): string {
  return `https://commanderspellbook.com/find-my-combos/?decklist=${queryLines(main)}&commanders=${queryLines(commanders)}`;
}

export interface ComboCard {
  name: string;
  board: DeckBoard;
  commander: boolean;
}

export function comboDeckList(cards: ComboCard[]): ComboDeckList {
  const mainBoard = cards.filter((card) => card.board === 'main');
  const commanders = new Set(mainBoard.filter((card) => card.commander).map((card) => card.name));
  const main = new Set(mainBoard.map((card) => card.name).filter((name) => !commanders.has(name)));
  return { main: [...main], commanders: [...commanders] };
}
