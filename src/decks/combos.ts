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
